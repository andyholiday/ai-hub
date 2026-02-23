// =============================================================================
// Profile API Zod Validators
// Validation schemas for /api/profile route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Profile Update
// ---------------------------------------------------------------------------

/**
 * PATCH /api/profile - Update the authenticated user's profile fields
 */
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(100, "Name darf maximal 100 Zeichen lang sein")
    .optional(),
  bio: z
    .string()
    .max(500, "Bio darf maximal 500 Zeichen lang sein")
    .optional(),
  department: z
    .string()
    .max(100, "Abteilung darf maximal 100 Zeichen lang sein")
    .optional(),
  position: z
    .string()
    .max(100, "Position darf maximal 100 Zeichen lang sein")
    .optional(),
  onboarding_completed: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
