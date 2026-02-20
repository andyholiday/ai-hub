// =============================================================================
// Evaluation API Zod Validators
// Validation schemas for /api/ai/evaluate route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Evaluation Request
// ---------------------------------------------------------------------------

/**
 * POST /api/ai/evaluate - Request AI evaluation of a use-case idea
 */
export const evaluateUseCaseSchema = z.object({
  postId: z
    .string()
    .uuid("Ungueltige Post-ID"),
  title: z
    .string()
    .min(3, "Titel muss mindestens 3 Zeichen lang sein")
    .max(200, "Titel darf maximal 200 Zeichen lang sein"),
  description: z
    .string()
    .min(10, "Beschreibung muss mindestens 10 Zeichen lang sein")
    .max(50_000, "Beschreibung darf maximal 50.000 Zeichen lang sein"),
});

export type EvaluateUseCaseInput = z.infer<typeof evaluateUseCaseSchema>;

// ---------------------------------------------------------------------------
// Score Types (shared between evaluator and API)
// ---------------------------------------------------------------------------

export const useCaseScoresSchema = z.object({
  feasibility: z.number().min(0).max(100),
  impact: z.number().min(0).max(100),
  effort: z.number().min(0).max(100),
  innovation: z.number().min(0).max(100),
  aiReadiness: z.number().min(0).max(100),
});

export type UseCaseScores = z.infer<typeof useCaseScoresSchema>;

export const recommendationSchema = z.enum([
  "highly_recommended",
  "recommended",
  "consider",
  "not_recommended",
]);

export type Recommendation = z.infer<typeof recommendationSchema>;

export const useCaseEvaluationSchema = z.object({
  scores: useCaseScoresSchema,
  overallScore: z.number().min(0).max(100),
  recommendation: recommendationSchema,
  evaluationText: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export type UseCaseEvaluation = z.infer<typeof useCaseEvaluationSchema>;
