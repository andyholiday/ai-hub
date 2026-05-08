// =============================================================================
// Mistral EU Privacy Provider
// ADR-013: Mistral La Plateforme Experiment-Tier — 0€/Monat, FR-basiert, DPA vorhanden
// Aktiv ausschließlich wenn Privacy-Mode-Toggle aktiv ist.
// Nutzt MISTRAL_EU_API_KEY (separater Experiment-Tier-Key, nicht MISTRAL_API_KEY).
// =============================================================================

import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  StreamChunk,
} from "../types";
import { BaseAIProvider } from "./base";
import type { ProviderConfig } from "../types";

// ---------------------------------------------------------------------------
// Mistral API Types (gleiche Wire-Format wie Standard-Mistral)
// ---------------------------------------------------------------------------

interface MistralMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface MistralChoice {
  index: number;
  message: { role: string; content: string | null };
  finish_reason: "stop" | "length" | "content_filter" | null;
}

interface MistralResponse {
  id: string;
  choices: MistralChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MistralStreamChoice {
  index: number;
  delta: { role?: string; content?: string };
  finish_reason: "stop" | "length" | "content_filter" | null;
}

interface MistralStreamChunk {
  id: string;
  choices: MistralStreamChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ---------------------------------------------------------------------------
// Default Konfiguration für den EU-Privacy-Provider
// ---------------------------------------------------------------------------

export const MISTRAL_EU_DEFAULT_MODEL = "mistral-small-latest";
export const MISTRAL_EU_BASE_URL = "https://api.mistral.ai";

/**
 * Erstellt eine ProviderConfig für den Mistral EU Privacy Provider.
 * Liest den API-Key aus MISTRAL_EU_API_KEY (nicht MISTRAL_API_KEY).
 * Wirft einen Fehler wenn der Key fehlt.
 */
export function createMistralEuConfig(): ProviderConfig {
  const apiKey = process.env.MISTRAL_EU_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MISTRAL_EU_API_KEY required for Privacy Mode (ADR-013). " +
        "See docs/ops/mistral-eu-setup.md for setup instructions."
    );
  }

  return {
    provider: "mistral" as AIProvider,
    apiKey,
    baseUrl: MISTRAL_EU_BASE_URL,
    defaultModel: MISTRAL_EU_DEFAULT_MODEL,
    models: [
      {
        id: MISTRAL_EU_DEFAULT_MODEL,
        provider: "mistral" as AIProvider,
        name: MISTRAL_EU_DEFAULT_MODEL,
        displayName: "Mistral Small (EU Privacy)",
        maxTokens: 8192,
        inputCostPer1k: 0, // Experiment-Tier free-tier
        outputCostPer1k: 0, // Experiment-Tier free-tier
        supportsStreaming: true,
        supportsVision: false,
        supportsFunctionCalling: true,
      },
    ],
    enabled: true,
  };
}

// ---------------------------------------------------------------------------
// MistralEuProvider Implementation
// ---------------------------------------------------------------------------

/**
 * Privacy-Mode LLM Provider via Mistral La Plateforme Experiment-Tier.
 * FR-basiert, DPA vorhanden (https://legal.mistral.ai/terms/data-processing-addendum),
 * 2 req/min Rate-Limit (ausreichend für Privacy-Toggle-Single-User-Traffic).
 */
export class MistralEuProvider extends BaseAIProvider {
  readonly provider: AIProvider = "mistral";
  readonly name: string = "Mistral EU (Privacy Mode)";

  protected get baseUrl(): string {
    return this.config.baseUrl ?? MISTRAL_EU_BASE_URL;
  }

  /**
   * Request-Header mit Privacy-Mode-Marker.
   */
  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      "X-Privacy-Mode": "enabled",
    };
  }

  private toMistralMessages(
    messages: ChatMessage[],
    systemPrompt?: string
  ): MistralMessage[] {
    const result: MistralMessage[] = [];

    if (systemPrompt) {
      result.push({ role: "system", content: systemPrompt });
    }

    for (const m of messages) {
      if (m.role === "system" && systemPrompt) continue;
      result.push({ role: m.role, content: m.content });
    }

    return result;
  }

  private buildRequestBody(
    request: ChatCompletionRequest,
    stream: boolean
  ): MistralRequest {
    const model = this.getModel(request.model);
    return {
      model: model.name,
      messages: this.toMistralMessages(request.messages, request.systemPrompt),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? model.maxTokens,
      stream,
    };
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = this.getModel(request.model);
    const startTime = Date.now();
    const body = this.buildRequestBody(request, false);

    const response = await fetch(
      `${this.baseUrl}/v1/chat/completions`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Mistral EU API error (${response.status}): ${errorBody}`
      );
    }

    const data = (await response.json()) as MistralResponse;
    const choice = data.choices[0];

    if (!choice) {
      throw new Error("Mistral EU returned no choices");
    }

    const content = choice.message.content ?? "";
    const latencyMs = Date.now() - startTime;
    const id = this.generateId();

    return {
      id,
      message: {
        id,
        role: "assistant",
        content,
        timestamp: new Date(),
        metadata: {
          provider: this.provider,
          model: model.name,
          tokensUsed: data.usage.total_tokens,
          latencyMs,
          finishReason: choice.finish_reason === "stop" ? "stop" : "length",
        },
      },
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      provider: this.provider,
      model: model.name,
      latencyMs,
    };
  }

  async *chatStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<StreamChunk> {
    const model = this.getModel(request.model);
    const body = this.buildRequestBody(request, true);

    const response = await fetch(
      `${this.baseUrl}/v1/chat/completions`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Mistral EU streaming API error (${response.status}): ${errorBody}`
      );
    }

    if (!response.body) {
      throw new Error("Mistral EU streaming response has no body");
    }

    const id = this.generateId();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") {
            yield { id, content: "", isComplete: true };
            return;
          }

          try {
            const chunk = JSON.parse(jsonStr) as MistralStreamChunk;
            const choice = chunk.choices[0];
            if (!choice) continue;

            const text = choice.delta.content ?? "";
            if (text) {
              yield {
                id,
                content: text,
                isComplete: false,
                metadata: { provider: this.provider, model: model.name },
              };
            }

            if (choice.finish_reason) {
              yield {
                id,
                content: "",
                isComplete: true,
                metadata: {
                  provider: this.provider,
                  model: model.name,
                  tokensUsed: chunk.usage?.total_tokens,
                  finishReason:
                    choice.finish_reason === "stop" ? "stop" : "length",
                },
              };
              return;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      yield { id, content: "", isComplete: true };
    } finally {
      reader.releaseLock();
    }
  }
}
