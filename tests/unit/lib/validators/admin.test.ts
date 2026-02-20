// =============================================================================
// Tests: Admin Validators (Zod Schemas)
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  updateProviderSchema,
  testProviderSchema,
  costQuerySchema,
  updatePromptSchema,
  updateFeatureSchema,
} from "@/lib/validators/admin";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const INVALID_UUID = "not-a-uuid";

// ---------------------------------------------------------------------------
// updateProviderSchema
// ---------------------------------------------------------------------------

describe("updateProviderSchema", () => {
  it("should accept valid input with all fields", () => {
    const input = {
      id: VALID_UUID,
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.9,
      is_active: true,
      is_primary: false,
      fallback_provider_id: VALID_UUID,
      monthly_budget_limit: 100.0,
    };
    const result = updateProviderSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept minimal input (only id)", () => {
    const result = updateProviderSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const result = updateProviderSchema.safeParse({ id: INVALID_UUID });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Invalid provider ID");
    }
  });

  it("should reject temperature below 0", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      temperature: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject temperature above 2", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      temperature: 2.1,
    });
    expect(result.success).toBe(false);
  });

  it("should accept temperature boundary values (0 and 2)", () => {
    expect(
      updateProviderSchema.safeParse({ id: VALID_UUID, temperature: 0 }).success
    ).toBe(true);
    expect(
      updateProviderSchema.safeParse({ id: VALID_UUID, temperature: 2 }).success
    ).toBe(true);
  });

  it("should reject max_tokens as float", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      max_tokens: 100.5,
    });
    expect(result.success).toBe(false);
  });

  it("should reject max_tokens below 1", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      max_tokens: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject max_tokens above 128000", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      max_tokens: 128001,
    });
    expect(result.success).toBe(false);
  });

  it("should reject top_p outside 0-1 range", () => {
    expect(
      updateProviderSchema.safeParse({ id: VALID_UUID, top_p: -0.1 }).success
    ).toBe(false);
    expect(
      updateProviderSchema.safeParse({ id: VALID_UUID, top_p: 1.1 }).success
    ).toBe(false);
  });

  it("should accept null for fallback_provider_id", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      fallback_provider_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for fallback_provider_id", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      fallback_provider_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("should accept null for monthly_budget_limit", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      monthly_budget_limit: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative monthly_budget_limit", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      monthly_budget_limit: -10,
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty model string", () => {
    const result = updateProviderSchema.safeParse({
      id: VALID_UUID,
      model: "",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// testProviderSchema
// ---------------------------------------------------------------------------

describe("testProviderSchema", () => {
  it("should accept valid UUID", () => {
    const result = testProviderSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID", () => {
    const result = testProviderSchema.safeParse({ id: INVALID_UUID });
    expect(result.success).toBe(false);
  });

  it("should reject missing id", () => {
    const result = testProviderSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// costQuerySchema
// ---------------------------------------------------------------------------

describe("costQuerySchema", () => {
  it("should accept valid query with all fields", () => {
    const result = costQuerySchema.safeParse({
      period: "week",
      provider_id: VALID_UUID,
      feature: "mentor_chat",
    });
    expect(result.success).toBe(true);
  });

  it("should default period to 'month' when not provided", () => {
    const result = costQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.period).toBe("month");
    }
  });

  it("should accept all valid period values", () => {
    for (const period of ["day", "week", "month"] as const) {
      const result = costQuerySchema.safeParse({ period });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid period value", () => {
    const result = costQuerySchema.safeParse({ period: "year" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid feature values", () => {
    const features = [
      "mentor_chat",
      "usecase_eval",
      "search",
      "auto_tag",
      "summary",
    ] as const;
    for (const feature of features) {
      const result = costQuerySchema.safeParse({ feature });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid feature value", () => {
    const result = costQuerySchema.safeParse({ feature: "unknown_feature" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid provider_id UUID", () => {
    const result = costQuerySchema.safeParse({ provider_id: INVALID_UUID });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updatePromptSchema
// ---------------------------------------------------------------------------

describe("updatePromptSchema", () => {
  it("should accept valid prompt input", () => {
    const result = updatePromptSchema.safeParse({
      prompt_key: "mentor_system",
      prompt_text: "You are a helpful mentor for LR partners.",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty prompt_key", () => {
    const result = updatePromptSchema.safeParse({
      prompt_key: "",
      prompt_text: "Some text",
    });
    expect(result.success).toBe(false);
  });

  it("should reject prompt_key longer than 100 characters", () => {
    const result = updatePromptSchema.safeParse({
      prompt_key: "a".repeat(101),
      prompt_text: "Some text",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty prompt_text", () => {
    const result = updatePromptSchema.safeParse({
      prompt_key: "test",
      prompt_text: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject prompt_text longer than 50000 characters", () => {
    const result = updatePromptSchema.safeParse({
      prompt_key: "test",
      prompt_text: "x".repeat(50001),
    });
    expect(result.success).toBe(false);
  });

  it("should accept prompt_key at exactly 100 characters", () => {
    const result = updatePromptSchema.safeParse({
      prompt_key: "a".repeat(100),
      prompt_text: "Some text",
    });
    expect(result.success).toBe(true);
  });

  it("should accept prompt_text at exactly 50000 characters", () => {
    const result = updatePromptSchema.safeParse({
      prompt_key: "test",
      prompt_text: "x".repeat(50000),
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing prompt_key", () => {
    const result = updatePromptSchema.safeParse({
      prompt_text: "Some text",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing prompt_text", () => {
    const result = updatePromptSchema.safeParse({
      prompt_key: "test",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateFeatureSchema
// ---------------------------------------------------------------------------

describe("updateFeatureSchema", () => {
  it("should accept valid feature toggle input", () => {
    const result = updateFeatureSchema.safeParse({
      id: VALID_UUID,
      enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("should accept enabled as false", () => {
    const result = updateFeatureSchema.safeParse({
      id: VALID_UUID,
      enabled: false,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const result = updateFeatureSchema.safeParse({
      id: INVALID_UUID,
      enabled: true,
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing enabled field", () => {
    const result = updateFeatureSchema.safeParse({
      id: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-boolean enabled value", () => {
    const result = updateFeatureSchema.safeParse({
      id: VALID_UUID,
      enabled: "true",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing id", () => {
    const result = updateFeatureSchema.safeParse({
      enabled: true,
    });
    expect(result.success).toBe(false);
  });
});
