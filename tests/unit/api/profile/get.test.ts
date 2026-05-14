// =============================================================================
// Tests: GET /api/profile
// Covers: C-03 streak fire in Tier 1 and Tier 2 paths
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks (top-level, before any import of the route)
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { requireAuth } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { GET } from "@/app/api/profile/route";

const USER_ID = "profile-get-test-user";

function makeReq(): NextRequest {
  return new NextRequest("http://localhost/api/profile", { method: "GET" });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ userId: USER_ID, role: "user" } as never);
});

// ---------------------------------------------------------------------------
// Tier 1: RPC succeeds with valid profile
// ---------------------------------------------------------------------------

describe("GET /api/profile — Tier 1 (RPC)", () => {
  it("fires streak update and returns 200 when RPC returns a valid profile", async () => {
    const streakThen = vi.fn();
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === "get_user_profile_data") {
        return Promise.resolve({
          data: {
            profile: { id: USER_ID, xp: 0 },
            badges: [],
            stats: { postsCount: 0, coursesCompleted: 0 },
          },
          error: null,
        });
      }
      // update_login_streak — fire-and-forget: route calls .then() on the result
      return { then: streakThen };
    });

    vi.mocked(createAdminClient).mockReturnValue({ rpc } as never);

    const res = await GET(makeReq());

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("update_login_streak", { target_user_id: USER_ID });
  });

  it("falls through to Tier 2 when RPC returns null data", async () => {
    // RPC returns no data (no profile) — falls to Tier 2
    // Tier 2 profiles query also fails → Tier 3 auth admin fallback
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === "get_user_profile_data") {
        return Promise.resolve({ data: null, error: null });
      }
      return { then: vi.fn() };
    });

    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "no rows" } }),
    });

    const authAdmin = {
      getUserById: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: USER_ID,
            email: "test@example.com",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {},
            app_metadata: {},
          },
        },
        error: null,
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      rpc,
      from,
      auth: { admin: authAdmin },
    } as never);

    const res = await GET(makeReq());

    expect(res.status).toBe(200);
    // Tier 3 path does not fire streak — only Tier 1 and Tier 2 do
    expect(rpc).not.toHaveBeenCalledWith("update_login_streak", expect.anything());
  });
});

// ---------------------------------------------------------------------------
// Tier 2: RPC fails, direct table query succeeds — streak must fire
// ---------------------------------------------------------------------------

describe("GET /api/profile — Tier 2 (direct tables)", () => {
  it("fires streak update when Tier 2 profile query succeeds", async () => {
    const streakThen = vi.fn();
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === "get_user_profile_data") {
        return Promise.resolve({ data: null, error: { message: "rpc not found" } });
      }
      // update_login_streak fire-and-forget
      return { then: streakThen };
    });

    let fromCallCount = 0;
    const from = vi.fn().mockImplementation((table: string) => {
      fromCallCount++;

      if (table === "profiles" && fromCallCount === 1) {
        // profiles: returns a valid profile
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: USER_ID, xp: 10 },
            error: null,
          }),
        };
      }

      if (table === "user_badges") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }

      // community_posts and user_course_progress: count queries
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ count: 0, error: null }),
        // community_posts select with count uses eq directly
      };
    });

    vi.mocked(createAdminClient).mockReturnValue({ rpc, from } as never);

    const res = await GET(makeReq());

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("update_login_streak", { target_user_id: USER_ID });
  });
});
