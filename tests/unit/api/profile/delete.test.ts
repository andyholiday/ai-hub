// =============================================================================
// Tests: DELETE /api/profile — GDPR Self-Service-Erasure
// Prueft die Reihenfolge: gdpr_erasure_log INSERT vor deleteUser,
// Fehler-Abbruch-Logik und abschliessende deleted_at-Markierung.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

// Profile-unrelated imports used by other handlers in same route file
vi.mock("@/lib/validators/profile", () => ({
  updateProfileSchema: { safeParse: vi.fn() },
}));

vi.mock("@/lib/gamification/xp", () => ({
  awardCommunityXP: vi.fn(),
}));

vi.mock("@/lib/gamification/badges", () => ({
  checkAndAwardBadges: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { requireAuth } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DELETE } from "@/app/api/profile/route";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateAdminClient = vi.mocked(createAdminClient);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = "user-delete-abc123";
const ERASURE_ROW_ID = "erasure-log-row-id-1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(): NextRequest {
  return new NextRequest("http://localhost/api/profile", { method: "DELETE" });
}

function mockAuthOk(userId = USER_ID) {
  mockRequireAuth.mockResolvedValue({
    userId,
    role: "user",
    supabase: {} as never,
  });
}

type SupabaseMockOpts = {
  insertError?: { message: string };
  deleteUserError?: { message: string };
  updateError?: { message: string };
};

/**
 * Returns the supabase mock AND direct references to the chain objects so
 * tests can assert on them without another `from()` call.
 */
function buildSupabaseMock(opts: SupabaseMockOpts = {}) {
  const { insertError, deleteUserError, updateError } = opts;

  // Shared chain object for gdpr_erasure_log — insert + update in one object
  // so both are available on the same reference that `from()` returns.
  const erasureChain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      insertError
        ? { data: null, error: insertError }
        : { data: { id: ERASURE_ROW_ID }, error: null },
    ),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: updateError ?? null }),
  };

  const deleteUser = vi.fn().mockResolvedValue({
    error: deleteUserError ?? null,
  });

  const supabase = {
    from: vi.fn((_table: string) => erasureChain),
    auth: {
      admin: {
        deleteUser,
        getUserById: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: USER_ID,
              email: "u@test.com",
              user_metadata: {},
              app_metadata: {},
              created_at: "",
            },
          },
          error: null,
        }),
      },
    },
  };

  return { supabase, erasureChain };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DELETE /api/profile — unauthenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({
      response: NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      ),
    });

    const res = await DELETE(buildRequest());
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/profile — audit-log guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthOk();
  });

  it("aborts erasure and returns 500 when gdpr_erasure_log insert fails", async () => {
    const { supabase } = buildSupabaseMock({ insertError: { message: "DB constraint" } });
    mockCreateAdminClient.mockReturnValue(supabase as never);

    const res = await DELETE(buildRequest());

    expect(res.status).toBe(500);
    // deleteUser must NOT have been called
    expect(supabase.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("writes gdpr_erasure_log BEFORE calling deleteUser", async () => {
    const callOrder: string[] = [];
    const { supabase, erasureChain } = buildSupabaseMock();

    // Wrap insert to record order
    const originalInsert = erasureChain.insert.bind(erasureChain);
    erasureChain.insert = vi.fn((...args: Parameters<typeof originalInsert>) => {
      callOrder.push("insert");
      return originalInsert(...args);
    });

    const originalDeleteUser = supabase.auth.admin.deleteUser.bind(supabase.auth.admin);
    supabase.auth.admin.deleteUser = vi.fn((...args: Parameters<typeof originalDeleteUser>) => {
      callOrder.push("deleteUser");
      return originalDeleteUser(...args);
    });

    mockCreateAdminClient.mockReturnValue(supabase as never);

    await DELETE(buildRequest());

    expect(callOrder.indexOf("insert")).toBeLessThan(callOrder.indexOf("deleteUser"));
  });
});

describe("DELETE /api/profile — deleteUser failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthOk();
  });

  it("returns 500 and leaves erasure_log row with deleted_at=NULL when deleteUser fails", async () => {
    const { supabase, erasureChain } = buildSupabaseMock({ deleteUserError: { message: "User not found" } });
    mockCreateAdminClient.mockReturnValue(supabase as never);

    const res = await DELETE(buildRequest());

    expect(res.status).toBe(500);
    // update (to set deleted_at) should NOT have been called since deleteUser failed
    expect(erasureChain.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/profile — success path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthOk();
  });

  it("returns 200 and updates erasure_log.deleted_at after successful deletion", async () => {
    const { supabase, erasureChain } = buildSupabaseMock();
    mockCreateAdminClient.mockReturnValue(supabase as never);

    const res = await DELETE(buildRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.deleted).toBe(true);

    // update should have been called to mark deleted_at
    expect(erasureChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
  });
});
