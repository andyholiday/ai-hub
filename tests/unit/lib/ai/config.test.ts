// =============================================================================
// Tests: AI Config
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AI_MODELS,
  DEFAULT_ROUTING_STRATEGY,
  DEFAULT_FALLBACK_CHAIN,
  getRouterConfig,
} from "@/lib/ai/config";

// ---------------------------------------------------------------------------
// AI_MODELS registry
// ---------------------------------------------------------------------------

describe("AI_MODELS", () => {
  it("should contain entries for all six providers", () => {
    expect(AI_MODELS).toHaveProperty("gemini");
    expect(AI_MODELS).toHaveProperty("claude");
    expect(AI_MODELS).toHaveProperty("openai");
    expect(AI_MODELS).toHaveProperty("copilot");
    expect(AI_MODELS).toHaveProperty("groq");
    expect(AI_MODELS).toHaveProperty("mistral");
  });

  it("should have at least one model per provider", () => {
    for (const provider of ["gemini", "claude", "openai", "copilot", "groq", "mistral"] as const) {
      expect(AI_MODELS[provider].length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should have valid model structure for each model", () => {
    for (const [providerKey, models] of Object.entries(AI_MODELS)) {
      for (const model of models) {
        expect(model.id).toBeDefined();
        expect(model.provider).toBe(providerKey);
        expect(model.name).toBeDefined();
        expect(model.displayName).toBeDefined();
        expect(model.maxTokens).toBeGreaterThan(0);
        expect(model.inputCostPer1k).toBeGreaterThanOrEqual(0);
        expect(model.outputCostPer1k).toBeGreaterThanOrEqual(0);
        expect(typeof model.supportsStreaming).toBe("boolean");
        expect(typeof model.supportsVision).toBe("boolean");
        expect(typeof model.supportsFunctionCalling).toBe("boolean");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Default constants
// ---------------------------------------------------------------------------

describe("DEFAULT_ROUTING_STRATEGY", () => {
  it('should be "fallback"', () => {
    expect(DEFAULT_ROUTING_STRATEGY).toBe("fallback");
  });
});

describe("DEFAULT_FALLBACK_CHAIN", () => {
  it("should contain all seven providers in order", () => {
    expect(DEFAULT_FALLBACK_CHAIN).toEqual([
      "gemini",
      "openai",
      "claude",
      "groq",
      "mistral",
      "copilot",
      "openrouter",
    ]);
  });
});

// ---------------------------------------------------------------------------
// getRouterConfig
// ---------------------------------------------------------------------------

describe("getRouterConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv("AI_DEFAULT_PROVIDER", "");
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("COPILOT_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("MISTRAL_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should default to "gemini" when AI_DEFAULT_PROVIDER is not set', () => {
    const config = getRouterConfig();
    expect(config.defaultProvider).toBe("gemini");
  });

  it("should use AI_DEFAULT_PROVIDER env variable when set", () => {
    vi.stubEnv("AI_DEFAULT_PROVIDER", "claude");
    const config = getRouterConfig();
    expect(config.defaultProvider).toBe("claude");
  });

  it("should set strategy to fallback", () => {
    const config = getRouterConfig();
    expect(config.strategy).toBe("fallback");
  });

  it("should include correct fallback chain", () => {
    const config = getRouterConfig();
    expect(config.fallbackChain).toEqual(DEFAULT_FALLBACK_CHAIN);
  });

  it("should mark providers as disabled when API key is missing", () => {
    const config = getRouterConfig();
    expect(config.providers.gemini.enabled).toBe(false);
    expect(config.providers.claude.enabled).toBe(false);
    expect(config.providers.openai.enabled).toBe(false);
    expect(config.providers.copilot.enabled).toBe(false);
    expect(config.providers.groq.enabled).toBe(false);
    expect(config.providers.mistral.enabled).toBe(false);
  });

  it("should mark provider as enabled when API key is set", () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "test-key-123");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");

    const config = getRouterConfig();
    expect(config.providers.gemini.enabled).toBe(true);
    expect(config.providers.claude.enabled).toBe(true);
    expect(config.providers.openai.enabled).toBe(false);
    expect(config.providers.copilot.enabled).toBe(false);
  });

  it("should set correct default models", () => {
    const config = getRouterConfig();
    expect(config.providers.gemini.defaultModel).toBe("gemini-2.0-flash");
    expect(config.providers.claude.defaultModel).toBe(
      "claude-sonnet-4-20250514"
    );
    expect(config.providers.openai.defaultModel).toBe("gpt-4o-mini");
    expect(config.providers.copilot.defaultModel).toBe("copilot");
    expect(config.providers.groq.defaultModel).toBe("llama-3.3-70b-versatile");
    expect(config.providers.mistral.defaultModel).toBe("mistral-large-latest");
  });

  it("should include model lists for each provider", () => {
    const config = getRouterConfig();
    expect(config.providers.gemini.models).toBe(AI_MODELS.gemini);
    expect(config.providers.claude.models).toBe(AI_MODELS.claude);
    expect(config.providers.openai.models).toBe(AI_MODELS.openai);
    expect(config.providers.copilot.models).toBe(AI_MODELS.copilot);
    expect(config.providers.groq.models).toBe(AI_MODELS.groq);
    expect(config.providers.mistral.models).toBe(AI_MODELS.mistral);
  });
});
