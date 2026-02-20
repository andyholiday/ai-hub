// =============================================================================
// AI Provider Types
// Abstraction layer for multi-provider AI integration
// =============================================================================

// ---------------------------------------------------------------------------
// Provider Enum & Model Definitions
// ---------------------------------------------------------------------------

export type AIProvider = "gemini" | "claude" | "openai" | "copilot";

export interface AIModel {
  id: string;
  provider: AIProvider;
  name: string;
  displayName: string;
  maxTokens: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
}

// ---------------------------------------------------------------------------
// Message Types
// ---------------------------------------------------------------------------

export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
  latencyMs?: number;
  finishReason?: "stop" | "length" | "error";
}

// ---------------------------------------------------------------------------
// Request / Response Types
// ---------------------------------------------------------------------------

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  context?: Record<string, unknown>;
}

export interface ChatCompletionResponse {
  id: string;
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: AIProvider;
  model: string;
  latencyMs: number;
}

export interface StreamChunk {
  id: string;
  content: string;
  isComplete: boolean;
  metadata?: Partial<MessageMetadata>;
}

// ---------------------------------------------------------------------------
// Provider Configuration
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  models: AIModel[];
  enabled: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

// ---------------------------------------------------------------------------
// Router Configuration
// ---------------------------------------------------------------------------

export type RoutingStrategy = "round-robin" | "cost-optimized" | "quality-first" | "fallback";

export interface RouterConfig {
  defaultProvider: AIProvider;
  strategy: RoutingStrategy;
  fallbackChain: AIProvider[];
  providers: Record<AIProvider, ProviderConfig>;
}

// ---------------------------------------------------------------------------
// Provider Interface (Strategy Pattern)
// ---------------------------------------------------------------------------

export interface IAIProvider {
  readonly provider: AIProvider;
  readonly name: string;

  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  chatStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk>;
  isAvailable(): Promise<boolean>;
  getModels(): AIModel[];
}
