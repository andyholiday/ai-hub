// =============================================================================
// Google Gemini AI Provider
// Implements the IAIProvider interface for Google's Generative AI API
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
// Gemini API Types
// ---------------------------------------------------------------------------

interface GeminiContent {
  parts: { text: string }[];
  role: "user" | "model";
}

interface GeminiGenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
  systemInstruction?: { parts: { text: string }[] };
}

interface GeminiCandidate {
  content: {
    parts: { text: string }[];
    role: string;
  };
  finishReason: string;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ---------------------------------------------------------------------------
// Gemini Provider Implementation
// ---------------------------------------------------------------------------

export class GeminiProvider extends BaseAIProvider {
  readonly provider: AIProvider = "gemini";
  readonly name = "Google Gemini";

  private get baseUrl(): string {
    return (
      this.config.baseUrl ||
      "https://generativelanguage.googleapis.com/v1beta"
    );
  }

  /**
   * Convert internal message format to Gemini content format.
   * Gemini uses "user" and "model" roles; system messages go into
   * the dedicated systemInstruction field instead.
   */
  private toGeminiContents(messages: ChatMessage[]): GeminiContent[] {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        parts: [{ text: m.content }],
        role: (m.role === "assistant" ? "model" : "user") as
          | "user"
          | "model",
      }));
  }

  /**
   * Build the Gemini request body from a ChatCompletionRequest.
   */
  private buildRequestBody(request: ChatCompletionRequest): GeminiRequest {
    const model = this.getModel(request.model);
    const body: GeminiRequest = {
      contents: this.toGeminiContents(request.messages),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? model.maxTokens,
      },
    };

    // Resolve system prompt: explicit field takes priority, then first system message
    const systemPrompt =
      request.systemPrompt ||
      request.messages.find((m) => m.role === "system")?.content;

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    return body;
  }

  /**
   * Send a non-streaming chat completion request.
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = this.getModel(request.model);
    const startTime = Date.now();
    const body = this.buildRequestBody(request);

    const url = `${this.baseUrl}/models/${model.name}:generateContent?key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: request.signal
        ? AbortSignal.any([request.signal, AbortSignal.timeout(60_000)])
        : AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${errorBody}`
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const candidate = data.candidates?.[0];

    if (!candidate) {
      throw new Error("Gemini returned no candidates");
    }

    const content = candidate.content.parts.map((p) => p.text).join("");
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
          tokensUsed: data.usageMetadata?.totalTokenCount,
          latencyMs,
          finishReason:
            candidate.finishReason === "STOP" ? "stop" : "length",
        },
      },
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      provider: this.provider,
      model: model.name,
      latencyMs,
    };
  }

  /**
   * Send a streaming chat completion request.
   * Gemini streams via SSE on the streamGenerateContent endpoint.
   */
  async *chatStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<StreamChunk> {
    const model = this.getModel(request.model);
    const body = this.buildRequestBody(request);

    const url = `${this.baseUrl}/models/${model.name}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: request.signal
        ? AbortSignal.any([request.signal, AbortSignal.timeout(120_000)])
        : AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini streaming API error (${response.status}): ${errorBody}`
      );
    }

    if (!response.body) {
      throw new Error("Gemini streaming response has no body");
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
        // Keep the last (potentially incomplete) line in the buffer
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
            const chunk = JSON.parse(jsonStr) as GeminiResponse;
            const candidate = chunk.candidates?.[0];
            const text =
              candidate?.content?.parts?.map((p) => p.text).join("") ?? "";

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

            // Emit completion signal when Gemini indicates a finish reason
            if (
              candidate?.finishReason &&
              candidate.finishReason !== "FINISH_REASON_UNSPECIFIED"
            ) {
              yield {
                id,
                content: "",
                isComplete: true,
                metadata: {
                  provider: this.provider,
                  model: model.name,
                  tokensUsed: chunk.usageMetadata?.totalTokenCount,
                  finishReason:
                    candidate.finishReason === "STOP" ? "stop" : "length",
                },
              };
              return;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Safety net: if the read loop ends without a finish signal, emit one
      yield { id, content: "", isComplete: true };
    } finally {
      reader.releaseLock();
    }
  }
}
