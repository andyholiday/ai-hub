// =============================================================================
// Unit tests for src/lib/ai/pricing.ts
// =============================================================================

import { describe, it, expect } from "vitest";
import { getPricingRates, calculateCost } from "@/lib/ai/pricing";

// ---------------------------------------------------------------------------
// getPricingRates
// ---------------------------------------------------------------------------

describe("getPricingRates", () => {
  it("returns correct rates for gemini + known model", () => {
    const rates = getPricingRates("gemini", "gemini-2.0-pro");
    expect(rates.inputPer1k).toBe(0.00125);
    expect(rates.outputPer1k).toBe(0.005);
  });

  it("returns correct rates for claude + known model", () => {
    const rates = getPricingRates("claude", "claude-sonnet-4-20250514");
    expect(rates.inputPer1k).toBe(0.003);
    expect(rates.outputPer1k).toBe(0.015);
  });

  it("returns correct rates for openai + known model", () => {
    const rates = getPricingRates("openai", "gpt-4o");
    expect(rates.inputPer1k).toBe(0.005);
    expect(rates.outputPer1k).toBe(0.015);
  });

  it("returns correct rates for openai + gpt-4o-mini", () => {
    const rates = getPricingRates("openai", "gpt-4o-mini");
    expect(rates.inputPer1k).toBe(0.00015);
    expect(rates.outputPer1k).toBe(0.0006);
  });

  it("returns zero rates for copilot (subscription-based)", () => {
    const rates = getPricingRates("copilot", "copilot");
    expect(rates.inputPer1k).toBe(0);
    expect(rates.outputPer1k).toBe(0);
  });

  it("returns correct rates for groq + llama model", () => {
    const rates = getPricingRates("groq", "llama-3.3-70b-versatile");
    expect(rates.inputPer1k).toBe(0.00059);
    expect(rates.outputPer1k).toBe(0.00079);
  });

  it("returns correct rates for groq + mixtral model", () => {
    const rates = getPricingRates("groq", "mixtral-8x7b-32768");
    expect(rates.inputPer1k).toBe(0.00024);
    expect(rates.outputPer1k).toBe(0.00024);
  });

  it("returns correct rates for mistral-large", () => {
    const rates = getPricingRates("mistral", "mistral-large-latest");
    expect(rates.inputPer1k).toBe(0.002);
    expect(rates.outputPer1k).toBe(0.006);
  });

  it("returns correct rates for mistral-small", () => {
    const rates = getPricingRates("mistral", "mistral-small-latest");
    expect(rates.inputPer1k).toBe(0.0002);
    expect(rates.outputPer1k).toBe(0.0006);
  });

  it("falls back to first model of provider when modelName is unknown", () => {
    // claude's first model is claude-sonnet-4-20250514 (input: 0.003)
    const rates = getPricingRates("claude", "claude-nonexistent-model");
    expect(rates.inputPer1k).toBe(0.003);
    expect(rates.outputPer1k).toBe(0.015);
  });

  it("falls back to first model of provider when modelName is empty string", () => {
    const rates = getPricingRates("openai", "");
    expect(rates.inputPer1k).toBe(0.005); // gpt-4o is first openai model
    expect(rates.outputPer1k).toBe(0.015);
  });

  it("returns { 0, 0 } for unknown provider without throwing", () => {
    expect(() => getPricingRates("unknown-provider", "some-model")).not.toThrow();
    const rates = getPricingRates("unknown-provider", "some-model");
    expect(rates.inputPer1k).toBe(0);
    expect(rates.outputPer1k).toBe(0);
  });

  it("also matches by model id (not just name)", () => {
    // claude-haiku-3-5 is the id, claude-3-5-haiku-20241022 is the name
    const ratesById = getPricingRates("claude", "claude-haiku-3-5");
    const ratesByName = getPricingRates("claude", "claude-3-5-haiku-20241022");
    expect(ratesById.inputPer1k).toBe(ratesByName.inputPer1k);
    expect(ratesById.outputPer1k).toBe(ratesByName.outputPer1k);
  });
});

// ---------------------------------------------------------------------------
// calculateCost
// ---------------------------------------------------------------------------

describe("calculateCost", () => {
  it("calculates cost correctly for prompt tokens only", () => {
    // openai gpt-4o: input $0.005/1k — 1000 tokens = $0.005
    const result = calculateCost("openai", "gpt-4o", {
      promptTokens: 1000,
      completionTokens: 0,
    });
    expect(result.estimatedCost).toBe(0.005);
    expect(result.inputRatePer1k).toBe(0.005);
    expect(result.outputRatePer1k).toBe(0.015);
  });

  it("calculates cost correctly for completion tokens only", () => {
    // openai gpt-4o: output $0.015/1k — 1000 tokens = $0.015
    const result = calculateCost("openai", "gpt-4o", {
      promptTokens: 0,
      completionTokens: 1000,
    });
    expect(result.estimatedCost).toBe(0.015);
  });

  it("calculates cost correctly for mixed prompt and completion tokens", () => {
    // claude-sonnet: input $0.003, output $0.015
    // 500 prompt tokens = 0.5 * 0.003 = 0.0015
    // 200 completion tokens = 0.2 * 0.015 = 0.003
    // total = 0.0045
    const result = calculateCost("claude", "claude-sonnet-4-20250514", {
      promptTokens: 500,
      completionTokens: 200,
    });
    expect(result.estimatedCost).toBe(0.0045);
  });

  it("returns estimatedCost 0 when both token counts are 0", () => {
    const result = calculateCost("groq", "llama-3.3-70b-versatile", {
      promptTokens: 0,
      completionTokens: 0,
    });
    expect(result.estimatedCost).toBe(0);
  });

  it("rounds result to 6 decimal places", () => {
    // mistral-small: input $0.0002/1k, output $0.0006/1k
    // 1 prompt token + 1 completion token:
    //   (1/1000)*0.0002 + (1/1000)*0.0006 = 0.0000002 + 0.0000006 = 0.0000008
    // Math.round(0.0000008 * 1_000_000) = Math.round(0.8) = 1
    // 1 / 1_000_000 = 0.000001
    const result = calculateCost("mistral", "mistral-small-latest", {
      promptTokens: 1,
      completionTokens: 1,
    });
    expect(result.estimatedCost).toBe(0.000001);
  });

  it("covers gemini provider (zero cost for free-tier model)", () => {
    const result = calculateCost("gemini", "gemini-2.0-flash", {
      promptTokens: 5000,
      completionTokens: 2000,
    });
    expect(result.estimatedCost).toBe(0);
    expect(result.inputRatePer1k).toBe(0);
  });

  it("covers groq provider with non-zero cost", () => {
    // llama-3.3-70b: input $0.00059, output $0.00079
    // 2000 prompt + 1000 completion
    // = 2 * 0.00059 + 1 * 0.00079 = 0.00118 + 0.00079 = 0.00197
    const result = calculateCost("groq", "llama-3.3-70b-versatile", {
      promptTokens: 2000,
      completionTokens: 1000,
    });
    expect(result.estimatedCost).toBe(0.00197);
  });

  it("covers mistral provider with non-zero cost", () => {
    // mistral-large: input $0.002, output $0.006
    // 1000 + 1000 = 0.002 + 0.006 = 0.008
    const result = calculateCost("mistral", "mistral-large-latest", {
      promptTokens: 1000,
      completionTokens: 1000,
    });
    expect(result.estimatedCost).toBe(0.008);
  });

  it("covers copilot provider (always zero cost)", () => {
    const result = calculateCost("copilot", "copilot", {
      promptTokens: 10000,
      completionTokens: 5000,
    });
    expect(result.estimatedCost).toBe(0);
  });

  it("returns zero cost for unknown provider without throwing", () => {
    expect(() =>
      calculateCost("unknown", "unknown-model", {
        promptTokens: 100,
        completionTokens: 100,
      }),
    ).not.toThrow();
    const result = calculateCost("unknown", "unknown-model", {
      promptTokens: 100,
      completionTokens: 100,
    });
    expect(result.estimatedCost).toBe(0);
  });

  it("includes inputRatePer1k and outputRatePer1k in return value", () => {
    const result = calculateCost("mistral", "mistral-large-latest", {
      promptTokens: 0,
      completionTokens: 0,
    });
    expect(result).toHaveProperty("inputRatePer1k", 0.002);
    expect(result).toHaveProperty("outputRatePer1k", 0.006);
  });
});
