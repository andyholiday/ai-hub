// =============================================================================
// AI Provider Configuration
// Central configuration for all AI providers
// =============================================================================

import type { AIModel, AIProvider, ProviderConfig, RouterConfig, RoutingStrategy } from "./types";
import { getProviderApiKeysFromDB } from "./provider-keys";

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
      inputCostPer1k: 0, // Free-Tier (siehe docs/architecture/pricing-design.md#gemini-pricing)
      outputCostPer1k: 0,
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

  groq: [
    {
      id: "llama-3.3-70b-versatile",
      provider: "groq",
      name: "llama-3.3-70b-versatile",
      displayName: "Llama 3.3 70B Versatile",
      maxTokens: 8192,
      inputCostPer1k: 0.00059,
      outputCostPer1k: 0.00079,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
    },
    {
      id: "mixtral-8x7b-32768",
      provider: "groq",
      name: "mixtral-8x7b-32768",
      displayName: "Mixtral 8x7B",
      maxTokens: 32768,
      inputCostPer1k: 0.00024,
      outputCostPer1k: 0.00024,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
    },
  ],

  mistral: [
    {
      id: "mistral-large-latest",
      provider: "mistral",
      name: "mistral-large-latest",
      displayName: "Mistral Large",
      maxTokens: 8192,
      inputCostPer1k: 0.002,
      outputCostPer1k: 0.006,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
    },
    {
      id: "mistral-small-latest",
      provider: "mistral",
      name: "mistral-small-latest",
      displayName: "Mistral Small",
      maxTokens: 8192,
      inputCostPer1k: 0.0002,
      outputCostPer1k: 0.0006,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
    },
  ],

  openrouter: [
    {
      id: "nvidia/nemotron-nano-9b-v2:free",
      provider: "openrouter",
      name: "nvidia/nemotron-nano-9b-v2:free",
      displayName: "OpenRouter → Nvidia Nemotron Nano 9B (free)",
      maxTokens: 4096,
      inputCostPer1k: 0,
      outputCostPer1k: 0,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: false,
    },
    {
      id: "openai/gpt-4o-mini",
      provider: "openrouter",
      name: "openai/gpt-4o-mini",
      displayName: "OpenRouter → GPT-4o Mini",
      maxTokens: 4096,
      inputCostPer1k: 0.00015,
      outputCostPer1k: 0.0006,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
    },
    {
      id: "anthropic/claude-3.5-sonnet",
      provider: "openrouter",
      name: "anthropic/claude-3.5-sonnet",
      displayName: "OpenRouter → Claude 3.5 Sonnet",
      maxTokens: 8192,
      inputCostPer1k: 0.003,
      outputCostPer1k: 0.015,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
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
  "groq",
  "mistral",
  "copilot",
  "openrouter",
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
      groq: {
        provider: "groq",
        apiKey: process.env.GROQ_API_KEY || "",
        defaultModel: "llama-3.3-70b-versatile",
        models: AI_MODELS.groq,
        enabled: !!process.env.GROQ_API_KEY,
      },
      mistral: {
        provider: "mistral",
        apiKey: process.env.MISTRAL_API_KEY || "",
        defaultModel: "mistral-large-latest",
        models: AI_MODELS.mistral,
        enabled: !!process.env.MISTRAL_API_KEY,
      },
      openrouter: {
        provider: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY || "",
        defaultModel: "nvidia/nemotron-nano-9b-v2:free",
        models: AI_MODELS.openrouter,
        enabled: !!process.env.OPENROUTER_API_KEY,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Async Router Configuration (env var > DB key > empty)
// ---------------------------------------------------------------------------

/**
 * Async version of `getRouterConfig()` that enriches the config with API keys
 * stored in the database (`ai_providers.api_key_encrypted`).
 *
 * Priority per provider:
 *   1. Environment variable (if set and non-empty)
 *   2. DB key from `ai_providers` table
 *   3. Empty string (provider disabled)
 *
 * The synchronous `getRouterConfig()` remains unchanged for callers that
 * cannot use async (e.g. module-level initialisations).
 */
export async function getRouterConfigWithDBKeys(): Promise<RouterConfig> {
  const config = getRouterConfig();
  const dbKeys = await getProviderApiKeysFromDB();

  // Merge DB keys into each provider where the env var is empty
  const providers = { ...config.providers };

  for (const key of Object.keys(providers) as AIProvider[]) {
    const providerConfig = providers[key];
    const envKey = providerConfig.apiKey;

    if (!envKey && dbKeys[key]) {
      const mergedConfig: ProviderConfig = {
        ...providerConfig,
        apiKey: dbKeys[key],
        enabled: true,
      };
      providers[key] = mergedConfig;
    }
  }

  return {
    ...config,
    providers,
  };
}
