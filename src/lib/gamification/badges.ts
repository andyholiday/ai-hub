// =============================================================================
// Badge System Logic
// Checks if a user has earned new badges and awards them.
// Called after relevant actions (post creation, upvote received, etc.).
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Badge Criteria Definitions
// ---------------------------------------------------------------------------

/**
 * Each criterion maps a badge key to a check function.
 * The check function receives user stats and returns true if the badge
 * should be awarded.
 */
interface UserStats {
  totalPosts: number;
  totalComments: number;
  totalUpvotesReceived: number;
  streakDays: number;
  level: number;
  xp: number;
  onboardingCompleted: boolean;
}

interface BadgeCriterion {
  badgeKey: string;
  check: (stats: UserStats) => boolean;
}

const BADGE_CRITERIA: BadgeCriterion[] = [
  // --- Achievement Badges ---
  {
    badgeKey: "first-steps",
    check: (stats) => stats.onboardingCompleted,
  },
  {
    badgeKey: "first-post",
    check: (stats) => stats.totalPosts >= 1,
  },
  {
    badgeKey: "active-contributor",
    check: (stats) => stats.totalPosts >= 10,
  },
  {
    badgeKey: "prolific-writer",
    check: (stats) => stats.totalPosts >= 50,
  },
  {
    badgeKey: "first-comment",
    check: (stats) => stats.totalComments >= 1,
  },
  {
    badgeKey: "commentator",
    check: (stats) => stats.totalComments >= 50,
  },

  // --- Social Badges ---
  {
    badgeKey: "appreciated",
    check: (stats) => stats.totalUpvotesReceived >= 10,
  },
  {
    badgeKey: "popular",
    check: (stats) => stats.totalUpvotesReceived >= 100,
  },
  {
    badgeKey: "influencer",
    check: (stats) => stats.totalUpvotesReceived >= 500,
  },

  // --- Skill Badges ---
  {
    badgeKey: "week-streak",
    check: (stats) => stats.streakDays >= 7,
  },
  {
    badgeKey: "month-streak",
    check: (stats) => stats.streakDays >= 30,
  },

  // --- Level Badges ---
  {
    badgeKey: "level-5",
    check: (stats) => stats.level >= 5,
  },
  {
    badgeKey: "level-10",
    check: (stats) => stats.level >= 10,
  },
];

// ---------------------------------------------------------------------------
// Core Function
// ---------------------------------------------------------------------------

/**
 * Check if a user has earned any new badges and award them.
 * Fetches user stats, compares against criteria, and inserts
 * any newly earned badges.
 *
 * @param supabase - Admin Supabase client (bypasses RLS)
 * @param userId - The user to check badges for
 * @returns Array of newly awarded badge keys
 */
export async function checkAndAwardBadges(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  // 1. Fetch all badge definitions from DB
  const { data: allBadges } = await supabase
    .from("badges")
    .select("id, key");

  if (!allBadges || allBadges.length === 0) return [];

  // 2. Fetch already-earned badge IDs for this user
  const { data: earnedBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const earnedBadgeIds = new Set(
    (earnedBadges ?? []).map((b) => b.badge_id),
  );

  // 3. Gather user stats
  const stats = await getUserStats(supabase, userId);
  if (!stats) return [];

  // 4. Determine which badges the user now qualifies for
  const newlyEarned: string[] = [];

  for (const criterion of BADGE_CRITERIA) {
    const badgeDef = allBadges.find((b) => b.key === criterion.badgeKey);
    if (!badgeDef) continue;

    // Already earned - skip
    if (earnedBadgeIds.has(badgeDef.id)) continue;

    // Check criterion
    if (criterion.check(stats)) {
      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badgeDef.id,
      });

      if (!error) {
        newlyEarned.push(criterion.badgeKey);

        // Create notification for the new badge
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "achievement",
          title: "Neues Badge erhalten!",
          message: `Du hast das Badge "${badgeDef.key}" freigeschaltet!`,
          link: "/dashboard",
        });
      }
    }
  }

  return newlyEarned;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Gather all stats needed for badge evaluation.
 */
async function getUserStats(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserStats | null> {
  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("level, xp, streak_days, onboarding_completed")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  // Count posts
  const { count: totalPosts } = await supabase
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  // Count comments
  const { count: totalComments } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  // Count upvotes received (on user's posts)
  const { data: userPostIds } = await supabase
    .from("community_posts")
    .select("id")
    .eq("author_id", userId);

  let totalUpvotesReceived = 0;
  if (userPostIds && userPostIds.length > 0) {
    const postIds = userPostIds.map((p) => p.id);
    const { count } = await supabase
      .from("upvotes")
      .select("user_id", { count: "exact", head: true })
      .eq("entity_type", "community_post")
      .in("entity_id", postIds);
    totalUpvotesReceived = count ?? 0;
  }

  return {
    totalPosts: totalPosts ?? 0,
    totalComments: totalComments ?? 0,
    totalUpvotesReceived,
    streakDays: profile.streak_days,
    level: profile.level,
    xp: profile.xp,
    onboardingCompleted: profile.onboarding_completed ?? false,
  };
}
