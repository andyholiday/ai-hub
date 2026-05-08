// =============================================================================
// AI Router
// Intelligent routing between AI providers with fallback strategy
// =============================================================================

import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  IAIProvider,
  RouterConfig,
  StreamChunk,
} from "./types";
import { getRouterConfig, getRouterConfigWithDBKeys } from "./config";
import { createAllProviders } from "./providers";
import {
  MistralEuProvider,
  createMistralEuConfig,
} from "./providers/mistral-eu";

// ---------------------------------------------------------------------------
// AI Router Class
// ---------------------------------------------------------------------------

export class AIRouter {
  private providers: Map<AIProvider, IAIProvider> = new Map();
  private config: RouterConfig;
  private initialised = false;

  constructor(config?: Partial<RouterConfig>) {
    this.config = { ...getRouterConfig(), ...config };
  }

  /**
   * Lazily initialise all providers from configuration.
   * Called automatically on first use so that environment variables
   * are read at runtime rather than module-load time.
   */
  private ensureInitialised(): void {
    if (this.initialised) return;
    this.initialised = true;

    const providerInstances = createAllProviders(this.config.providers);
    for (const provider of providerInstances) {
      this.providers.set(provider.provider, provider);
    }
  }

  /**
   * Register an AI provider implementation (manual registration).
   */
  registerProvider(provider: IAIProvider): void {
    this.providers.set(provider.provider, provider);
  }

  /**
   * Route a chat request to the appropriate provider.
   * On failure, walks the fallback chain until a provider succeeds.
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    this.ensureInitialised();

    // ADR-013: Privacy-Mode leitet zwingend auf Mistral EU Experiment-Tier um
    if (request.privacyMode) {
      const euProvider = new MistralEuProvider(createMistralEuConfig());
      return euProvider.chat(request);
    }

    const errors: Array<{ provider: string; error: Error }> = [];

    // Build the ordered list of providers to try
    const chain = this.buildProviderChain(request.provider);

    for (const providerKey of chain) {
      const provider = this.providers.get(providerKey);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        return await provider.chat(request);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err));
        errors.push({ provider: providerKey, error });
        console.warn(
          `[AIRouter] Provider "${providerKey}" failed: ${error.message}. Trying next...`
        );
      }
    }

    // All providers failed
    const details = errors
      .map((e) => `${e.provider}: ${e.error.message}`)
      .join("; ");
    throw new Error(
      `All AI providers failed. ${details || "No providers available. Check API keys and configuration."}`
    );
  }

  /**
   * Route a streaming chat request.
   * On failure, walks the fallback chain until a provider succeeds.
   */
  async *chatStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<StreamChunk> {
    this.ensureInitialised();

    // ADR-013: Privacy-Mode leitet zwingend auf Mistral EU Experiment-Tier um
    if (request.privacyMode) {
      const euProvider = new MistralEuProvider(createMistralEuConfig());
      yield* euProvider.chatStream(request);
      return;
    }

    const errors: Array<{ provider: string; error: Error }> = [];
    const chain = this.buildProviderChain(request.provider);

    for (const providerKey of chain) {
      const provider = this.providers.get(providerKey);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        // Attempt to start the stream. If the first chunk throws,
        // the catch block will handle the fallback.
        yield* provider.chatStream(request);
        return;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err));
        errors.push({ provider: providerKey, error });
        console.warn(
          `[AIRouter] Streaming provider "${providerKey}" failed: ${error.message}. Trying next...`
        );
      }
    }

    const details = errors
      .map((e) => `${e.provider}: ${e.error.message}`)
      .join("; ");
    throw new Error(
      `All AI providers failed for streaming. ${details || "No providers available. Check API keys and configuration."}`
    );
  }

  /**
   * Build an ordered list of providers to attempt.
   * If a preferred provider is specified, it comes first,
   * followed by the rest of the fallback chain (without duplicating).
   */
  private buildProviderChain(preferred?: AIProvider): AIProvider[] {
    const chain: AIProvider[] = [];

    if (preferred) {
      chain.push(preferred);
    }

    for (const providerKey of this.config.fallbackChain) {
      if (!chain.includes(providerKey)) {
        chain.push(providerKey);
      }
    }

    return chain;
  }

  /**
   * Resolve a single available provider (for inspection purposes).
   */
  async resolveProvider(preferred?: AIProvider): Promise<IAIProvider> {
    this.ensureInitialised();

    if (preferred) {
      const provider = this.providers.get(preferred);
      if (provider && (await provider.isAvailable())) {
        return provider;
      }
    }

    for (const providerKey of this.config.fallbackChain) {
      const provider = this.providers.get(providerKey);
      if (provider && (await provider.isAvailable())) {
        return provider;
      }
    }

    throw new Error(
      "No AI provider available. Check API keys and configuration."
    );
  }

  /**
   * Get all registered and available providers.
   */
  async getAvailableProviders(): Promise<AIProvider[]> {
    this.ensureInitialised();

    const available: AIProvider[] = [];
    for (const [key, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(key);
      }
    }
    return available;
  }
}

// ---------------------------------------------------------------------------
// Singleton Instance
// ---------------------------------------------------------------------------

let routerInstance: AIRouter | null = null;

export function getAIRouter(): AIRouter {
  if (!routerInstance) {
    routerInstance = new AIRouter();
  }
  return routerInstance;
}

/**
 * Create an AIRouter instance whose config is enriched with API keys stored
 * in the database.  Unlike the synchronous `getAIRouter()`, this function
 * is async because it fetches keys from Supabase (with 60 s in-memory cache).
 *
 * A new instance is created on every call so that key changes in the DB are
 * picked up after the cache expires.  The DB call itself is cached for 60 s
 * inside `getProviderApiKeysFromDB()`.
 */
export async function getAIRouterWithDBKeys(): Promise<AIRouter> {
  const config = await getRouterConfigWithDBKeys();
  return new AIRouter(config);
}
