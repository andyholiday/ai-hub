// =============================================================================
// Learn Hub - Learning Paths API
// GET /api/learn-hub/paths - List published learning paths with user progress
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { listLearningPathsQuerySchema } from "@/lib/validators/learn-hub";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET - List published learning paths with optional difficulty filter
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryRaw = {
      difficulty: searchParams.get("difficulty") ?? undefined,
    };

    const parsed = listLearningPathsQuerySchema.safeParse(queryRaw);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { difficulty } = parsed.data;

    // Optionally authenticate for progress data
    const auth = await requireAuth(req);
    const userId = !("response" in auth) ? auth.userId : null;

    const supabase = createAdminClient();

    // Build query for published learning paths
    let query = supabase
      .from("learning_paths")
      .select("*")
      .eq("is_published", true);

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    query = query.order("order_index", { ascending: true });

    const { data: paths, error } = await query;

    if (error) {
      return apiInternalError(error.message);
    }

    if (!paths || paths.length === 0) {
      return apiSuccess([]);
    }

    // Fetch courses for each learning path
    const pathIds = paths.map((p) => p.id);

    const { data: pathCourses, error: pcError } = await supabase
      .from("learning_path_courses")
      .select(
        "*, course:courses(id, title, description, thumbnail_url, category, difficulty, duration_minutes, lessons_count, xp_reward, is_published)",
      )
      .in("learning_path_id", pathIds)
      .order("order_index", { ascending: true });

    if (pcError) {
      return apiInternalError(pcError.message);
    }

    // Group courses by learning path
    const coursesByPath = new Map<
      string,
      Array<{
        id: string;
        course_id: string;
        order_index: number;
        is_required: boolean;
        course: {
          id: string;
          title: string;
          description: string;
          thumbnail_url: string | null;
          category: string;
          difficulty: string;
          duration_minutes: number;
          lessons_count: number;
          xp_reward: number;
          is_published: boolean;
        } | null;
      }>
    >();

    for (const pc of pathCourses ?? []) {
      const existing = coursesByPath.get(pc.learning_path_id) ?? [];
      existing.push(pc);
      coursesByPath.set(pc.learning_path_id, existing);
    }

    // Fetch user progress for learning paths
    let userProgressMap = new Map<
      string,
      {
        started_at: string;
        completed_at: string | null;
        current_course_index: number;
      }
    >();

    // Fetch user course progress for computing per-course completion
    let courseProgressMap = new Map<
      string,
      { progress_percent: number; completed_at: string | null }
    >();

    if (userId) {
      const { data: userProgress } = await supabase
        .from("user_learning_path_progress")
        .select("learning_path_id, started_at, completed_at, current_course_index")
        .eq("user_id", userId)
        .in("learning_path_id", pathIds);

      if (userProgress) {
        userProgressMap = new Map(
          userProgress.map((up) => [
            up.learning_path_id,
            {
              started_at: up.started_at,
              completed_at: up.completed_at,
              current_course_index: up.current_course_index,
            },
          ]),
        );
      }

      // Get all course IDs across all paths
      const allCourseIds = (pathCourses ?? [])
        .map((pc) => pc.course_id)
        .filter((id, i, arr) => arr.indexOf(id) === i);

      if (allCourseIds.length > 0) {
        const { data: courseProgress } = await supabase
          .from("user_course_progress")
          .select("course_id, progress_percent, completed_at")
          .eq("user_id", userId)
          .in("course_id", allCourseIds);

        if (courseProgress) {
          courseProgressMap = new Map(
            courseProgress.map((cp) => [
              cp.course_id,
              {
                progress_percent: cp.progress_percent,
                completed_at: cp.completed_at,
              },
            ]),
          );
        }
      }
    }

    // Enrich learning paths with courses and progress data
    const enrichedPaths = paths.map((path) => {
      const courses = (coursesByPath.get(path.id) ?? [])
        .filter((pc) => pc.course?.is_published)
        .map((pc) => {
          const cp = courseProgressMap.get(pc.course_id);
          return {
            ...pc.course,
            order_index: pc.order_index,
            is_required: pc.is_required,
            progressPercentage: cp?.progress_percent ?? 0,
            isCompleted: cp?.completed_at != null,
          };
        });

      const userProgress = userProgressMap.get(path.id);
      const totalCourses = courses.length;
      const completedCourses = courses.filter((c) => c.isCompleted).length;
      const overallProgress =
        totalCourses > 0
          ? Math.round((completedCourses / totalCourses) * 100)
          : 0;

      return {
        ...path,
        courses,
        totalCourses,
        completedCourses,
        overallProgress,
        isEnrolled: userProgress != null,
        isCompleted: userProgress?.completed_at != null,
        isStarted: userProgress != null,
        currentCourseIndex: userProgress?.current_course_index ?? 0,
      };
    });

    return apiSuccess(enrichedPaths);
  } catch {
    return apiInternalError();
  }
}
