// =============================================================================
// AI Provider Configuration
// Central configuration for all AI providers
// =============================================================================

import type { AIModel, AIProvider, RouterConfig, RoutingStrategy } from "./types";

// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------

export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  gemini: [
    {
      id: "gemini-2.0-flash",
      provider: "gemini",
      name: "gemini-2.0-flash",
      displayName: "Gemini 2.0 Flash",
      maxTokens: 8192,
      inputCostPer1k: 0.00035,
      outputCostPer1k: 0.0015,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
    },
    {
      id: "gemini-2.0-pro",
      provider: "gemini",
      name: "gemini-2.0-pro",
      displayName: "Gemini 2.0 Pro",
      maxTokens: 8192,
      inputCostPer1k: 0.00125,
      outputCostPer1k: 0.005,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
    },
  ],

  claude: [
    {
      id: "claude-sonnet-4-20250514",
      provider: "claude",
      name: "claude-sonnet-4-20250514",
      displayName: "Claude Sonnet 4",
      maxTokens: 8192,
      inputCostPer1k: 0.003,
      outputCostPer1k: 0.015,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
    },
    {
      id: "claude-haiku-3-5",
      provider: "claude",
      name: "claude-3-5-haiku-20241022",
      displayName: "Claude 3.5 Haiku",
      maxTokens: 8192,
      inputCostPer1k: 0.001,
      outputCostPer1k: 0.005,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
    },
  ],

  openai: [
    {
      id: "gpt-4o",
      provider: "openai",
      name: "gpt-4o",
      displayName: "GPT-4o",
      maxTokens: 4096,
      inputCostPer1k: 0.005,
      outputCostPer1k: 0.015,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
    },
    {
      id: "gpt-4o-mini",
      provider: "openai",
      name: "gpt-4o-mini",
      displayName: "GPT-4o Mini",
      maxTokens: 4096,
      inputCostPer1k: 0.00015,
      outputCostPer1k: 0.0006,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
    },
  ],

  copilot: [
    {
      id: "copilot-default",
      provider: "copilot",
      name: "copilot",
      displayName: "Microsoft Copilot",
      maxTokens: 4096,
      inputCostPer1k: 0,
      outputCostPer1k: 0,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// Default Router Configuration
// ---------------------------------------------------------------------------

export const DEFAULT_ROUTING_STRATEGY: RoutingStrategy = "fallback";

export const DEFAULT_FALLBACK_CHAIN: AIProvider[] = [
  "gemini",
  "openai",
  "claude",
  "copilot",
];

export function getRouterConfig(): RouterConfig {
  return {
    defaultProvider: (process.env.AI_DEFAULT_PROVIDER as AIProvider) || "gemini",
    strategy: DEFAULT_ROUTING_STRATEGY,
    fallbackChain: DEFAULT_FALLBACK_CHAIN,
    providers: {
      gemini: {
        provider: "gemini",
        apiKey: process.env.GOOGLE_AI_API_KEY || "",
        defaultModel: "gemini-2.0-flash",
        models: AI_MODELS.gemini,
        enabled: !!process.env.GOOGLE_AI_API_KEY,
      },
      claude: {
        provider: "claude",
        apiKey: process.env.ANTHROPIC_API_KEY || "",
        defaultModel: "claude-sonnet-4-20250514",
        models: AI_MODELS.claude,
        enabled: !!process.env.ANTHROPIC_API_KEY,
      },
      openai: {
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY || "",
        defaultModel: "gpt-4o-mini",
        models: AI_MODELS.openai,
        enabled: !!process.env.OPENAI_API_KEY,
      },
      copilot: {
        provider: "copilot",
        apiKey: process.env.COPILOT_API_KEY || "",
        defaultModel: "copilot",
        models: AI_MODELS.copilot,
        enabled: !!process.env.COPILOT_API_KEY,
      },
    },
  };
}
