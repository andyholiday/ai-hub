// =============================================================================
// OpenAI Provider
// Implements the IAIProvider interface for OpenAI's Chat Completions API
// =============================================================================

import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  StreamChunk,
} from "../types";
import { BaseAIProvider } from "./base";

// ---------------------------------------------------------------------------
// OpenAI API Types
// ---------------------------------------------------------------------------

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenAIChoice {
  index: number;
  message: { role: string; content: string | null };
  finish_reason: "stop" | "length" | "content_filter" | null;
}

interface OpenAIResponse {
  id: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChoice {
  index: number;
  delta: { role?: string; content?: string };
  finish_reason: "stop" | "length" | "content_filter" | null;
}

interface OpenAIStreamChunk {
  id: string;
  choices: OpenAIStreamChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ---------------------------------------------------------------------------
// OpenAI Provider Implementation
// ---------------------------------------------------------------------------

export class OpenAIProvider extends BaseAIProvider {
  readonly provider: AIProvider = "openai";
  readonly name: string = "OpenAI";

  protected get baseUrl(): string {
    return this.config.baseUrl || "https://api.openai.com";
  }

  /**
   * Build common request headers.
   */
  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  /**
   * Convert internal messages to OpenAI's format.
   * OpenAI natively supports system, user, and assistant roles.
   */
  protected toOpenAIMessages(
    messages: ChatMessage[],
    systemPrompt?: string
  ): OpenAIMessage[] {
    const result: OpenAIMessage[] = [];

    // Prepend system prompt if provided explicitly
    if (systemPrompt) {
      result.push({ role: "system", content: systemPrompt });
    }

    for (const m of messages) {
      // Skip system messages if we already added the explicit system prompt
      if (m.role === "system" && systemPrompt) continue;

      result.push({
        role: m.role,
        content: m.content,
      });
    }

    return result;
  }

  /**
   * Build the OpenAI request body from a ChatCompletionRequest.
   */
  protected buildRequestBody(
    request: ChatCompletionRequest,
    stream: boolean
  ): OpenAIRequest {
    const model = this.getModel(request.model);

    return {
      model: model.name,
      messages: this.toOpenAIMessages(request.messages, request.systemPrompt),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? model.maxTokens,
      stream,
    };
  }

  /**
   * Get the API endpoint URL for chat completions.
   */
  protected getCompletionUrl(): string {
    return `${this.baseUrl}/v1/chat/completions`;
  }

  /**
   * Send a non-streaming chat completion request.
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = this.getModel(request.model);
    const startTime = Date.now();
    const body = this.buildRequestBody(request, false);

    const response = await fetch(this.getCompletionUrl(), {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI API error (${response.status}): ${errorBody}`
      );
    }

    const data = (await response.json()) as OpenAIResponse;
    const choice = data.choices[0];

    if (!choice) {
      throw new Error("OpenAI returned no choices");
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
          finishReason:
            choice.finish_reason === "stop" ? "stop" : "length",
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

  /**
   * Send a streaming chat completion request.
   * OpenAI streams via SSE with delta content in each chunk.
   */
  async *chatStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<StreamChunk> {
    const model = this.getModel(request.model);
    const body = this.buildRequestBody(request, true);

    const response = await fetch(this.getCompletionUrl(), {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI streaming API error (${response.status}): ${errorBody}`
      );
    }

    if (!response.body) {
      throw new Error("OpenAI streaming response has no body");
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
            const chunk = JSON.parse(jsonStr) as OpenAIStreamChunk;
            const choice = chunk.choices[0];

            if (!choice) continue;

            const text = choice.delta.content ?? "";

            if (text) {
              yield {
                id,
                content: text,
                isComplete: false,
                metadata: {
                  provider: this.provider,
                  model: model.name,
                },
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
