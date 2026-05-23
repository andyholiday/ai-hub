// =============================================================================
// Best Practices API Zod Validators
// Validation schemas for all /api/best-practices/* route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Category Enum
// ---------------------------------------------------------------------------

export const bestPracticeCategories = [
  "prompt_engineering",
  "ai_tools",
  "automation",
  "data_analysis",
  "ai_ethics",
  "other",
] as const;

export type BestPracticeCategory = (typeof bestPracticeCategories)[number];

// ---------------------------------------------------------------------------
// Status Enum
// ---------------------------------------------------------------------------

export const bestPracticeStatuses = ["draft", "published", "archived"] as const;

export type BestPracticeStatus = (typeof bestPracticeStatuses)[number];

// ---------------------------------------------------------------------------
// Tags helper
// ---------------------------------------------------------------------------

const tagsSchema = z
  .array(z.string().min(1).max(30, "Tag darf maximal 30 Zeichen lang sein"))
  .max(10, "Maximal 10 Tags erlaubt")
  .default([]);

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * POST /api/best-practices
 */
export const createBestPracticeSchema = z.object({
  title: z
    .string()
    .min(5, "Titel muss mindestens 5 Zeichen lang sein")
    .max(150, "Titel darf maximal 150 Zeichen lang sein"),
  summary: z
    .string()
    .max(500, "Zusammenfassung darf maximal 500 Zeichen lang sein")
    .optional()
    .default(""),
  content: z
    .string()
    .min(50, "Inhalt muss mindestens 50 Zeichen lang sein")
    .max(50_000, "Inhalt darf maximal 50.000 Zeichen lang sein"),
  category: z
    .enum(bestPracticeCategories, {
      errorMap: () => ({ message: "Ungueltige Kategorie" }),
    })
    .default("other"),
  tags: tagsSchema,
  status: z
    .enum(bestPracticeStatuses, {
      errorMap: () => ({ message: "Ungueltiger Status" }),
    })
    .default("draft"),
});

export type CreateBestPracticeInput = z.infer<typeof createBestPracticeSchema>;

// ---------------------------------------------------------------------------
// Update (PATCH — all fields optional)
// ---------------------------------------------------------------------------

/**
 * PATCH /api/best-practices/[id]
 */
export const updateBestPracticeSchema = z.object({
  title: z
    .string()
    .min(5, "Titel muss mindestens 5 Zeichen lang sein")
    .max(150, "Titel darf maximal 150 Zeichen lang sein")
    .optional(),
  summary: z
    .string()
    .max(500, "Zusammenfassung darf maximal 500 Zeichen lang sein")
    .optional(),
  content: z
    .string()
    .min(50, "Inhalt muss mindestens 50 Zeichen lang sein")
    .max(50_000, "Inhalt darf maximal 50.000 Zeichen lang sein")
    .optional(),
  category: z
    .enum(bestPracticeCategories, {
      errorMap: () => ({ message: "Ungueltige Kategorie" }),
    })
    .optional(),
  tags: tagsSchema.optional(),
  status: z
    .enum(bestPracticeStatuses, {
      errorMap: () => ({ message: "Ungueltiger Status" }),
    })
    .optional(),
});

export type UpdateBestPracticeInput = z.infer<typeof updateBestPracticeSchema>;

// ---------------------------------------------------------------------------
// List Query Parameters
// ---------------------------------------------------------------------------

/**
 * GET /api/best-practices — Query parameters
 */
export const listBestPracticesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(bestPracticeCategories).optional(),
  status: z.enum(bestPracticeStatuses).optional(),
  mine: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  sort: z
    .enum(["newest", "most_upvoted", "most_viewed"])
    .default("newest"),
  search: z.string().max(200).optional(),
});

export type ListBestPracticesQuery = z.infer<typeof listBestPracticesQuerySchema>;
