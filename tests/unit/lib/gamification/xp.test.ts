// =============================================================================
// Tests: XP System — awardXP critical paths
// Prueft: Idempotency-Check, Daily-Cap, Call-Order, 23505-Race-Detection
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { awardXP, DAILY_XP_LIMIT } from "@/lib/gamification/xp";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRedis = {
  get: vi.fn(),
  incrby: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
};

vi.mock("@/lib/api/rate-limit", () => ({
  getRedis: vi.fn(() => mockRedis),
}));

// ---------------------------------------------------------------------------
// Supabase Mock Factory
// ---------------------------------------------------------------------------

/**
 * Builds a minimal Supabase mock with per-table/operation overrides.
 * The chain object must handle:
 *   .from("xp_log").select(...).eq(...).eq(...).eq(...).limit(1).maybeSingle()
 *   .rpc("award_xp", ...)
 *   .from("xp_log").insert(...)
 *   .from("notifications").insert(...)
 */
function buildSupabaseMock(opts: {
  /**
   * When true, the mock expects a xp_log SELECT before the INSERT
   * (i.e. the caller will pass an idempotencyKey to awardXP).
   * When false (default), the first from("xp_log") call is the INSERT.
   */
  hasIdempotencySelect?: boolean;
  idempotencyCheckData?: { id: string } | null;
  rpcData?: Array<{ new_xp: number; new_level: number; leveled_up: boolean }>;
  rpcError?: { message: string; code?: string };
  xpLogInsertError?: { message: string; code?: string } | null;
}) {
  const {
    hasIdempotencySelect = false,
    idempotencyCheckData = null,
    rpcData = [{ new_xp: 200, new_level: 2, leveled_up: false }],
    rpcError,
    xpLogInsertError = null,
  } = opts;

  // xp_log select chain (for idempotency check)
  const xpLogSelectChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: idempotencyCheckData,
      error: null,
    }),
  };

  // xp_log insert (for audit log)
  const xpLogInsert = vi.fn().mockResolvedValue({
    data: null,
    error: xpLogInsertError,
  });

  // notifications insert
  const notificationsInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  // from() returns different chains depending on table + call order.
  // When hasIdempotencySelect=true, xp_log is called twice: SELECT then INSERT.
  // When hasIdempotencySelect=false, the SELECT is skipped — first call is INSERT.
  let xpLogCallCount = 0;
  const from = vi.fn((table: string) => {
    if (table === "xp_log") {
      xpLogCallCount++;
      if (hasIdempotencySelect && xpLogCallCount === 1) {
        return xpLogSelectChain;
      }
      return { insert: xpLogInsert };
    }
    if (table === "notifications") {
      return { insert: notificationsInsert };
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
  });

  // rpc mock
  const rpc = vi.fn().mockResolvedValue(
    rpcError
      ? { data: null, error: rpcError }
      : { data: rpcData, error: null },
  );

  return {
    supabase: { from, rpc } as unknown as Parameters<typeof awardXP>[0],
    xpLogSelectChain,
    xpLogInsert,
    notificationsInsert,
    rpc,
    from,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = "user-xp-test-123";
const ACTION = "post_created";
const AMOUNT = 50;
const IDEMPOTENCY_KEY = "idempotency-key-abc";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("awardXP — idempotency pre-check hits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null and does NOT call rpc when xp_log already has a row for the key", async () => {
    const { supabase, rpc } = buildSupabaseMock({
      hasIdempotencySelect: true,
      idempotencyCheckData: { id: "existing-row-id" },
    });

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT, IDEMPOTENCY_KEY);

    expect(result).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("awardXP — daily cap exceeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null and does NOT call rpc when Redis indicates cap would be exceeded", async () => {
    // currentDailyXp = DAILY_XP_LIMIT - 1, so adding AMOUNT pushes it over
    mockRedis.get.mockResolvedValue(DAILY_XP_LIMIT - AMOUNT + 1);

    const { supabase, rpc } = buildSupabaseMock({});

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT);

    expect(result).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("awardXP — daily-cap-order-correctness (Redis after RPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT call redis.incrby when rpc fails", async () => {
    mockRedis.get.mockResolvedValue(0);

    const { supabase } = buildSupabaseMock({
      rpcError: { message: "DB error" },
    });

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT);

    expect(result).toBeNull();
    expect(mockRedis.incrby).not.toHaveBeenCalled();
  });

  it("calls redis.incrby AFTER rpc succeeds (call-order assertion)", async () => {
    const callOrder: string[] = [];
    mockRedis.get.mockResolvedValue(0);
    mockRedis.incrby.mockImplementation(async () => {
      callOrder.push("redis.incrby");
      return 1;
    });

    const { supabase, rpc } = buildSupabaseMock({});

    // Wrap rpc to record order
    const originalRpc = rpc.getMockImplementation();
    rpc.mockImplementation(async (...args) => {
      callOrder.push("rpc");
      return originalRpc ? originalRpc(...args) : { data: [{ new_xp: 200, new_level: 2, leveled_up: false }], error: null };
    });

    await awardXP(supabase, USER_ID, ACTION, AMOUNT);

    const rpcIdx = callOrder.indexOf("rpc");
    const redisIdx = callOrder.indexOf("redis.incrby");
    expect(rpcIdx).toBeGreaterThanOrEqual(0);
    expect(redisIdx).toBeGreaterThan(rpcIdx);
  });
});

describe("awardXP — 23505 race detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null and logs xp_double_award_race when xp_log insert fails with code 23505", async () => {
    mockRedis.get.mockResolvedValue(0);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { supabase } = buildSupabaseMock({
      hasIdempotencySelect: true,
      idempotencyCheckData: null, // pre-check returns no row → proceeds
      xpLogInsertError: { message: "duplicate key", code: "23505" },
    });

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT, IDEMPOTENCY_KEY);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "[XP] xp_double_award_race",
      expect.objectContaining({ event: "xp_double_award_race" }),
    );

    warnSpy.mockRestore();
  });
});
