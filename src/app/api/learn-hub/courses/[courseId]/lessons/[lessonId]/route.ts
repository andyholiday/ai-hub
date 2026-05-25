// =============================================================================
// Learn Hub - Lesson API
// GET  /api/learn-hub/courses/[courseId]/lessons/[lessonId] - Load lesson
// POST /api/learn-hub/courses/[courseId]/lessons/[lessonId] - Complete lesson
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
import { awardXP } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievements";
import {
  lessonCompletionSchema,
  quizContentSchema,
} from "@/lib/validators/learn-hub";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LESSON_XP_REWARD = 20;

// ---------------------------------------------------------------------------
// GET - Load a single lesson with context
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } },
) {
  try {
    const { courseId, lessonId } = params;

    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const supabase = createAdminClient();

    // Verify course exists and is published
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, lessons_count")
      .eq("id", courseId)
      .eq("is_published", true)
      .single();

    if (courseError || !course) {
      return apiNotFound("Kurs nicht gefunden");
    }

    // Fetch the lesson
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .single();

    if (lessonError || !lesson) {
      return apiNotFound("Lektion nicht gefunden");
    }

    // Fetch all lessons for navigation context
    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    // Check completion status
    const { data: progressData } = await supabase
      .from("user_lesson_progress")
      .select("completed_at, quiz_score")
      .eq("user_id", auth.userId)
      .eq("lesson_id", lessonId)
      .single();

    // Get completed lesson IDs for progress indicator
    const lessonIds = (allLessons ?? []).map((l) => l.id);
    const { data: completedData } = await supabase
      .from("user_lesson_progress")
      .select("lesson_id")
      .eq("user_id", auth.userId)
      .in("lesson_id", lessonIds);

    const completedLessonIds = new Set(
      (completedData ?? []).map((c) => c.lesson_id),
    );

    // Determine previous and next lessons
    const lessonIndex = (allLessons ?? []).findIndex((l) => l.id === lessonId);
    const previousLesson =
      lessonIndex > 0 ? (allLessons ?? [])[lessonIndex - 1] ?? null : null;
    const nextLesson =
      lessonIndex < (allLessons ?? []).length - 1
        ? (allLessons ?? [])[lessonIndex + 1] ?? null
        : null;

    const result = {
      ...lesson,
      courseTitle: course.title,
      isCompleted: progressData != null,
      quizScore: progressData?.quiz_score ?? null,
      currentIndex: lessonIndex + 1,
      totalLessons: allLessons?.length ?? 0,
      completedLessonIds: Array.from(completedLessonIds),
      previousLesson: previousLesson
        ? { id: previousLesson.id, title: previousLesson.title }
        : null,
      nextLesson: nextLesson
        ? { id: nextLesson.id, title: nextLesson.title }
        : null,
    };

    return apiSuccess(result);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// POST - Mark lesson as completed (+ award XP)
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } },
) {
  try {
    const { courseId, lessonId } = params;

    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const body: unknown = await req.json();
    const parsed = lessonCompletionSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const supabase = createAdminClient();

    // Verify course and lesson exist
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .single();

    if (lessonError || !lesson) {
      return apiNotFound("Lektion nicht gefunden");
    }

    // Check if already completed
    const { data: existingProgress } = await supabase
      .from("user_lesson_progress")
      .select("lesson_id")
      .eq("user_id", auth.userId)
      .eq("lesson_id", lessonId)
      .single();

    if (existingProgress) {
      return apiBadRequest("Lektion wurde bereits abgeschlossen");
    }

    // Handle quiz scoring
    let quizScore: number | null = null;

    if (lesson.type === "quiz" && parsed.data.quiz_answers) {
      const quizParsed = quizContentSchema.safeParse(
        JSON.parse(lesson.content),
      );

      if (!quizParsed.success) {
        return apiInternalError("Quiz-Daten konnten nicht geladen werden");
      }

      const quizData = quizParsed.data;
      const answers = parsed.data.quiz_answers;
      let correctCount = 0;

      for (const answer of answers) {
        const question = quizData.questions[answer.questionIndex];
        if (question && answer.selectedOption === question.correctIndex) {
          correctCount++;
        }
      }

      quizScore = Math.round(
        (correctCount / quizData.questions.length) * 100,
      );
      const passingScore = quizData.passingScore;

      if (quizScore < passingScore) {
        return apiSuccess({
          passed: false,
          quizScore,
          requiredScore: passingScore,
          message: `Du brauchst mindestens ${passingScore}% zum Bestehen. Dein Ergebnis: ${quizScore}%`,
        });
      }
    }

    // Insert lesson progress
    const { error: insertError } = await supabase
      .from("user_lesson_progress")
      .insert({
        user_id: auth.userId,
        lesson_id: lessonId,
        quiz_score: quizScore,
      });

    if (insertError) {
      return apiInternalError(insertError.message);
    }

    // Ensure course progress record exists (the trigger handles percent update)
    const { data: existingCourseProgress } = await supabase
      .from("user_course_progress")
      .select("user_id")
      .eq("user_id", auth.userId)
      .eq("course_id", courseId)
      .single();

    if (!existingCourseProgress) {
      await supabase.from("user_course_progress").insert({
        user_id: auth.userId,
        course_id: courseId,
        progress_percent: 0,
      });
    }

    // Award XP for lesson completion (fire-and-forget) — M-04 idempotency key
    awardXP(supabase, auth.userId, "lesson_completed", LESSON_XP_REWARD, `lesson:${lessonId}`).then(
      () => {
        checkAndAwardBadges(supabase, auth.userId);
        checkAndUnlockAchievements(supabase, auth.userId).catch(() => { });
      },
    );

    return apiSuccess(
      {
        passed: true,
        quizScore,
        xpAwarded: LESSON_XP_REWARD,
        message: "Lektion erfolgreich abgeschlossen!",
      },
      201,
    );
  } catch {
    return apiInternalError();
  }
}
