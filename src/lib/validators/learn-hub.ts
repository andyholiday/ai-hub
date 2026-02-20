// =============================================================================
// Learn Hub API Zod Validators
// Validation schemas for all /api/learn-hub/* route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Difficulty Levels
// ---------------------------------------------------------------------------

export const difficultyLevels = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type DifficultyLevel = (typeof difficultyLevels)[number];

// ---------------------------------------------------------------------------
// Course Listing Query
// ---------------------------------------------------------------------------

/**
 * GET /api/learn-hub/courses - Query parameters for listing courses
 */
export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().max(100).optional(),
  difficulty: z.enum(difficultyLevels).optional(),
  search: z.string().max(200).optional(),
});

export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;

// ---------------------------------------------------------------------------
// Lesson Completion
// ---------------------------------------------------------------------------

/**
 * POST /api/learn-hub/courses/[courseId]/lessons/[lessonId] - Mark lesson complete
 */
export const lessonCompletionSchema = z.object({
  quiz_answers: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0),
        selectedOption: z.number().int().min(0),
      }),
    )
    .optional(),
});

export type LessonCompletionInput = z.infer<typeof lessonCompletionSchema>;

// ---------------------------------------------------------------------------
// Quiz Question Schema (for parsing lesson content JSON)
// ---------------------------------------------------------------------------

export const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().optional(),
});

export const quizContentSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1),
  passingScore: z.number().int().min(0).max(100).default(70),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizContent = z.infer<typeof quizContentSchema>;
