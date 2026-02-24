// =============================================================================
// Mistral Provider Unit Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MistralProvider } from "@/lib/ai/providers/mistral";
import { AI_MODELS } from "@/lib/ai/config";
import type { ProviderConfig, ChatCompletionRequest } from "@/lib/ai/types";

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MISTRAL_MODELS = AI_MODELS.mistral;

function makeConfig(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    provider: "mistral",
    apiKey: "test-mistral-api-key",
    defaultModel: "mistral-large-latest",
    models: MISTRAL_MODELS,
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

function makeMistralApiResponse(content = "Hello from Mistral!") {
  return {
    id: "chatcmpl-mistral-123",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop" as const,
      },
    ],
    usage: {
      prompt_tokens: 12,
      completion_tokens: 25,
      total_tokens: 37,
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

describe("MistralProvider", () => {
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
    const provider = new MistralProvider(makeConfig());

    expect(provider).toBeInstanceOf(MistralProvider);
    expect(provider.provider).toBe("mistral");
    expect(provider.name).toBe("Mistral AI");
  });

  // -------------------------------------------------------------------------
  // 2. chat() - successful response
  // -------------------------------------------------------------------------
  it("should return a ChatCompletionResponse on successful chat()", async () => {
    const apiResponse = makeMistralApiResponse("Test answer from Mistral");

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 })
    );

    const provider = new MistralProvider(makeConfig());
    const result = await provider.chat(makeRequest());

    expect(result.message.role).toBe("assistant");
    expect(result.message.content).toBe("Test answer from Mistral");
    expect(result.provider).toBe("mistral");
    expect(result.model).toBe("mistral-large-latest");
    expect(result.usage.promptTokens).toBe(12);
    expect(result.usage.completionTokens).toBe(25);
    expect(result.usage.totalTokens).toBe(37);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    // Verify fetch was called with correct URL and headers
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect((options.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-mistral-api-key"
    );
  });

  // -------------------------------------------------------------------------
  // 3. chat() - HTTP error
  // -------------------------------------------------------------------------
  it("should throw on HTTP error in chat()", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    const provider = new MistralProvider(makeConfig());

    await expect(provider.chat(makeRequest())).rejects.toThrow(
      "Mistral API error (401)"
    );
  });

  // -------------------------------------------------------------------------
  // 4. chat() - empty choices
  // -------------------------------------------------------------------------
  it("should throw when API returns empty choices in chat()", async () => {
    const apiResponse = {
      id: "chatcmpl-mistral-empty",
      choices: [],
      usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
    };

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 })
    );

    const provider = new MistralProvider(makeConfig());

    await expect(provider.chat(makeRequest())).rejects.toThrow(
      "Mistral returned no choices"
    );
  });

  // -------------------------------------------------------------------------
  // 5. chatStream() - SSE parsing
  // -------------------------------------------------------------------------
  it("should yield StreamChunks from SSE stream in chatStream()", async () => {
    const sseEvents = [
      'data: {"id":"chunk-1","choices":[{"index":0,"delta":{"content":"Bonjour"},"finish_reason":null}]}',
      'data: {"id":"chunk-2","choices":[{"index":0,"delta":{"content":" le monde"},"finish_reason":null}]}',
      'data: {"id":"chunk-3","choices":[{"index":0,"delta":{"content":""},"finish_reason":"stop","usage":{"total_tokens":20}}]}',
    ];

    const stream = makeSSEStream(sseEvents);

    fetchSpy.mockResolvedValueOnce(
      new Response(stream, { status: 200 })
    );

    const provider = new MistralProvider(makeConfig());
    const chunks: Array<{ content: string; isComplete: boolean }> = [];

    for await (const chunk of provider.chatStream(makeRequest())) {
      chunks.push({ content: chunk.content, isComplete: chunk.isComplete });
    }

    expect(chunks.length).toBe(3);
    expect(chunks[0]!.content).toBe("Bonjour");
    expect(chunks[0]!.isComplete).toBe(false);
    expect(chunks[1]!.content).toBe(" le monde");
    expect(chunks[1]!.isComplete).toBe(false);
    expect(chunks[2]!.content).toBe("");
    expect(chunks[2]!.isComplete).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 6. chatStream() - missing body
  // -------------------------------------------------------------------------
  it("should throw when streaming response has no body", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      body: null,
      headers: new Headers(),
      status: 200,
    } as unknown as Response);

    const provider = new MistralProvider(makeConfig());

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of provider.chatStream(makeRequest())) {
        // should not reach here
      }
    }).rejects.toThrow("Mistral streaming response has no body");
  });

  // -------------------------------------------------------------------------
  // 7. isAvailable() - enabled / disabled
  // -------------------------------------------------------------------------
  it("should return true when enabled with apiKey", async () => {
    const provider = new MistralProvider(makeConfig({ enabled: true }));
    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it("should return false when disabled", async () => {
    const provider = new MistralProvider(makeConfig({ enabled: false }));
    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  it("should return false when apiKey is empty", async () => {
    const provider = new MistralProvider(makeConfig({ apiKey: "" }));
    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  // -------------------------------------------------------------------------
  // 8. getModels()
  // -------------------------------------------------------------------------
  it("should return the configured models", () => {
    const provider = new MistralProvider(makeConfig());
    const models = provider.getModels();

    expect(models).toEqual(MISTRAL_MODELS);
    expect(models.length).toBe(2);
    expect(models[0]!.id).toBe("mistral-large-latest");
    expect(models[1]!.id).toBe("mistral-small-latest");
  });

  // -------------------------------------------------------------------------
  // 9. chatStream() - [DONE] sentinel
  // -------------------------------------------------------------------------
  it("should handle [DONE] SSE sentinel correctly in chatStream()", async () => {
    const sseEvents = [
      'data: {"id":"chunk-1","choices":[{"index":0,"delta":{"content":"Salut"},"finish_reason":null}]}',
      "data: [DONE]",
    ];

    const stream = makeSSEStream(sseEvents);

    fetchSpy.mockResolvedValueOnce(
      new Response(stream, { status: 200 })
    );

    const provider = new MistralProvider(makeConfig());
    const chunks: Array<{ content: string; isComplete: boolean }> = [];

    for await (const chunk of provider.chatStream(makeRequest())) {
      chunks.push({ content: chunk.content, isComplete: chunk.isComplete });
    }

    expect(chunks.length).toBe(2);
    expect(chunks[0]!.content).toBe("Salut");
    expect(chunks[0]!.isComplete).toBe(false);
    expect(chunks[1]!.content).toBe("");
    expect(chunks[1]!.isComplete).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 10. chatStream() - HTTP error
  // -------------------------------------------------------------------------
  it("should throw on HTTP error in chatStream()", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Rate Limited", { status: 429 })
    );

    const provider = new MistralProvider(makeConfig());

    await expect(async () => {
      for await (const _ of provider.chatStream(makeRequest())) {
        // should not reach here
      }
    }).rejects.toThrow("Mistral streaming API error (429)");
  });
});
