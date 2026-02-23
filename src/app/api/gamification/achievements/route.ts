// =============================================================================
// Achievements API
// GET /api/gamification/achievements - All achievements with user unlock status
// Returns achievements grouped by category with progress information.
// =============================================================================

import { NextRequest } from "next/server";
import {
  apiSuccess,
  apiInternalError,
} from "@/lib/api/response";
import { requireAuth } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAchievementProgress } from "@/lib/gamification/achievements";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AchievementResponse {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirementType: string;
  requirementValue: number;
  xpReward: number;
  isHidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  currentProgress: number;
}

interface GroupedAchievements {
  category: string;
  label: string;
  achievements: AchievementResponse[];
}

// ---------------------------------------------------------------------------
// Category Labels
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  learning: "Lernen",
  community: "Community",
  engagement: "Engagement",
  mastery: "Meisterschaft",
};

// ---------------------------------------------------------------------------
// Requirement Type -> Stats Key Mapping
// ---------------------------------------------------------------------------

const REQUIREMENT_TO_STAT: Record<string, string> = {
  xp_total: "xpTotal",
  posts_count: "postsCount",
  comments_count: "commentsCount",
  courses_completed: "coursesCompleted",
  login_streak: "loginStreak",
  lessons_completed: "lessonsCompleted",
  upvotes_received: "upvotesReceived",
  badges_earned: "badgesEarned",
};

// ---------------------------------------------------------------------------
// GET - List all achievements with user unlock status
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;
    const { userId } = auth;

    const adminClient = createAdminClient();

    // 1. Fetch all achievements
    const { data: achievements, error: achError } = await adminClient
      .from("achievements")
      .select("*")
      .order("category")
      .order("requirement_value", { ascending: true });

    if (achError) {
      // If table doesn't exist or permissions are missing, return empty result
      // gracefully instead of breaking the dashboard.
      console.warn("[Achievements API] Query failed:", achError.message);
      return apiSuccess({
        summary: { total: 0, unlocked: 0, locked: 0, totalXpEarned: 0 },
        grouped: [],
      });
    }

    if (!achievements || achievements.length === 0) {
      return apiSuccess({
        summary: { total: 0, unlocked: 0, locked: 0, totalXpEarned: 0 },
        grouped: [],
      });
    }

    // 2. Fetch user's unlocked achievements
    const { data: userAchievements, error: uaError } = await adminClient
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId);

    if (uaError) {
      return apiInternalError(uaError.message);
    }

    const unlockedMap = new Map(
      (userAchievements ?? []).map((ua) => [ua.achievement_id, ua.unlocked_at]),
    );

    // 3. Fetch user stats for progress calculation
    const stats = await getAchievementProgress(adminClient, userId);

    // 4. Build response with progress data
    const achievementResponses: AchievementResponse[] = achievements.map((a) => {
      const unlocked = unlockedMap.has(a.id);
      const unlockedAt = unlockedMap.get(a.id) ?? null;

      // Calculate current progress
      let currentProgress = 0;
      if (stats) {
        const statKey = REQUIREMENT_TO_STAT[a.requirement_type];
        if (statKey && statKey in stats) {
          currentProgress = stats[statKey as keyof typeof stats];
        }
      }

      return {
        id: a.id,
        key: a.key,
        title: unlocked || !a.is_hidden ? a.title : "???",
        description: unlocked || !a.is_hidden ? a.description : "Verstecktes Achievement",
        icon: unlocked || !a.is_hidden ? a.icon : "help-circle",
        category: a.category,
        requirementType: a.requirement_type,
        requirementValue: a.requirement_value,
        xpReward: a.xp_reward,
        isHidden: a.is_hidden,
        unlocked,
        unlockedAt,
        currentProgress: Math.min(currentProgress, a.requirement_value),
      };
    });

    // 5. Group by category
    const categoryOrder = ["learning", "community", "engagement", "mastery"];
    const grouped: GroupedAchievements[] = categoryOrder
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
        achievements: achievementResponses.filter((a) => a.category === cat),
      }))
      .filter((group) => group.achievements.length > 0);

    // 6. Summary stats
    const totalAchievements = achievements.length;
    const totalUnlocked = unlockedMap.size;
    const totalXpEarned = achievements
      .filter((a) => unlockedMap.has(a.id))
      .reduce((sum, a) => sum + a.xp_reward, 0);

    return apiSuccess({
      summary: {
        total: totalAchievements,
        unlocked: totalUnlocked,
        locked: totalAchievements - totalUnlocked,
        totalXpEarned,
      },
      grouped,
    });
  } catch {
    return apiInternalError();
  }
}
