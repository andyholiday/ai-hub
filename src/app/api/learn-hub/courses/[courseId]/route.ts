// =============================================================================
// Learn Hub - Course Detail API
// GET /api/learn-hub/courses/[courseId] - Single course with lessons & progress
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiNotFound,
  apiInternalError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET - Single course with all lessons and user progress
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const { courseId } = params;

    // Optionally authenticate for progress data
    const auth = await requireAuth(req);
    const userId = !("response" in auth) ? auth.userId : null;

    const supabase = createAdminClient();

    // Fetch the course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(
        "*, author:profiles!courses_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .eq("id", courseId)
      .eq("is_published", true)
      .single();

    if (courseError || !course) {
      return apiNotFound("Kurs nicht gefunden");
    }

    // Fetch all lessons for this course, ordered by order_index
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      return apiInternalError(lessonsError.message);
    }

    // Fetch user progress for this course
    let courseProgress: {
      progress_percent: number;
      completed_at: string | null;
      certificate_id: string | null;
    } | null = null;

    let completedLessonIds = new Set<string>();

    if (userId) {
      // Course-level progress
      const { data: progressData } = await supabase
        .from("user_course_progress")
        .select("progress_percent, completed_at, certificate_id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

      courseProgress = progressData;

      // Lesson-level progress
      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map((l) => l.id);
        const { data: lessonProgress } = await supabase
          .from("user_lesson_progress")
          .select("lesson_id, quiz_score")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds);

        if (lessonProgress) {
          completedLessonIds = new Set(
            lessonProgress.map((lp) => lp.lesson_id),
          );
        }
      }
    }

    // Enrich lessons with completion status
    const enrichedLessons = (lessons ?? []).map((lesson) => ({
      ...lesson,
      isCompleted: completedLessonIds.has(lesson.id),
    }));

    const completedCount = completedLessonIds.size;
    const totalLessons = lessons?.length ?? 0;
    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

    const result = {
      ...course,
      lessons: enrichedLessons,
      completedLessons: completedCount,
      totalLessons,
      progressPercentage,
      isCompleted: courseProgress?.completed_at != null,
      isStarted:
        (courseProgress?.progress_percent ?? 0) > 0 || completedCount > 0,
      certificateId: courseProgress?.certificate_id ?? null,
    };

    return apiSuccess(result);
  } catch {
    return apiInternalError();
  }
}
