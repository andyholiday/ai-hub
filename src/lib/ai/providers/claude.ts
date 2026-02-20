// =============================================================================
// Anthropic Claude AI Provider
// Implements the IAIProvider interface for Anthropic's Messages API
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
// Claude API Types
// ---------------------------------------------------------------------------

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: ClaudeMessage[];
  temperature?: number;
  stream?: boolean;
}

interface ClaudeResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: { type: "text"; text: string }[];
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/** SSE event types emitted by the Claude streaming API */
interface ClaudeStreamContentDelta {
  type: "content_block_delta";
  delta: { type: "text_delta"; text: string };
}

interface ClaudeStreamMessageDelta {
  type: "message_delta";
  delta: { stop_reason: string | null };
  usage: { output_tokens: number };
}

interface ClaudeStreamMessageStart {
  type: "message_start";
  message: {
    id: string;
    usage: { input_tokens: number; output_tokens: number };
  };
}

type ClaudeStreamEvent =
  | ClaudeStreamContentDelta
  | ClaudeStreamMessageDelta
  | ClaudeStreamMessageStart
  | { type: string };

// ---------------------------------------------------------------------------
// Claude Provider Implementation
// ---------------------------------------------------------------------------

export class ClaudeProvider extends BaseAIProvider {
  readonly provider: AIProvider = "claude";
  readonly name = "Anthropic Claude";

  private get baseUrl(): string {
    return this.config.baseUrl || "https://api.anthropic.com";
  }

  /**
   * Build common request headers for the Anthropic API.
   */
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.config.apiKey,
      "anthropic-version": "2023-06-01",
    };
  }

  /**
   * Convert internal messages to Claude's format.
   * System messages are extracted and sent via the dedicated system field.
   */
  private toClaudeMessages(messages: ChatMessage[]): ClaudeMessage[] {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: m.content,
      }));
  }

  /**
   * Build the Claude request body from a ChatCompletionRequest.
   */
  private buildRequestBody(
    request: ChatCompletionRequest,
    stream: boolean
  ): ClaudeRequest {
    const model = this.getModel(request.model);

    const systemPrompt =
      request.systemPrompt ||
      request.messages.find((m) => m.role === "system")?.content;

    const body: ClaudeRequest = {
      model: model.name,
      max_tokens: request.maxTokens ?? model.maxTokens,
      messages: this.toClaudeMessages(request.messages),
      temperature: request.temperature ?? 0.7,
      stream,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    return body;
  }

  /**
   * Send a non-streaming chat completion request.
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = this.getModel(request.model);
    const startTime = Date.now();
    const body = this.buildRequestBody(request, false);

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Claude API error (${response.status}): ${errorBody}`
      );
    }

    const data = (await response.json()) as ClaudeResponse;
    const content = data.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

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
          tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
          latencyMs,
          finishReason:
            data.stop_reason === "end_turn" ? "stop" : "length",
        },
      },
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      provider: this.provider,
      model: model.name,
      latencyMs,
    };
  }

  /**
   * Send a streaming chat completion request.
   * Claude streams via SSE with content_block_delta and message_delta events.
   */
  async *chatStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<StreamChunk> {
    const model = this.getModel(request.model);
    const body = this.buildRequestBody(request, true);

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Claude streaming API error (${response.status}): ${errorBody}`
      );
    }

    if (!response.body) {
      throw new Error("Claude streaming response has no body");
    }

    const id = this.generateId();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let totalTokens = 0;

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
            const event = JSON.parse(jsonStr) as ClaudeStreamEvent;

            if (event.type === "message_start") {
              const msgStart = event as ClaudeStreamMessageStart;
              totalTokens = msgStart.message.usage.input_tokens;
            }

            if (event.type === "content_block_delta") {
              const delta = event as ClaudeStreamContentDelta;
              if (delta.delta.type === "text_delta" && delta.delta.text) {
                yield {
                  id,
                  content: delta.delta.text,
                  isComplete: false,
                  metadata: {
                    provider: this.provider,
                    model: model.name,
                  },
                };
              }
            }

            if (event.type === "message_delta") {
              const msgDelta = event as ClaudeStreamMessageDelta;
              totalTokens += msgDelta.usage.output_tokens;

              yield {
                id,
                content: "",
                isComplete: true,
                metadata: {
                  provider: this.provider,
                  model: model.name,
                  tokensUsed: totalTokens,
                  finishReason:
                    msgDelta.delta.stop_reason === "end_turn"
                      ? "stop"
                      : "length",
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
