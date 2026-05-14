// =============================================================================
// Tests: Badge System — checkAndAwardBadges critical paths
// Prueft: first-steps badge wird vergeben / nicht vergeben
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = "user-badge-test-456";
const FIRST_STEPS_BADGE_ID = "badge-id-first-steps";

// ---------------------------------------------------------------------------
// Supabase Mock Factory
// ---------------------------------------------------------------------------

/**
 * Builds a Supabase mock for checkAndAwardBadges.
 * checkAndAwardBadges calls:
 *   1. .from("badges").select("id, key")
 *   2. .from("user_badges").select("badge_id").eq("user_id", userId)
 *   3. getUserStats():
 *      a. .from("profiles").select("level, xp, streak_days, onboarding_completed").eq("id", userId).single()
 *      b. .from("community_posts").select("id", { count, head }).eq("author_id", userId)  → count
 *      c. .from("comments").select("id", ...).eq("author_id", userId)  → count
 *      d. .from("community_posts").select("id").eq("author_id", userId)  → data (for upvote sub-query)
 *   4. .from("user_badges").insert({ user_id, badge_id })
 *   5. .from("notifications").insert(...)
 */
function buildBadgesMock(opts: {
  onboardingCompleted: boolean;
  existingBadgeIds?: string[];
}) {
  const { onboardingCompleted, existingBadgeIds = [] } = opts;

  const userBadgesInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const notificationsInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  // Track user_badges call count to distinguish select vs insert
  let userBadgesCallCount = 0;
  // Track community_posts call count to distinguish count query vs id-list query
  let communityPostsCallCount = 0;

  const from = vi.fn((table: string) => {
    if (table === "badges") {
      return {
        select: vi.fn().mockResolvedValue({
          data: [{ id: FIRST_STEPS_BADGE_ID, key: "first-steps" }],
          error: null,
        }),
      };
    }

    if (table === "user_badges") {
      userBadgesCallCount++;
      if (userBadgesCallCount === 1) {
        // SELECT for already-earned badges
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: existingBadgeIds.map((id) => ({ badge_id: id })),
              error: null,
            }),
          }),
        };
      }
      // INSERT for newly earned badge
      return { insert: userBadgesInsert };
    }

    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                level: 1,
                xp: 50,
                streak_days: 0,
                onboarding_completed: onboardingCompleted,
              },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === "community_posts") {
      communityPostsCallCount++;
      if (communityPostsCallCount === 1) {
        // Count query (head: true)
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        };
      }
      // Second call: select("id") for upvote lookup
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    }

    if (table === "comments") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      };
    }

    if (table === "notifications") {
      return { insert: notificationsInsert };
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
  });

  return {
    supabase: { from } as unknown as Parameters<typeof checkAndAwardBadges>[0],
    userBadgesInsert,
    notificationsInsert,
    from,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("checkAndAwardBadges — first-steps badge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("awards first-steps badge when onboarding_completed = true", async () => {
    const { supabase, userBadgesInsert } = buildBadgesMock({
      onboardingCompleted: true,
      existingBadgeIds: [],
    });

    const result = await checkAndAwardBadges(supabase, USER_ID);

    expect(result).toContain("first-steps");
    expect(userBadgesInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        badge_id: FIRST_STEPS_BADGE_ID,
      }),
    );
  });

  it("does NOT award first-steps badge when onboarding_completed = false", async () => {
    const { supabase, userBadgesInsert } = buildBadgesMock({
      onboardingCompleted: false,
      existingBadgeIds: [],
    });

    const result = await checkAndAwardBadges(supabase, USER_ID);

    expect(result).not.toContain("first-steps");
    expect(userBadgesInsert).not.toHaveBeenCalled();
  });
});
