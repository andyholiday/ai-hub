// =============================================================================
// Azure OpenAI / Copilot Provider
// Implements the IAIProvider interface for Azure-hosted OpenAI deployments
// =============================================================================

import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
} from "../types";
import { OpenAIProvider } from "./openai";

// ---------------------------------------------------------------------------
// Azure OpenAI Configuration
// ---------------------------------------------------------------------------

/**
 * Extended configuration for the Azure/Copilot provider.
 * These values are read from environment variables at construction time.
 */
interface AzureConfig {
  /** Azure resource name (e.g. "my-openai-resource") */
  resource: string;
  /** Deployment name (e.g. "gpt-4o") */
  deployment: string;
  /** API version string */
  apiVersion: string;
}

// ---------------------------------------------------------------------------
// Copilot Provider Implementation
// ---------------------------------------------------------------------------

/**
 * The CopilotProvider extends OpenAIProvider because Azure OpenAI uses the
 * same request/response format as OpenAI. Only the URL construction and
 * authentication header differ.
 */
export class CopilotProvider extends OpenAIProvider {
  readonly provider: AIProvider = "copilot";
  readonly name = "Microsoft Copilot (Azure OpenAI)";

  private azure: AzureConfig;

  constructor(
    ...args: ConstructorParameters<typeof OpenAIProvider>
  ) {
    super(...args);

    this.azure = {
      resource: process.env.AZURE_OPENAI_RESOURCE || "",
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT || this.config.defaultModel,
      apiVersion:
        process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
    };
  }

  /**
   * Override the base URL to point to the Azure OpenAI endpoint.
   */
  protected override get baseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }
    return `https://${this.azure.resource}.openai.azure.com`;
  }

  /**
   * Azure uses api-key header instead of Bearer token.
   */
  protected override getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "api-key": this.config.apiKey,
    };
  }

  /**
   * Azure OpenAI has a different URL structure:
   * {resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=...
   */
  protected override getCompletionUrl(): string {
    return `${this.baseUrl}/openai/deployments/${this.azure.deployment}/chat/completions?api-version=${this.azure.apiVersion}`;
  }

  /**
   * Check if the Azure-specific configuration is complete.
   */
  override async isAvailable(): Promise<boolean> {
    const baseAvailable = await super.isAvailable();
    return baseAvailable && !!this.azure.resource;
  }

  /**
   * Non-streaming chat -- delegates to OpenAIProvider.chat but overrides
   * the provider field in the response.
   */
  override async chat(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const result = await super.chat(request);
    return {
      ...result,
      provider: this.provider,
      message: {
        ...result.message,
        metadata: result.message.metadata
          ? { ...result.message.metadata, provider: this.provider }
          : undefined,
      },
    };
  }

  /**
   * Streaming chat -- delegates to OpenAIProvider.chatStream but overrides
   * the provider field in yielded chunks.
   */
  override async *chatStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<StreamChunk> {
    for await (const chunk of super.chatStream(request)) {
      yield {
        ...chunk,
        metadata: chunk.metadata
          ? { ...chunk.metadata, provider: this.provider }
          : undefined,
      };
    }
  }
}
