// =============================================================================
// Groq Provider Unit Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GroqProvider } from "@/lib/ai/providers/groq";
import { AI_MODELS } from "@/lib/ai/config";
import type { ProviderConfig, ChatCompletionRequest } from "@/lib/ai/types";

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const GROQ_MODELS = AI_MODELS.groq;

function makeConfig(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    provider: "groq",
    apiKey: "test-groq-api-key",
    defaultModel: "llama-3.3-70b-versatile",
    models: GROQ_MODELS,
    enabled: true,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<ChatCompletionRequest> = {}): ChatCompletionRequest {
  return {
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Hello",
        timestamp: new Date("2026-01-01"),
      },
    ],
    ...overrides,
  };
}

function makeGroqApiResponse(content = "Hello from Groq!") {
  return {
    id: "chatcmpl-groq-123",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop" as const,
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  };
}

/**
 * Build a ReadableStream that emits SSE lines for streaming tests.
 */
function makeSSEStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event + "\n"));
      }
      controller.close();
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GroqProvider", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Constructor
  // -------------------------------------------------------------------------
  it("should create an instance with correct provider and name", () => {
    const provider = new GroqProvider(makeConfig());

    expect(provider).toBeInstanceOf(GroqProvider);
    expect(provider.provider).toBe("groq");
    expect(provider.name).toBe("Groq");
  });

  // -------------------------------------------------------------------------
  // 2. chat() - successful response
  // -------------------------------------------------------------------------
  it("should return a ChatCompletionResponse on successful chat()", async () => {
    const apiResponse = makeGroqApiResponse("Test answer");

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 })
    );

    const provider = new GroqProvider(makeConfig());
    const result = await provider.chat(makeRequest());

    expect(result.message.role).toBe("assistant");
    expect(result.message.content).toBe("Test answer");
    expect(result.provider).toBe("groq");
    expect(result.model).toBe("llama-3.3-70b-versatile");
    expect(result.usage.promptTokens).toBe(10);
    expect(result.usage.completionTokens).toBe(20);
    expect(result.usage.totalTokens).toBe(30);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    // Verify fetch was called with correct URL and headers
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect((options.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-groq-api-key"
    );
  });

  // -------------------------------------------------------------------------
  // 3. chat() - HTTP error
  // -------------------------------------------------------------------------
  it("should throw on HTTP error in chat()", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 })
    );

    const provider = new GroqProvider(makeConfig());

    await expect(provider.chat(makeRequest())).rejects.toThrow(
      "Groq API error (500)"
    );
  });

  // -------------------------------------------------------------------------
  // 4. chat() - empty choices
  // -------------------------------------------------------------------------
  it("should throw when API returns empty choices in chat()", async () => {
    const apiResponse = {
      id: "chatcmpl-groq-empty",
      choices: [],
      usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
    };

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 })
    );

    const provider = new GroqProvider(makeConfig());

    await expect(provider.chat(makeRequest())).rejects.toThrow(
      "Groq returned no choices"
    );
  });

  // -------------------------------------------------------------------------
  // 5. chatStream() - SSE parsing
  // -------------------------------------------------------------------------
  it("should yield StreamChunks from SSE stream in chatStream()", async () => {
    const sseEvents = [
      'data: {"id":"chunk-1","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}',
      'data: {"id":"chunk-2","choices":[{"index":0,"delta":{"content":" World"},"finish_reason":null}]}',
      'data: {"id":"chunk-3","choices":[{"index":0,"delta":{"content":""},"finish_reason":"stop","usage":{"total_tokens":15}}]}',
    ];

    const stream = makeSSEStream(sseEvents);

    fetchSpy.mockResolvedValueOnce(
      new Response(stream, { status: 200 })
    );

    const provider = new GroqProvider(makeConfig());
    const chunks: Array<{ content: string; isComplete: boolean }> = [];

    for await (const chunk of provider.chatStream(makeRequest())) {
      chunks.push({ content: chunk.content, isComplete: chunk.isComplete });
    }

    // "Hello", " World", then finish_reason="stop" yields isComplete chunk
    expect(chunks.length).toBe(3);
    expect(chunks[0]!.content).toBe("Hello");
    expect(chunks[0]!.isComplete).toBe(false);
    expect(chunks[1]!.content).toBe(" World");
    expect(chunks[1]!.isComplete).toBe(false);
    expect(chunks[2]!.content).toBe("");
    expect(chunks[2]!.isComplete).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 6. chatStream() - missing body
  // -------------------------------------------------------------------------
  it("should throw when streaming response has no body", async () => {
    // Create a Response-like object without a body
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      body: null,
      headers: new Headers(),
      status: 200,
    } as unknown as Response);

    const provider = new GroqProvider(makeConfig());

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of provider.chatStream(makeRequest())) {
        // should not reach here
      }
    }).rejects.toThrow("Groq streaming response has no body");
  });

  // -------------------------------------------------------------------------
  // 7. isAvailable() - enabled / disabled
  // -------------------------------------------------------------------------
  it("should return true when enabled with apiKey", async () => {
    const provider = new GroqProvider(makeConfig({ enabled: true }));
    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it("should return false when disabled", async () => {
    const provider = new GroqProvider(makeConfig({ enabled: false }));
    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  it("should return false when apiKey is empty", async () => {
    const provider = new GroqProvider(makeConfig({ apiKey: "" }));
    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  // -------------------------------------------------------------------------
  // 8. getModels()
  // -------------------------------------------------------------------------
  it("should return the configured models", () => {
    const provider = new GroqProvider(makeConfig());
    const models = provider.getModels();

    expect(models).toEqual(GROQ_MODELS);
    expect(models.length).toBe(2);
    expect(models[0]!.id).toBe("llama-3.3-70b-versatile");
    expect(models[1]!.id).toBe("mixtral-8x7b-32768");
  });

  // -------------------------------------------------------------------------
  // 9. chatStream() - [DONE] sentinel
  // -------------------------------------------------------------------------
  it("should handle [DONE] SSE sentinel correctly in chatStream()", async () => {
    const sseEvents = [
      'data: {"id":"chunk-1","choices":[{"index":0,"delta":{"content":"Hi"},"finish_reason":null}]}',
      "data: [DONE]",
    ];

    const stream = makeSSEStream(sseEvents);

    fetchSpy.mockResolvedValueOnce(
      new Response(stream, { status: 200 })
    );

    const provider = new GroqProvider(makeConfig());
    const chunks: Array<{ content: string; isComplete: boolean }> = [];

    for await (const chunk of provider.chatStream(makeRequest())) {
      chunks.push({ content: chunk.content, isComplete: chunk.isComplete });
    }

    expect(chunks.length).toBe(2);
    expect(chunks[0]!.content).toBe("Hi");
    expect(chunks[0]!.isComplete).toBe(false);
    expect(chunks[1]!.content).toBe("");
    expect(chunks[1]!.isComplete).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 10. chatStream() - HTTP error
  // -------------------------------------------------------------------------
  it("should throw on HTTP error in chatStream()", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Service Unavailable", { status: 503 })
    );

    const provider = new GroqProvider(makeConfig());

    await expect(async () => {
      for await (const _ of provider.chatStream(makeRequest())) {
        // should not reach here
      }
    }).rejects.toThrow("Groq streaming API error (503)");
  });
});
