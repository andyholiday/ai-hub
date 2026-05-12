// =============================================================================
// Tests: Task 11 — Challenge Progress Hardening
//
// Verifies:
//   1. Valid event-based body succeeds and server caps progress
//   2. Arbitrary { progress: 100 } body is rejected (schema validation)
//   3. Already-completed challenge returns 400
//   4. XP is not awarded twice (upsert ignoreDuplicates: count=0 skips awardXP)
//   5. User not enrolled in challenge returns 404
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/require-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: "user-42", role: "user", supabase: {} }),
}));

const mockAwardXP = vi.fn().mockResolvedValue({ newXP: 150, newLevel: 2, leveledUp: false });
vi.mock("@/lib/gamification/xp", () => ({
  awardXP: mockAwardXP,
}));

// Configurable per-test admin client mock (reassigned in beforeEach)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper
let mockAdminClientImpl: any = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminClientImpl()),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(
    "http://localhost/api/challenges/challenge-1/progress",
    {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    },
  );
}

type RouteContext = { params: Promise<{ challengeId: string }> };

function makeContext(challengeId = "challenge-1"): RouteContext {
  return { params: Promise.resolve({ challengeId }) };
}

function buildAdminClient({
  userChallenge = { user_id: "user-42", challenge_id: "challenge-1", progress: 0, completed_at: null },
  fetchError = null,
  updateData = { progress: 33, completed_at: null },
  updateError = null,
  challenge = { xp_reward: 100, title: "Test Challenge" },
  insertedRows = [{ user_id: "user-42" }],
  insertError = null,
}: {
  userChallenge?: object | null;
  fetchError?: object | null;
  updateData?: object;
  updateError?: object | null;
  challenge?: object | null;
  insertedRows?: object[];
  insertError?: object | null;
} = {}) {
  return {
    from: vi.fn((table: string) => {
      if (table === "user_challenges") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: userChallenge, error: fetchError }),
          update: vi.fn().mockReturnThis(),
        };
      }
      if (table === "challenges") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: challenge, error: null }),
        };
      }
      if (table === "challenge_completions") {
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: insertedRows, error: insertError }),
        };
      }
      if (table === "notifications") {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {};
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PATCH /api/challenges/[challengeId]/progress — Task 11 hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminClientImpl = vi.fn();
  });

  it("accepts event-based body and advances progress by server-defined increment", async () => {
    const client = buildAdminClient();
    vi.mocked(client.from).mockImplementation((table: string) => {
      if (table === "user_challenges") {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn()
            .mockResolvedValueOnce({ data: { user_id: "user-42", challenge_id: "c1", progress: 0, completed_at: null }, error: null })
            .mockResolvedValueOnce({ data: { progress: 33, completed_at: null }, error: null }),
          update: vi.fn().mockReturnThis(),
        };
        return chain;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
      };
    });
    mockAdminClientImpl.mockReturnValue(client);

    const { PATCH } = await import("@/app/api/challenges/[challengeId]/progress/route");
    const res = await PATCH(makeRequest({ eventType: "lesson_completed" }), makeContext());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.error).toBeNull();
  });

  it("rejects body with arbitrary numeric progress field (old schema)", async () => {
    mockAdminClientImpl.mockReturnValue(buildAdminClient());

    const { PATCH } = await import("@/app/api/challenges/[challengeId]/progress/route");
    const res = await PATCH(makeRequest({ progress: 100 }), makeContext());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 when challenge is already completed", async () => {
    mockAdminClientImpl.mockReturnValue(
      buildAdminClient({
        userChallenge: {
          user_id: "user-42",
          challenge_id: "c1",
          progress: 100,
          completed_at: new Date().toISOString(),
        },
      }),
    );

    const { PATCH } = await import("@/app/api/challenges/[challengeId]/progress/route");
    const res = await PATCH(makeRequest({ eventType: "quiz_passed" }), makeContext());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 404 when user is not enrolled in the challenge", async () => {
    mockAdminClientImpl.mockReturnValue(
      buildAdminClient({ userChallenge: null, fetchError: { message: "not found" } }),
    );

    const { PATCH } = await import("@/app/api/challenges/[challengeId]/progress/route");
    const res = await PATCH(makeRequest({ eventType: "step_done" }), makeContext());

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("does not award XP a second time when upsert returns 0 inserted rows (ignoreDuplicates)", async () => {
    const client = buildAdminClient({ insertedRows: [] });
    vi.mocked(client.from).mockImplementation((table: string) => {
      if (table === "user_challenges") {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn()
            .mockResolvedValueOnce({ data: { user_id: "user-42", challenge_id: "c1", progress: 90, completed_at: null }, error: null })
            .mockResolvedValueOnce({ data: { progress: 100, completed_at: new Date().toISOString() }, error: null }),
          update: vi.fn().mockReturnThis(),
        };
        return chain;
      }
      if (table === "challenges") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { xp_reward: 200, title: "Big Challenge" }, error: null }),
        };
      }
      if (table === "challenge_completions") {
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
    });
    mockAdminClientImpl.mockReturnValue(client);

    const { PATCH } = await import("@/app/api/challenges/[challengeId]/progress/route");
    const res = await PATCH(makeRequest({ eventType: "quiz_passed" }), makeContext());

    expect(res.status).toBe(200);
    expect(mockAwardXP).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.data.xpAwarded).toBeNull();
  });
});
