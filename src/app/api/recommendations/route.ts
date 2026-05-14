// =============================================================================
// Recommendations API
// GET /api/recommendations - Personalized recommendations for the dashboard
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { SupabaseClient } from "@supabase/supabase-js";
import { recommendationsQuerySchema } from "@/lib/validators/recommendations";
import type { Recommendation } from "@/types/recommendations";
import type { Database } from "@/lib/supabase/types";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Difficulty mapping for level-based filtering
// ---------------------------------------------------------------------------

type Difficulty = "beginner" | "intermediate" | "advanced";

const LEVEL_DIFFICULTY_MAP: Record<number, Difficulty[]> = {
  1: ["beginner"],
  2: ["beginner"],
  3: ["beginner", "intermediate"],
  4: ["beginner", "intermediate"],
  5: ["intermediate", "advanced"],
  6: ["intermediate", "advanced"],
  7: ["advanced"],
};

function getDifficultiesForLevel(level: number): Difficulty[] {
  return LEVEL_DIFFICULTY_MAP[Math.min(Math.max(level, 1), 7)] ?? ["beginner", "intermediate"];
}

// ---------------------------------------------------------------------------
// GET - Generate personalized recommendations
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const queryRaw = {
      limit: searchParams.get("limit") ?? undefined,
    };

    const parsed = recommendationsQuerySchema.safeParse(queryRaw);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { limit } = parsed.data;
    const { userId } = auth;
    // Cast: createServerClient<Database> and createClient<Database> both return
    // SupabaseClient<Database>; the cast aligns the generic for tsc.
    const supabase = auth.supabase as unknown as SupabaseClient<Database>;

    // ----- Fetch user profile for level-based filtering -----
    const { data: profile } = await supabase
      .from("profiles")
      .select("level, xp")
      .eq("id", userId)
      .single();

    const userLevel = profile?.level ?? 1;
    const suitableDifficulties = getDifficultiesForLevel(userLevel);

    // Run all recommendation queries in parallel
    const [
      continueCourses,
      newCourses,
      bestPractices,
      activePosts,
      openChallenges,
    ] = await Promise.all([
      fetchIncompleteCourses(supabase, userId),
      fetchNewCourses(supabase, userId),
      fetchPopularBestPractices(supabase, userId),
      fetchActiveCommunityPosts(supabase, userId),
      fetchMatchingChallenges(supabase, userId, suitableDifficulties),
    ]);

    // ----- Merge and prioritize -----
    const all: Recommendation[] = [
      ...continueCourses,
      ...newCourses,
      ...bestPractices,
      ...activePosts,
      ...openChallenges,
    ];

    // Sort by priority descending, then slice to requested limit
    all.sort((a, b) => b.priority - a.priority);
    const recommendations = all.slice(0, limit);

    return apiSuccess(recommendations);
  } catch {
    return apiInternalError();
  }
}

// =============================================================================
// Recommendation Fetchers
// =============================================================================

// ---------------------------------------------------------------------------
// 1. Incomplete courses the user has started but not finished
// ---------------------------------------------------------------------------

async function fetchIncompleteCourses(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Recommendation[]> {
  const { data: progress } = await supabase
    .from("user_course_progress")
    .select("course_id, progress_percent")
    .eq("user_id", userId)
    .is("completed_at", null)
    .gt("progress_percent", 0)
    .order("progress_percent", { ascending: false })
    .limit(3);

  if (!progress || progress.length === 0) return [];

  const courseIds = progress.map((p) => p.course_id);
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, difficulty")
    .in("id", courseIds)
    .eq("is_published", true);

  if (!courses) return [];

  const progressMap = new Map(
    progress.map((p) => [p.course_id, p.progress_percent]),
  );

  return courses.map((course) => {
    const pct = progressMap.get(course.id) ?? 0;
    return {
      id: course.id,
      type: "continue_course" as const,
      title: course.title,
      description: course.description,
      reason: `Du hast bereits ${pct}% abgeschlossen -- mach weiter!`,
      href: `/learn-hub/${course.id}`,
      priority: 100 + pct, // Higher progress = higher priority
      metadata: {
        progress: pct,
        difficulty: course.difficulty,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// 2. New courses the user has not started yet
// ---------------------------------------------------------------------------

async function fetchNewCourses(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Recommendation[]> {
  // Get courses the user has already started
  const { data: startedProgress } = await supabase
    .from("user_course_progress")
    .select("course_id")
    .eq("user_id", userId);

  const startedIds = new Set(
    (startedProgress ?? []).map((p) => p.course_id),
  );

  // Fetch newest published courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, difficulty, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!courses) return [];

  // Filter out already-started courses and take top 2
  return courses
    .filter((c) => !startedIds.has(c.id))
    .slice(0, 2)
    .map((course) => ({
      id: course.id,
      type: "new_course" as const,
      title: course.title,
      description: course.description,
      reason: "Neuer Kurs -- perfekt fuer deinen naechsten Lernschritt",
      href: `/learn-hub/${course.id}`,
      priority: 70,
      metadata: {
        difficulty: course.difficulty,
      },
    }));
}

// ---------------------------------------------------------------------------
// 3. Popular best practices the user has not viewed (sorted by likes)
// ---------------------------------------------------------------------------

async function fetchPopularBestPractices(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Recommendation[]> {
  // Fetch top best practices by likes, excluding user's own
  const { data: practices } = await supabase
    .from("best_practices")
    .select("id, title, content, upvotes_count, category")
    .eq("status", "published")
    .neq("author_id", userId)
    .order("upvotes_count", { ascending: false })
    .limit(3);

  if (!practices || practices.length === 0) return [];

  return practices.map((bp) => ({
    id: bp.id,
    type: "best_practice" as const,
    title: bp.title,
    description:
      bp.content.length > 120
        ? bp.content.substring(0, 120) + "..."
        : bp.content,
    reason: `Beliebt in der Community mit ${bp.upvotes_count} Likes`,
    href: `/best-practices/${bp.id}`,
    priority: 50 + Math.min(bp.upvotes_count, 50),
    metadata: {
      upvotes: bp.upvotes_count,
      category: bp.category,
    },
  }));
}

// ---------------------------------------------------------------------------
// 4. Active community discussions with high engagement
// ---------------------------------------------------------------------------

async function fetchActiveCommunityPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Recommendation[]> {
  // Fetch recent posts with high engagement, excluding user's own
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, title, content, type, upvotes_count, comments_count")
    .neq("author_id", userId)
    .order("comments_count", { ascending: false })
    .limit(5);

  if (!posts || posts.length === 0) return [];

  // Take top 2 most active
  return posts.slice(0, 2).map((post) => {
    const engagement = post.upvotes_count + post.comments_count;
    const typeLabel = getPostTypeLabel(post.type);

    return {
      id: post.id,
      type: "community_post" as const,
      title: post.title,
      description:
        post.content.length > 120
          ? post.content.substring(0, 120) + "..."
          : post.content,
      reason: `Aktive ${typeLabel} mit ${post.comments_count} Kommentaren`,
      href: `/community/${post.id}`,
      priority: 40 + Math.min(engagement, 30),
      metadata: {
        upvotes: post.upvotes_count,
        commentsCount: post.comments_count,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// 5. Open challenges matching the user's level
// ---------------------------------------------------------------------------

async function fetchMatchingChallenges(
  supabase: SupabaseClient<Database>,
  userId: string,
  _suitableDifficulties: Difficulty[],
): Promise<Recommendation[]> {
  const now = new Date().toISOString();

  // Get challenges the user has already joined
  const { data: joinedChallenges } = await supabase
    .from("user_challenges")
    .select("challenge_id")
    .eq("user_id", userId);

  const joinedIds = new Set(
    (joinedChallenges ?? []).map((uc) => uc.challenge_id),
  );

  // Fetch active challenges matching difficulty
  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, title, description, type, xp_reward, end_date")
    .eq("is_active", true)
    .gt("end_date", now)
    .order("xp_reward", { ascending: false })
    .limit(5);

  if (!challenges || challenges.length === 0) return [];

  // Filter out already-joined and take top 2
  return challenges
    .filter((c) => !joinedIds.has(c.id))
    .slice(0, 2)
    .map((challenge) => {
      const endsAt = new Date(challenge.end_date);
      const daysRemaining = Math.max(
        0,
        Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      );

      return {
        id: challenge.id,
        type: "challenge" as const,
        title: challenge.title,
        description: challenge.description,
        reason: `Passend fuer dein Level -- ${challenge.xp_reward} XP zu gewinnen`,
        href: `/challenges/${challenge.id}`,
        priority: 60 + Math.min(challenge.xp_reward / 2, 30),
        metadata: {
          type: challenge.type,
          xpReward: challenge.xp_reward,
          daysRemaining,
        },
      };
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPostTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    discussion: "Diskussion",
    idea: "Idee",
    show_and_tell: "Show & Tell",
    question: "Frage",
    challenge: "Challenge",
  };
  return labels[type] ?? "Diskussion";
}
