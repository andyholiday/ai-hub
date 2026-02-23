// =============================================================================
// Learn Hub - Learning Path Detail API
// GET  /api/learn-hub/paths/[pathId] - Single learning path with details
// POST /api/learn-hub/paths/[pathId] - Enroll in a learning path
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiNotFound,
  apiInternalError,
  apiBadRequest,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrollLearningPathSchema } from "@/lib/validators/learn-hub";

// ---------------------------------------------------------------------------
// GET - Single learning path with courses and user progress
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { pathId: string } },
) {
  try {
    const { pathId } = params;

    // Optionally authenticate for progress data
    const auth = await requireAuth(req);
    const userId = !("response" in auth) ? auth.userId : null;

    const supabase = createAdminClient();

    // Fetch the learning path
    const { data: path, error: pathError } = await supabase
      .from("learning_paths")
      .select("*")
      .eq("id", pathId)
      .eq("is_published", true)
      .single();

    if (pathError || !path) {
      return apiNotFound("Lernpfad nicht gefunden");
    }

    // Fetch courses in this learning path, ordered
    const { data: pathCourses, error: pcError } = await supabase
      .from("learning_path_courses")
      .select(
        "*, course:courses(id, title, description, thumbnail_url, category, difficulty, duration_minutes, lessons_count, xp_reward, is_published)",
      )
      .eq("learning_path_id", pathId)
      .order("order_index", { ascending: true });

    if (pcError) {
      return apiInternalError(pcError.message);
    }

    // Get course IDs for progress lookup
    const courseIds = (pathCourses ?? []).map((pc) => pc.course_id);

    // Fetch user progress
    let userPathProgress: {
      started_at: string;
      completed_at: string | null;
      current_course_index: number;
    } | null = null;

    let courseProgressMap = new Map<
      string,
      { progress_percent: number; completed_at: string | null }
    >();

    const completedLessonsMap = new Map<string, number>();

    if (userId) {
      // Learning path progress
      const { data: pathProgress } = await supabase
        .from("user_learning_path_progress")
        .select("started_at, completed_at, current_course_index")
        .eq("user_id", userId)
        .eq("learning_path_id", pathId)
        .single();

      userPathProgress = pathProgress;

      // Course-level progress
      if (courseIds.length > 0) {
        const { data: courseProgress } = await supabase
          .from("user_course_progress")
          .select("course_id, progress_percent, completed_at")
          .eq("user_id", userId)
          .in("course_id", courseIds);

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

        // Lesson-level progress for each course
        const { data: allLessons } = await supabase
          .from("lessons")
          .select("id, course_id")
          .in("course_id", courseIds);

        if (allLessons && allLessons.length > 0) {
          const lessonIds = allLessons.map((l) => l.id);
          const { data: completedLessons } = await supabase
            .from("user_lesson_progress")
            .select("lesson_id")
            .eq("user_id", userId)
            .in("lesson_id", lessonIds);

          if (completedLessons) {
            const completedLessonIds = new Set(
              completedLessons.map((cl) => cl.lesson_id),
            );

            for (const lesson of allLessons) {
              if (completedLessonIds.has(lesson.id)) {
                const current = completedLessonsMap.get(lesson.course_id) ?? 0;
                completedLessonsMap.set(lesson.course_id, current + 1);
              }
            }
          }
        }
      }
    }

    // Enrich courses with progress
    const enrichedCourses = (pathCourses ?? [])
      .filter((pc) => pc.course?.is_published)
      .map((pc) => {
        const cp = courseProgressMap.get(pc.course_id);
        const completedLessons = completedLessonsMap.get(pc.course_id) ?? 0;

        return {
          ...pc.course,
          order_index: pc.order_index,
          is_required: pc.is_required,
          progressPercentage: cp?.progress_percent ?? 0,
          isCompleted: cp?.completed_at != null,
          isStarted: (cp?.progress_percent ?? 0) > 0 || completedLessons > 0,
          completedLessons,
        };
      });

    const totalCourses = enrichedCourses.length;
    const completedCourses = enrichedCourses.filter((c) => c.isCompleted).length;
    const overallProgress =
      totalCourses > 0
        ? Math.round((completedCourses / totalCourses) * 100)
        : 0;

    // Find the next recommended course (first non-completed)
    const nextCourseIndex = enrichedCourses.findIndex((c) => !c.isCompleted);

    const result = {
      ...path,
      courses: enrichedCourses,
      totalCourses,
      completedCourses,
      overallProgress,
      isEnrolled: userPathProgress != null,
      isCompleted: userPathProgress?.completed_at != null,
      isStarted: userPathProgress != null,
      currentCourseIndex: userPathProgress?.current_course_index ?? 0,
      nextCourseIndex: nextCourseIndex >= 0 ? nextCourseIndex : null,
      totalXP: enrichedCourses.reduce((sum, c) => sum + (c.xp_reward ?? 0), 0),
    };

    return apiSuccess(result);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// POST - Enroll in a learning path
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: { pathId: string } },
) {
  try {
    const { pathId } = params;

    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const body: unknown = await req.json();
    const parsed = enrollLearningPathSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const supabase = createAdminClient();

    // Verify learning path exists and is published
    const { data: path, error: pathError } = await supabase
      .from("learning_paths")
      .select("id, title")
      .eq("id", pathId)
      .eq("is_published", true)
      .single();

    if (pathError || !path) {
      return apiNotFound("Lernpfad nicht gefunden");
    }

    // Check if already enrolled
    const { data: existingProgress } = await supabase
      .from("user_learning_path_progress")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("learning_path_id", pathId)
      .single();

    if (existingProgress) {
      return apiBadRequest("Du bist bereits in diesem Lernpfad eingeschrieben");
    }

    // Enroll the user
    const { error: insertError } = await supabase
      .from("user_learning_path_progress")
      .insert({
        user_id: auth.userId,
        learning_path_id: pathId,
        current_course_index: 0,
      });

    if (insertError) {
      return apiInternalError(insertError.message);
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: auth.userId,
      type: "achievement",
      title: "Lernpfad gestartet!",
      message: `Du hast den Lernpfad "${path.title}" begonnen. Viel Erfolg!`,
      link: `/learn-hub/paths/${pathId}`,
    });

    return apiSuccess(
      {
        enrolled: true,
        message: `Lernpfad "${path.title}" erfolgreich gestartet!`,
      },
      201,
    );
  } catch {
    return apiInternalError();
  }
}
