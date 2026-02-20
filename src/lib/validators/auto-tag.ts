// =============================================================================
// Auto-Tagging Zod Validators
// Validation schemas for /api/ai/auto-tag route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// POST /api/ai/auto-tag - Auto-tag request body
// ---------------------------------------------------------------------------

export const autoTagSchema = z.object({
  /** Title of the content to be tagged. */
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title must be <= 500 characters"),

  /** Description or body content to be tagged. */
  description: z
    .string()
    .min(1, "Description is required")
    .max(50_000, "Description must be <= 50000 characters"),

  /** Optional: existing tags to consider for deduplication. */
  existingTags: z
    .array(z.string().min(1).max(100))
    .max(50, "Maximum 50 existing tags")
    .optional(),

  /** Optional: maximum number of tag suggestions to return. */
  maxSuggestions: z
    .number()
    .int("maxSuggestions must be an integer")
    .min(1, "maxSuggestions must be >= 1")
    .max(20, "maxSuggestions must be <= 20")
    .default(5),
});

export type AutoTagInput = z.infer<typeof autoTagSchema>;
