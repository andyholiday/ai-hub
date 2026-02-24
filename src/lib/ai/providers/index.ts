// =============================================================================
// AI Provider Factory & Registry
// Creates provider instances and registers them with the router
// =============================================================================

import type { AIProvider, IAIProvider, ProviderConfig } from "../types";
import { GeminiProvider } from "./gemini";
import { ClaudeProvider } from "./claude";
import { OpenAIProvider } from "./openai";
import { CopilotProvider } from "./copilot";
import { GroqProvider } from "./groq";
import { MistralProvider } from "./mistral";

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { BaseAIProvider } from "./base";
export { GeminiProvider } from "./gemini";
export { ClaudeProvider } from "./claude";
export { OpenAIProvider } from "./openai";
export { CopilotProvider } from "./copilot";
export { GroqProvider } from "./groq";
export { MistralProvider } from "./mistral";

// ---------------------------------------------------------------------------
// Provider Factory
// ---------------------------------------------------------------------------

/**
 * Provider constructor registry.
 * Maps provider type identifiers to their concrete class constructors.
 */
const PROVIDER_REGISTRY: Record<
  AIProvider,
  new (config: ProviderConfig) => IAIProvider
> = {
  gemini: GeminiProvider,
  claude: ClaudeProvider,
  openai: OpenAIProvider,
  copilot: CopilotProvider,
  groq: GroqProvider,
  mistral: MistralProvider,
};

/**
 * Create a provider instance for the given provider type and configuration.
 *
 * @param type - The provider identifier (e.g. "gemini", "claude", "openai", "copilot")
 * @param config - Provider-specific configuration including API key and model list
 * @returns A fully initialised IAIProvider ready for use
 * @throws If the provider type is not registered
 */
export function createProvider(
  type: AIProvider,
  config: ProviderConfig
): IAIProvider {
  const ProviderClass = PROVIDER_REGISTRY[type];

  if (!ProviderClass) {
    throw new Error(
      `Unknown AI provider type: "${type}". ` +
        `Available providers: ${Object.keys(PROVIDER_REGISTRY).join(", ")}`
    );
  }

  return new ProviderClass(config);
}

/**
 * Create all enabled provider instances from a provider config map.
 * Providers whose `enabled` flag is false or that have no API key
 * are silently skipped.
 *
 * @param configs - Map of provider type to their configuration
 * @returns Array of initialised IAIProvider instances
 */
export function createAllProviders(
  configs: Partial<Record<AIProvider, ProviderConfig>>
): IAIProvider[] {
  const providers: IAIProvider[] = [];

  for (const [type, config] of Object.entries(configs)) {
    if (!config || !config.enabled) continue;

    try {
      providers.push(createProvider(type as AIProvider, config));
    } catch (error) {
      console.warn(
        `[AI] Failed to create provider "${type}":`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return providers;
}
