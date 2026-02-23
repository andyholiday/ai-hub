// =============================================================================
// Recommendations API Zod Validators
// Validation schemas for /api/recommendations route query parameters
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// GET /api/recommendations - Query parameters
// ---------------------------------------------------------------------------

export const recommendationsQuerySchema = z.object({
  /** Maximum number of recommendations to return (1-12, default 6) */
  limit: z.coerce
    .number()
    .int("Limit muss eine ganze Zahl sein")
    .min(1, "Limit muss mindestens 1 sein")
    .max(12, "Limit darf maximal 12 sein")
    .default(6),
});

export type RecommendationsQueryInput = z.infer<typeof recommendationsQuerySchema>;
