// =============================================================================
// Challenges API Zod Validators
// Validation schemas for all /api/challenges/* route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------

/**
 * GET /api/challenges - Query parameters for listing challenges
 */
export const listChallengesQuerySchema = z.object({
  status: z.enum(["active", "completed", "all"]).default("active"),
});

export type ListChallengesQuery = z.infer<typeof listChallengesQuerySchema>;

// ---------------------------------------------------------------------------
// Progress Update
// ---------------------------------------------------------------------------

/**
 * PATCH /api/challenges/[challengeId]/progress - Report a server-known event
 * Server maps event → progress increment; client cannot self-award progress values.
 */
export const updateProgressSchema = z.object({
  eventType: z.enum(["lesson_completed", "step_done", "quiz_passed"], {
    errorMap: () => ({ message: "Unbekannter Event-Typ" }),
  }),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
