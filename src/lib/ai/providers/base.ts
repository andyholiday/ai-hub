// =============================================================================
// Base AI Provider
// Abstract base class implementing the Strategy Pattern for AI providers
// =============================================================================

import type {
  AIModel,
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  IAIProvider,
  ProviderConfig,
  StreamChunk,
} from "../types";

export abstract class BaseAIProvider implements IAIProvider {
  abstract readonly provider: AIProvider;
  abstract readonly name: string;

  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  abstract chatStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk>;

  async isAvailable(): Promise<boolean> {
    return this.config.enabled && !!this.config.apiKey;
  }

  getModels(): AIModel[] {
    return this.config.models;
  }

  protected getModel(modelId?: string): AIModel {
    const id = modelId || this.config.defaultModel;
    const model = this.config.models.find((m) => m.id === id || m.name === id);
    if (!model) {
      throw new Error(`Model ${id} not found for provider ${this.provider}`);
    }
    return model;
  }

  protected generateId(): string {
    return `${this.provider}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
