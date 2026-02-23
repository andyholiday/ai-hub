// =============================================================================
// Learn Hub Constants
// Shared constants for difficulty labels and colors used across Learn Hub pages
// and components.
// =============================================================================

import type { DifficultyLevel } from "@/lib/validators/learn-hub";

/**
 * German display labels for difficulty levels.
 */
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Einsteiger",
  intermediate: "Fortgeschritten",
  advanced: "Experte",
};

/**
 * Badge color variants mapped to difficulty levels.
 */
export const DIFFICULTY_COLORS: Record<
  DifficultyLevel,
  "green" | "gold" | "red"
> = {
  beginner: "green",
  intermediate: "gold",
  advanced: "red",
};
