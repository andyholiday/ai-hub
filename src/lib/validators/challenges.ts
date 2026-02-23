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
 * PATCH /api/challenges/[challengeId]/progress - Update user progress
 */
export const updateProgressSchema = z.object({
  progress: z
    .number()
    .int("Fortschritt muss eine ganze Zahl sein")
    .min(0, "Fortschritt muss mindestens 0 sein")
    .max(100, "Fortschritt darf maximal 100 sein"),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
