// =============================================================================
// Achievement System Logic
// Checks if a user has earned new achievements and unlocks them.
// Awards XP for each newly unlocked achievement.
// Can be called fire-and-forget from API routes after relevant actions.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { awardXP } from "./xp";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];
type RequirementType = AchievementRow["requirement_type"];

interface UserAchievementStats {
  xpTotal: number;
  postsCount: number;
  commentsCount: number;
  coursesCompleted: number;
  loginStreak: number;
  lessonsCompleted: number;
  upvotesReceived: number;
  badgesEarned: number;
}

export interface UnlockedAchievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementRow["category"];
  xpReward: number;
}

// ---------------------------------------------------------------------------
// Stats -> Requirement Type Mapping
// ---------------------------------------------------------------------------

const STAT_GETTERS: Record<RequirementType, (stats: UserAchievementStats) => number> = {
  xp_total: (s) => s.xpTotal,
  posts_count: (s) => s.postsCount,
  comments_count: (s) => s.commentsCount,
  courses_completed: (s) => s.coursesCompleted,
  login_streak: (s) => s.loginStreak,
  lessons_completed: (s) => s.lessonsCompleted,
  upvotes_received: (s) => s.upvotesReceived,
  badges_earned: (s) => s.badgesEarned,
};

// ---------------------------------------------------------------------------
// Core Function
// ---------------------------------------------------------------------------

/**
 * Check if a user qualifies for any new achievements and unlock them.
 * Awards XP for each newly unlocked achievement.
 *
 * @param supabase - Admin Supabase client (bypasses RLS)
 * @param userId - The user to check achievements for
 * @returns Array of newly unlocked achievements
 */
export async function checkAndUnlockAchievements(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UnlockedAchievement[]> {
  // 1. Fetch all achievements
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*");

  if (!allAchievements || allAchievements.length === 0) return [];

  // 2. Fetch already-unlocked achievement IDs for this user
  const { data: unlockedRows } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedIds = new Set(
    (unlockedRows ?? []).map((row) => row.achievement_id),
  );

  // 3. Filter to achievements not yet unlocked
  const pendingAchievements = allAchievements.filter(
    (a) => !unlockedIds.has(a.id),
  );

  if (pendingAchievements.length === 0) return [];

  // 4. Gather user stats
  const stats = await getUserAchievementStats(supabase, userId);
  if (!stats) return [];

  // 5. Check each pending achievement
  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const achievement of pendingAchievements) {
    const statGetter = STAT_GETTERS[achievement.requirement_type];
    const currentValue = statGetter(stats);

    if (currentValue >= achievement.requirement_value) {
      // Unlock the achievement
      const { error } = await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      if (!error) {
        newlyUnlocked.push({
          id: achievement.id,
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          xpReward: achievement.xp_reward,
        });

        // Award XP for the achievement
        if (achievement.xp_reward > 0) {
          await awardXP(
            supabase,
            userId,
            `achievement_${achievement.key}`,
            achievement.xp_reward,
          );
        }

        // Create notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "achievement",
          title: "Achievement freigeschaltet!",
          message: `Du hast "${achievement.title}" freigeschaltet! (+${achievement.xp_reward} XP)`,
          link: "/profile/achievements",
        });
      }
    }
  }

  return newlyUnlocked;
}

// ---------------------------------------------------------------------------
// Stats Loader
// ---------------------------------------------------------------------------

/**
 * Gather all user stats needed for achievement evaluation.
 */
async function getUserAchievementStats(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserAchievementStats | null> {
  // Fetch profile for XP and streak
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, streak_days")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  // Count posts
  const { count: postsCount } = await supabase
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  // Count comments
  const { count: commentsCount } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  // Count completed courses
  const { count: coursesCompleted } = await supabase
    .from("user_course_progress")
    .select("course_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  // Count completed lessons
  const { count: lessonsCompleted } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", userId);

  // Count upvotes received (on user's posts)
  let upvotesReceived = 0;
  const { data: userPostIds } = await supabase
    .from("community_posts")
    .select("id")
    .eq("author_id", userId);

  if (userPostIds && userPostIds.length > 0) {
    const postIds = userPostIds.map((p) => p.id);
    const { count } = await supabase
      .from("upvotes")
      .select("user_id", { count: "exact", head: true })
      .eq("entity_type", "community_post")
      .in("entity_id", postIds);
    upvotesReceived = count ?? 0;
  }

  // Count badges earned
  const { count: badgesEarned } = await supabase
    .from("user_badges")
    .select("badge_id", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    xpTotal: profile.xp,
    postsCount: postsCount ?? 0,
    commentsCount: commentsCount ?? 0,
    coursesCompleted: coursesCompleted ?? 0,
    loginStreak: profile.streak_days,
    lessonsCompleted: lessonsCompleted ?? 0,
    upvotesReceived,
    badgesEarned: badgesEarned ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Progress Helper (for API use)
// ---------------------------------------------------------------------------

/**
 * Get the current progress value for a given requirement type.
 * Used by the API to show progress bars on locked achievements.
 */
export async function getAchievementProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserAchievementStats | null> {
  return getUserAchievementStats(supabase, userId);
}
