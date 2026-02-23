// =============================================================================
// Learn Hub - Course Completion API
// POST /api/learn-hub/courses/[courseId]/complete - Mark course as completed
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiNotFound,
  apiInternalError,
  apiBadRequest,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardXP } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievements";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST - Mark course as completed (all lessons must be done)
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const { courseId } = params;

    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const supabase = createAdminClient();

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, xp_reward, lessons_count")
      .eq("id", courseId)
      .eq("is_published", true)
      .single();

    if (courseError || !course) {
      return apiNotFound("Kurs nicht gefunden");
    }

    // Check if already completed
    const { data: existingProgress } = await supabase
      .from("user_course_progress")
      .select("completed_at, certificate_id")
      .eq("user_id", auth.userId)
      .eq("course_id", courseId)
      .single();

    if (existingProgress?.completed_at) {
      return apiBadRequest("Kurs wurde bereits abgeschlossen");
    }

    // Verify all lessons are completed
    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId);

    if (!allLessons || allLessons.length === 0) {
      return apiBadRequest("Kurs hat keine Lektionen");
    }

    const lessonIds = allLessons.map((l) => l.id);
    const { data: completedLessons } = await supabase
      .from("user_lesson_progress")
      .select("lesson_id")
      .eq("user_id", auth.userId)
      .in("lesson_id", lessonIds);

    const completedCount = completedLessons?.length ?? 0;

    if (completedCount < allLessons.length) {
      return apiBadRequest(
        `Nicht alle Lektionen abgeschlossen (${completedCount}/${allLessons.length})`,
      );
    }

    // Generate certificate data
    const certificateId = crypto.randomUUID();
    const completedAt = new Date().toISOString();

    // Fetch user profile for certificate
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", auth.userId)
      .single();

    // Update course progress
    const { error: updateError } = await supabase
      .from("user_course_progress")
      .upsert({
        user_id: auth.userId,
        course_id: courseId,
        progress_percent: 100,
        completed_at: completedAt,
        certificate_id: certificateId,
      });

    if (updateError) {
      return apiInternalError(updateError.message);
    }

    // Award course XP (fire-and-forget)
    awardXP(
      supabase,
      auth.userId,
      "course_completed",
      course.xp_reward,
    ).then(() => {
      checkAndAwardBadges(supabase, auth.userId);
      checkAndUnlockAchievements(supabase, auth.userId).catch(() => {});
    });

    // Create notification
    await supabase.from("notifications").insert({
      user_id: auth.userId,
      type: "achievement",
      title: "Kurs abgeschlossen!",
      message: `Du hast den Kurs "${course.title}" erfolgreich abgeschlossen und ${course.xp_reward} XP erhalten!`,
      link: `/learn-hub/${courseId}`,
    });

    return apiSuccess(
      {
        completed: true,
        certificateId,
        completedAt,
        xpAwarded: course.xp_reward,
        certificate: {
          id: certificateId,
          courseName: course.title,
          userName: profile?.full_name ?? "Unbekannt",
          completedAt,
          lessonsCompleted: allLessons.length,
        },
      },
      201,
    );
  } catch {
    return apiInternalError();
  }
}
