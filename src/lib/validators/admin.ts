// =============================================================================
// Admin API Zod Validators
// Validation schemas for all /api/admin/* route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider Management
// ---------------------------------------------------------------------------

/**
 * PUT /api/admin/providers - Update a provider's configuration
 */
export const updateProviderSchema = z.object({
  id: z.string().uuid("Invalid provider ID"),
  model: z.string().min(1, "Model name is required").optional(),
  temperature: z
    .number()
    .min(0, "Temperature must be >= 0")
    .max(2, "Temperature must be <= 2")
    .optional(),
  max_tokens: z
    .number()
    .int("max_tokens must be an integer")
    .min(1, "max_tokens must be >= 1")
    .max(128_000, "max_tokens must be <= 128000")
    .optional(),
  top_p: z
    .number()
    .min(0, "top_p must be >= 0")
    .max(1, "top_p must be <= 1")
    .optional(),
  is_active: z.boolean().optional(),
  is_primary: z.boolean().optional(),
  fallback_provider_id: z.string().uuid("Invalid fallback provider ID").nullable().optional(),
  monthly_budget_limit: z.number().min(0).nullable().optional(),
});

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;

/**
 * POST /api/admin/providers/test - Health check a provider
 */
export const testProviderSchema = z.object({
  id: z.string().uuid("Invalid provider ID"),
});

export type TestProviderInput = z.infer<typeof testProviderSchema>;

// ---------------------------------------------------------------------------
// Cost Dashboard
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/costs - Query parameters
 */
export const costQuerySchema = z.object({
  period: z.enum(["day", "week", "month"]).default("month"),
  provider_id: z.string().uuid("Invalid provider ID").optional(),
  feature: z
    .enum(["mentor_chat", "usecase_eval", "search", "auto_tag", "summary"])
    .optional(),
});

export type CostQueryInput = z.infer<typeof costQuerySchema>;

// ---------------------------------------------------------------------------
// System Prompts
// ---------------------------------------------------------------------------

/**
 * PUT /api/admin/prompts - Update a system prompt (creates new version)
 */
export const updatePromptSchema = z.object({
  prompt_key: z
    .string()
    .min(1, "prompt_key is required")
    .max(100, "prompt_key must be <= 100 characters"),
  prompt_text: z
    .string()
    .min(1, "prompt_text is required")
    .max(50_000, "prompt_text must be <= 50000 characters"),
});

export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;

// ---------------------------------------------------------------------------
// Feature Toggles
// ---------------------------------------------------------------------------

/**
 * PUT /api/admin/features - Toggle a feature flag
 */
export const updateFeatureSchema = z.object({
  id: z.string().uuid("Invalid feature flag ID"),
  enabled: z.boolean({ required_error: "enabled is required" }),
});

export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
