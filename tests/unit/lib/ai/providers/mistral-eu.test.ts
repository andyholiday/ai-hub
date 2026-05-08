// =============================================================================
// Mistral EU Privacy Provider Unit Tests (ADR-013)
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  MistralEuProvider,
  createMistralEuConfig,
  MISTRAL_EU_DEFAULT_MODEL,
  MISTRAL_EU_BASE_URL,
} from "@/lib/ai/providers/mistral-eu";
import type { ProviderConfig, ChatCompletionRequest } from "@/lib/ai/types";

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    provider: "mistral",
    apiKey: "test-eu-api-key",
    baseUrl: MISTRAL_EU_BASE_URL,
    defaultModel: MISTRAL_EU_DEFAULT_MODEL,
    models: [
      {
        id: MISTRAL_EU_DEFAULT_MODEL,
        provider: "mistral",
        name: MISTRAL_EU_DEFAULT_MODEL,
        displayName: "Mistral Small (EU Privacy)",
        maxTokens: 8192,
        inputCostPer1k: 0,
        outputCostPer1k: 0,
        supportsStreaming: true,
        supportsVision: false,
        supportsFunctionCalling: true,
      },
    ],
    enabled: true,
    ...overrides,
  };
}

function makeRequest(
  overrides: Partial<ChatCompletionRequest> = {}
): ChatCompletionRequest {
  return {
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Hello EU",
        timestamp: new Date("2026-01-01"),
      },
    ],
    ...overrides,
  };
}

function makeMistralApiResponse(content = "Bonjour depuis EU!") {
  return {
    id: "chatcmpl-eu-123",
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

describe("MistralEuProvider", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // -------------------------------------------------------------------------
  // 1. Instanz + Default-Modell
  // -------------------------------------------------------------------------
  it("should create an instance with correct provider name and default model", () => {
    const provider = new MistralEuProvider(makeConfig());

    expect(provider.provider).toBe("mistral");
    expect(provider.name).toBe("Mistral EU (Privacy Mode)");
    expect(provider.getModels()[0]?.id).toBe(MISTRAL_EU_DEFAULT_MODEL);
    expect(MISTRAL_EU_DEFAULT_MODEL).toBe("mistral-small-latest");
  });

  // -------------------------------------------------------------------------
  // 2. Privacy-Mode-Header
  // -------------------------------------------------------------------------
  it("should send X-Privacy-Mode: enabled header on chat()", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(makeMistralApiResponse()), { status: 200 })
    );

    const provider = new MistralEuProvider(makeConfig());
    await provider.chat(makeRequest());

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["X-Privacy-Mode"]).toBe("enabled");
  });

  // -------------------------------------------------------------------------
  // 3. Authorization-Header mit EU-Key
  // -------------------------------------------------------------------------
  it("should use MISTRAL_EU_API_KEY in Authorization header", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(makeMistralApiResponse()), { status: 200 })
    );

    const provider = new MistralEuProvider(makeConfig({ apiKey: "eu-secret-key" }));
    await provider.chat(makeRequest());

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer eu-secret-key");
  });

  // -------------------------------------------------------------------------
  // 4. Fehler bei fehlendem MISTRAL_EU_API_KEY
  // -------------------------------------------------------------------------
  it("should throw when MISTRAL_EU_API_KEY env var is missing", () => {
    vi.stubEnv("MISTRAL_EU_API_KEY", "");

    expect(() => createMistralEuConfig()).toThrow(
      "MISTRAL_EU_API_KEY required for Privacy Mode (ADR-013)"
    );
  });

  it("should throw when MISTRAL_EU_API_KEY env var is undefined", () => {
    // Ensure the env var is not set
    const original = process.env.MISTRAL_EU_API_KEY;
    delete process.env.MISTRAL_EU_API_KEY;

    expect(() => createMistralEuConfig()).toThrow(
      "MISTRAL_EU_API_KEY required for Privacy Mode (ADR-013)"
    );

    // Restore
    if (original !== undefined) {
      process.env.MISTRAL_EU_API_KEY = original;
    }
  });

  it("should return a valid config when MISTRAL_EU_API_KEY is set", () => {
    vi.stubEnv("MISTRAL_EU_API_KEY", "valid-eu-key");

    const config = createMistralEuConfig();

    expect(config.apiKey).toBe("valid-eu-key");
    expect(config.defaultModel).toBe(MISTRAL_EU_DEFAULT_MODEL);
    expect(config.enabled).toBe(true);
    expect(config.provider).toBe("mistral");
  });

  // -------------------------------------------------------------------------
  // 5. chat() — erfolgreiche Antwort
  // -------------------------------------------------------------------------
  it("should return ChatCompletionResponse on successful chat()", async () => {
    const apiResponse = makeMistralApiResponse("Privacy response");
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 })
    );

    const provider = new MistralEuProvider(makeConfig());
    const result = await provider.chat(makeRequest());

    expect(result.message.role).toBe("assistant");
    expect(result.message.content).toBe("Privacy response");
    expect(result.provider).toBe("mistral");
    expect(result.model).toBe(MISTRAL_EU_DEFAULT_MODEL);
    expect(result.usage.totalTokens).toBe(30);
  });

  // -------------------------------------------------------------------------
  // 6. chat() — HTTP-Fehler
  // -------------------------------------------------------------------------
  it("should throw on HTTP error in chat()", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    const provider = new MistralEuProvider(makeConfig());

    await expect(provider.chat(makeRequest())).rejects.toThrow(
      "Mistral EU API error (401)"
    );
  });

  // -------------------------------------------------------------------------
  // 7. chat() — leere Choices
  // -------------------------------------------------------------------------
  it("should throw when API returns empty choices", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: "x", choices: [], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } }),
        { status: 200 }
      )
    );

    const provider = new MistralEuProvider(makeConfig());

    await expect(provider.chat(makeRequest())).rejects.toThrow(
      "Mistral EU returned no choices"
    );
  });

  // -------------------------------------------------------------------------
  // 8. chatStream() — SSE-Parsing mit Privacy-Header
  // -------------------------------------------------------------------------
  it("should yield StreamChunks and send X-Privacy-Mode header in chatStream()", async () => {
    const sseEvents = [
      'data: {"id":"c1","choices":[{"index":0,"delta":{"content":"Bonjour"},"finish_reason":null}]}',
      'data: {"id":"c2","choices":[{"index":0,"delta":{"content":""},"finish_reason":"stop"}]}',
    ];

    fetchSpy.mockResolvedValueOnce(
      new Response(makeSSEStream(sseEvents), { status: 200 })
    );

    const provider = new MistralEuProvider(makeConfig());
    const chunks: Array<{ content: string; isComplete: boolean }> = [];

    for await (const chunk of provider.chatStream(makeRequest())) {
      chunks.push({ content: chunk.content, isComplete: chunk.isComplete });
    }

    expect(chunks[0]?.content).toBe("Bonjour");
    expect(chunks[0]?.isComplete).toBe(false);
    expect(chunks[1]?.isComplete).toBe(true);

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["X-Privacy-Mode"]).toBe("enabled");
  });

  // -------------------------------------------------------------------------
  // 9. chatStream() — fehlendes Body
  // -------------------------------------------------------------------------
  it("should throw when streaming response has no body", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      body: null,
      headers: new Headers(),
      status: 200,
    } as unknown as Response);

    const provider = new MistralEuProvider(makeConfig());

    await expect(async () => {
      for await (const _ of provider.chatStream(makeRequest())) {
        // should not reach here
      }
    }).rejects.toThrow("Mistral EU streaming response has no body");
  });

  // -------------------------------------------------------------------------
  // 10. chatStream() — [DONE] Sentinel
  // -------------------------------------------------------------------------
  it("should handle [DONE] SSE sentinel in chatStream()", async () => {
    const sseEvents = [
      'data: {"id":"c1","choices":[{"index":0,"delta":{"content":"OK"},"finish_reason":null}]}',
      "data: [DONE]",
    ];

    fetchSpy.mockResolvedValueOnce(
      new Response(makeSSEStream(sseEvents), { status: 200 })
    );

    const provider = new MistralEuProvider(makeConfig());
    const chunks: Array<{ content: string; isComplete: boolean }> = [];

    for await (const chunk of provider.chatStream(makeRequest())) {
      chunks.push({ content: chunk.content, isComplete: chunk.isComplete });
    }

    expect(chunks.length).toBe(2);
    expect(chunks[0]?.content).toBe("OK");
    expect(chunks[1]?.isComplete).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 11. isAvailable()
  // -------------------------------------------------------------------------
  it("should return true when enabled with apiKey", async () => {
    const provider = new MistralEuProvider(makeConfig({ enabled: true }));
    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it("should return false when disabled", async () => {
    const provider = new MistralEuProvider(makeConfig({ enabled: false }));
    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  it("should return false when apiKey is empty", async () => {
    const provider = new MistralEuProvider(makeConfig({ apiKey: "" }));
    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  // -------------------------------------------------------------------------
  // 12. Endpoint-URL nutzt Mistral EU Base-URL
  // -------------------------------------------------------------------------
  it("should call the Mistral API endpoint in chat()", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(makeMistralApiResponse()), { status: 200 })
    );

    const provider = new MistralEuProvider(makeConfig());
    await provider.chat(makeRequest());

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
  });

  // -------------------------------------------------------------------------
  // 13. chat() mit systemPrompt — toMistralMessages-Branch
  // -------------------------------------------------------------------------
  it("should prepend system message when systemPrompt is provided", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(makeMistralApiResponse()), { status: 200 })
    );

    const provider = new MistralEuProvider(makeConfig());
    await provider.chat(makeRequest({ systemPrompt: "You are a privacy assistant." }));

    const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as { messages: Array<{ role: string; content: string }> };
    expect(body.messages[0]?.role).toBe("system");
    expect(body.messages[0]?.content).toBe("You are a privacy assistant.");
  });

  // -------------------------------------------------------------------------
  // 14. chatStream() — HTTP-Fehler
  // -------------------------------------------------------------------------
  it("should throw on HTTP error in chatStream()", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Rate Limited", { status: 429 })
    );

    const provider = new MistralEuProvider(makeConfig());

    await expect(async () => {
      for await (const _ of provider.chatStream(makeRequest())) {
        // should not reach here
      }
    }).rejects.toThrow("Mistral EU streaming API error (429)");
  });

  // -------------------------------------------------------------------------
  // 15. chatStream() — Stream endet ohne [DONE] / finish_reason
  // -------------------------------------------------------------------------
  it("should yield a final complete chunk when stream ends without [DONE]", async () => {
    const sseEvents = [
      'data: {"id":"c1","choices":[{"index":0,"delta":{"content":"Final"},"finish_reason":null}]}',
    ];

    fetchSpy.mockResolvedValueOnce(
      new Response(makeSSEStream(sseEvents), { status: 200 })
    );

    const provider = new MistralEuProvider(makeConfig());
    const chunks: Array<{ content: string; isComplete: boolean }> = [];

    for await (const chunk of provider.chatStream(makeRequest())) {
      chunks.push({ content: chunk.content, isComplete: chunk.isComplete });
    }

    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk?.isComplete).toBe(true);
  });
});
