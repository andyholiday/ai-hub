// =============================================================================
// Learn Hub - Courses API
// GET /api/learn-hub/courses - List published courses with user progress
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { listCoursesQuerySchema } from "@/lib/validators/learn-hub";
import type { PaginationMeta } from "@/types/api";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET - List published courses with optional filters and user progress
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryRaw = {
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      difficulty: searchParams.get("difficulty") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const parsed = listCoursesQuerySchema.safeParse(queryRaw);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { page, pageSize, category, difficulty, search } = parsed.data;

    // Optionally authenticate for progress data
    const auth = await requireAuth(req);
    const userId = !("response" in auth) ? auth.userId : null;

    const supabase = createAdminClient();

    // Build query for published courses
    let query = supabase
      .from("courses")
      .select(
        "*, author:profiles!courses_author_id_fkey(id, full_name, avatar_url, level)",
        { count: "exact" },
      )
      .eq("is_published", true);

    // Filters
    if (category) {
      query = query.eq("category", category);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Sorting: newest first
    query = query.order("created_at", { ascending: false });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: courses, error, count } = await query;

    if (error) {
      return apiInternalError(error.message);
    }

    // -----------------------------------------------------------------------
    // Fetch user progress and completed lessons in PARALLEL (was sequential).
    // Before: 3 sequential queries (progress -> all lessons -> completed).
    // After:  2 parallel queries (progress + lesson-progress via join).
    // -----------------------------------------------------------------------
    let progressMap = new Map<
      string,
      { progress_percent: number; completed_at: string | null }
    >();
    const completedLessonsMap = new Map<string, number>();

    if (userId && courses && courses.length > 0) {
      const courseIds = courses.map((c) => c.id);

      // Run both queries in parallel instead of sequentially
      const [progressResult, lessonsResult] = await Promise.all([
        // 1. Course-level progress
        supabase
          .from("user_course_progress")
          .select("course_id, progress_percent, completed_at")
          .eq("user_id", userId)
          .in("course_id", courseIds),

        // 2. Completed lessons with their course_id via join
        //    (replaces the previous 2-step: fetch all lessons -> fetch completed)
        supabase
          .from("user_lesson_progress")
          .select("lesson_id, lessons!inner(course_id)")
          .eq("user_id", userId)
          .in("lessons.course_id", courseIds),
      ]);

      // Process course progress
      if (progressResult.data) {
        progressMap = new Map(
          progressResult.data.map((p) => [
            p.course_id,
            {
              progress_percent: p.progress_percent,
              completed_at: p.completed_at,
            },
          ]),
        );
      }

      // Process completed lessons count per course
      if (lessonsResult.data) {
        for (const row of lessonsResult.data) {
          // The join returns lessons as an object with course_id
          const courseId = (row.lessons as unknown as { course_id: string })?.course_id;
          if (courseId) {
            const current = completedLessonsMap.get(courseId) ?? 0;
            completedLessonsMap.set(courseId, current + 1);
          }
        }
      }
    }

    // Enrich courses with progress data
    const enrichedCourses = (courses ?? []).map((course) => {
      const progress = progressMap.get(course.id);
      const completedLessons = completedLessonsMap.get(course.id) ?? 0;
      const progressPercentage = progress?.progress_percent ?? 0;

      return {
        ...course,
        completedLessons,
        progressPercentage,
        isCompleted: progress?.completed_at != null,
        isStarted: progressPercentage > 0 || completedLessons > 0,
      };
    });

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const meta: PaginationMeta = {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return apiSuccess(enrichedCourses, 200, meta);
  } catch {
    return apiInternalError();
  }
}
