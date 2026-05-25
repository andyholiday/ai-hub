// =============================================================================
// Tests: XP System — awardXP (new DB-side idempotency via award_xp_idempotent)
// Covers: idempotency, daily cap (Redis + SQL fallback), Redis fail-closed (M-07)
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { awardXP, DAILY_XP_LIMIT } from "@/lib/gamification/xp";

// ---------------------------------------------------------------------------
// Redis mock
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
// Supabase mock factory
// ---------------------------------------------------------------------------

type RpcRow = { new_xp: number; new_level: number; leveled_up: boolean; awarded: boolean };

function buildSupabaseMock(opts: {
  rpcRow?: RpcRow;
  rpcError?: { message: string };
  /** rows returned by xp_log SELECT (for SQL cap fallback) */
  xpLogRows?: { amount: number }[];
}) {
  const {
    rpcRow = { new_xp: 200, new_level: 2, leveled_up: false, awarded: true },
    rpcError,
    xpLogRows = [],
  } = opts;

  const notificationsInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  const from = vi.fn((table: string) => {
    if (table === "xp_log") {
      // Supports .select("amount").eq("user_id", ...).gte("awarded_at", ...) chain
      const gteResult = { data: xpLogRows, error: null };
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue(gteResult),
          }),
        }),
      };
    }
    if (table === "notifications") {
      return { insert: notificationsInsert };
    }
    return {};
  });

  const rpc = vi.fn().mockImplementation((fn: string) => {
    if (fn === "award_xp_idempotent") {
      return Promise.resolve(
        rpcError ? { data: null, error: rpcError } : { data: [rpcRow], error: null },
      );
    }
    // update_login_streak etc.
    return Promise.resolve({ data: null, error: null });
  });

  return {
    supabase: { from, rpc } as unknown as Parameters<typeof awardXP>[0],
    notificationsInsert,
    rpc,
    from,
  };
}

const USER_ID = "user-xp-test-123";
const ACTION = "test_action";
const AMOUNT = 50;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("awardXP — successful award", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.get.mockResolvedValue(0);
    mockRedis.incrby.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
  });

  it("returns AwardXPResult on first award", async () => {
    const { supabase } = buildSupabaseMock({
      rpcRow: { new_xp: 150, new_level: 2, leveled_up: true, awarded: true },
    });

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(result).toEqual({ newXP: 150, newLevel: 2, leveledUp: true });
  });

  it("calls award_xp_idempotent RPC with correct args", async () => {
    const { supabase, rpc } = buildSupabaseMock({});

    await awardXP(supabase, USER_ID, ACTION, AMOUNT, "key-abc");

    expect(rpc).toHaveBeenCalledWith("award_xp_idempotent", {
      target_user_id: USER_ID,
      xp_amount: AMOUNT,
      action_text: ACTION,
      idem_key: "key-abc",
    });
  });

  it("increments Redis after successful DB write", async () => {
    const { supabase } = buildSupabaseMock({});
    await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(mockRedis.incrby).toHaveBeenCalledWith(
      expect.stringContaining(`daily_xp:${USER_ID}`),
      AMOUNT,
    );
  });

  it("creates a level-up notification when leveled_up=true", async () => {
    const { supabase, notificationsInsert } = buildSupabaseMock({
      rpcRow: { new_xp: 110, new_level: 2, leveled_up: true, awarded: true },
    });
    await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(notificationsInsert).toHaveBeenCalled();
  });

  it("does NOT create notification when leveled_up=false", async () => {
    const { supabase, notificationsInsert } = buildSupabaseMock({
      rpcRow: { new_xp: 50, new_level: 1, leveled_up: false, awarded: true },
    });
    await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(notificationsInsert).not.toHaveBeenCalled();
  });
});

describe("awardXP — idempotency (DB-side awarded=false)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.get.mockResolvedValue(0);
  });

  it("returns null when DB reports awarded=false (duplicate idempotency key)", async () => {
    const { supabase } = buildSupabaseMock({
      rpcRow: { new_xp: 150, new_level: 2, leveled_up: false, awarded: false },
    });

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT, "key-duplicate");
    expect(result).toBeNull();
  });

  it("does NOT increment Redis when awarded=false", async () => {
    const { supabase } = buildSupabaseMock({
      rpcRow: { new_xp: 150, new_level: 2, leveled_up: false, awarded: false },
    });

    await awardXP(supabase, USER_ID, ACTION, AMOUNT, "key-duplicate");
    expect(mockRedis.incrby).not.toHaveBeenCalled();
  });

  it("double-call scenario: second call returns null, RPC still called but awarded=false", async () => {
    // Simulates: first call awarded=true, second call awarded=false (DB deduped)
    const { supabase: s1 } = buildSupabaseMock({
      rpcRow: { new_xp: 50, new_level: 1, leveled_up: false, awarded: true },
    });
    const first = await awardXP(s1, USER_ID, ACTION, AMOUNT, "key-once");
    expect(first).not.toBeNull();
    expect(first?.newXP).toBe(50);

    const { supabase: s2 } = buildSupabaseMock({
      rpcRow: { new_xp: 50, new_level: 1, leveled_up: false, awarded: false },
    });
    const second = await awardXP(s2, USER_ID, ACTION, AMOUNT, "key-once");
    expect(second).toBeNull();
  });
});

describe("awardXP — daily cap (Redis)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.incrby.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
  });

  it("returns null and skips RPC when Redis cap would be exceeded", async () => {
    mockRedis.get.mockResolvedValue(DAILY_XP_LIMIT - AMOUNT + 1);
    const { supabase, rpc } = buildSupabaseMock({});

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(result).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("allows award when Redis value is exactly at limit minus amount", async () => {
    mockRedis.get.mockResolvedValue(DAILY_XP_LIMIT - AMOUNT);
    const { supabase } = buildSupabaseMock({});

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(result).not.toBeNull();
  });
});

describe("awardXP — M-07 Redis fail-closed / SQL fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.incrby.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
  });

  it("falls back to DB cap check when Redis.get throws", async () => {
    mockRedis.get.mockRejectedValue(new Error("Redis connection refused"));

    // xpLogRows total = 0, so award should proceed
    const { supabase, rpc } = buildSupabaseMock({ xpLogRows: [] });
    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(rpc).toHaveBeenCalledWith("award_xp_idempotent", expect.any(Object));
    expect(result).not.toBeNull();
  });

  it("returns null (fail-closed) when Redis.get throws AND DB cap would be exceeded", async () => {
    mockRedis.get.mockRejectedValue(new Error("Redis connection refused"));

    // xpLogRows sum = DAILY_XP_LIMIT (cap already hit)
    const xpLogRows = [{ amount: DAILY_XP_LIMIT }];
    const { supabase, rpc } = buildSupabaseMock({ xpLogRows });

    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(result).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does NOT increment Redis after Redis-fail path (redisKey=null)", async () => {
    mockRedis.get.mockRejectedValue(new Error("Redis down"));

    const { supabase } = buildSupabaseMock({ xpLogRows: [] });
    await awardXP(supabase, USER_ID, ACTION, AMOUNT);

    // redisKey was set to null after failure, so incrby should NOT be called
    expect(mockRedis.incrby).not.toHaveBeenCalled();
  });
});

describe("awardXP — RPC failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.get.mockResolvedValue(0);
  });

  it("returns null when RPC returns an error", async () => {
    const { supabase } = buildSupabaseMock({ rpcError: { message: "db error" } });
    const result = await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(result).toBeNull();
  });

  it("does NOT increment Redis when RPC fails", async () => {
    const { supabase } = buildSupabaseMock({ rpcError: { message: "db error" } });
    await awardXP(supabase, USER_ID, ACTION, AMOUNT);
    expect(mockRedis.incrby).not.toHaveBeenCalled();
  });
});
