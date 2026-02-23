// =============================================================================
// Leaderboard Zod Validators
// Validation schemas for /api/leaderboard route query parameters
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// GET /api/leaderboard - Query parameters
// ---------------------------------------------------------------------------

export const leaderboardQuerySchema = z.object({
  /** Time period filter (week, month, all). Defaults to "month". */
  period: z.enum(["week", "month", "all"]).default("month"),

  /** Maximum number of ranked users to return. */
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(5, "Limit must be >= 5")
    .max(100, "Limit must be <= 100")
    .default(20),
});

export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;
