// =============================================================================
// Innovation Radar API Zod Validators
// Validation schemas for all /api/innovation-radar/* route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums / Constants
// ---------------------------------------------------------------------------

export const radarCategories = [
  "tools",
  "techniques",
  "platforms",
  "frameworks",
] as const;

export type RadarCategory = (typeof radarCategories)[number];

export const radarRings = ["adopt", "trial", "assess", "hold"] as const;

export type RadarRing = (typeof radarRings)[number];

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------

/**
 * GET /api/innovation-radar - Query parameters for listing radar items
 */
export const listRadarItemsQuerySchema = z.object({
  category: z.enum(radarCategories).optional(),
  ring: z.enum(radarRings).optional(),
  search: z.string().max(200).optional(),
  sort: z
    .enum(["newest", "most_voted", "title"])
    .default("most_voted"),
});

export type ListRadarItemsQuery = z.infer<typeof listRadarItemsQuerySchema>;

// ---------------------------------------------------------------------------
// Category & Ring Labels (German)
// ---------------------------------------------------------------------------

export const CATEGORY_LABELS: Record<RadarCategory, string> = {
  techniques: "Techniken",
  tools: "Tools",
  platforms: "Plattformen",
  frameworks: "Sprachen & Frameworks",
};

export const RING_LABELS: Record<RadarRing, string> = {
  adopt: "Adopt",
  trial: "Trial",
  assess: "Assess",
  hold: "Hold",
};
