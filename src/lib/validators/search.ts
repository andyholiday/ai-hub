// =============================================================================
// Semantic Search Zod Validators
// Validation schemas for /api/search route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// POST /api/search - Semantic search request body
// ---------------------------------------------------------------------------

export const semanticSearchSchema = z.object({
  /** The user's natural-language search query. */
  query: z
    .string()
    .min(1, "Search query is required")
    .max(2000, "Search query must be <= 2000 characters"),

  /** Minimum cosine similarity threshold (0.0 - 1.0). */
  threshold: z
    .number()
    .min(0, "Threshold must be >= 0")
    .max(1, "Threshold must be <= 1")
    .default(0.7),

  /** Maximum number of results to return. */
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be >= 1")
    .max(100, "Limit must be <= 100")
    .default(10),

  /** Offset for pagination. */
  offset: z
    .number()
    .int("Offset must be an integer")
    .min(0, "Offset must be >= 0")
    .default(0),

  /** Optional category filter. */
  category: z
    .enum([
      "prompt_engineering",
      "ai_tools",
      "automation",
      "data_analysis",
      "ai_ethics",
      "other",
    ])
    .optional(),

  /** Optional tags filter (match any). */
  tags: z
    .array(z.string().min(1).max(100))
    .max(20, "Maximum 20 tags for filtering")
    .optional(),

  /** Optional difficulty filter. */
  difficulty: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
});

export type SemanticSearchInput = z.infer<typeof semanticSearchSchema>;
