// =============================================================================
// Tests: AI Router
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIRouter } from "@/lib/ai/router";
import type {
  AIProvider,
  IAIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  AIModel,
  StreamChunk,
} from "@/lib/ai/types";

// ---------------------------------------------------------------------------
// Mock provider factory
// ---------------------------------------------------------------------------

function createMockProvider(
  provider: AIProvider,
  opts: {
    available?: boolean;
    chatResult?: ChatCompletionResponse;
    chatError?: Error;
    streamChunks?: StreamChunk[];
    streamError?: Error;
  } = {}
): IAIProvider {
  const {
    available = true,
    chatResult,
    chatError,
    streamChunks = [],
    streamError,
  } = opts;

  const defaultChatResult: ChatCompletionResponse = chatResult ?? {
    id: `resp-${provider}`,
    message: {
      id: "msg-1",
      role: "assistant",
      content: `Hello from ${provider}`,
      timestamp: new Date(),
    },
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    provider,
    model: `${provider}-model`,
    latencyMs: 100,
  };

  return {
    provider,
    name: `${provider}-provider`,
    isAvailable: vi.fn().mockResolvedValue(available),
    chat: chatError
      ? vi.fn().mockRejectedValue(chatError)
      : vi.fn().mockResolvedValue(defaultChatResult),
    chatStream: chatError
      ? (vi.fn() as unknown as IAIProvider["chatStream"])
      : (async function* () {
          if (streamError) throw streamError;
          for (const chunk of streamChunks) {
            yield chunk;
          }
        } as unknown as IAIProvider["chatStream"]),
    getModels: vi.fn().mockReturnValue([] as AIModel[]),
  };
}

// ---------------------------------------------------------------------------
// Mock dependencies so AIRouter constructor doesn't auto-init real providers
// ---------------------------------------------------------------------------

vi.mock("@/lib/ai/config", () => ({
  getRouterConfig: () => ({
    defaultProvider: "gemini" as AIProvider,
    strategy: "fallback" as const,
    fallbackChain: ["gemini", "openai", "claude"] as AIProvider[],
    providers: {},
  }),
}));

vi.mock("@/lib/ai/providers", () => ({
  createAllProviders: () => [],
}));

// ---------------------------------------------------------------------------
// Test request fixture
// ---------------------------------------------------------------------------

const testRequest: ChatCompletionRequest = {
  messages: [
    {
      id: "msg-1",
      role: "user",
      content: "Hello",
      timestamp: new Date(),
    },
  ],
};

// ---------------------------------------------------------------------------
// AIRouter.chat
// ---------------------------------------------------------------------------

describe("AIRouter.chat", () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouter({
      fallbackChain: ["gemini", "openai", "claude"],
    });
  });

  it("should route to preferred provider when available", async () => {
    const gemini = createMockProvider("gemini");
    router.registerProvider(gemini);

    const result = await router.chat({ ...testRequest, provider: "gemini" });

    expect(result.provider).toBe("gemini");
    expect(gemini.chat).toHaveBeenCalledTimes(1);
  });

  it("should fall back to next provider when preferred fails", async () => {
    const gemini = createMockProvider("gemini", {
      chatError: new Error("Gemini down"),
    });
    const openai = createMockProvider("openai");

    router.registerProvider(gemini);
    router.registerProvider(openai);

    const result = await router.chat({ ...testRequest, provider: "gemini" });

    expect(result.provider).toBe("openai");
    expect(gemini.chat).toHaveBeenCalledTimes(1);
    expect(openai.chat).toHaveBeenCalledTimes(1);
  });

  it("should skip unavailable providers", async () => {
    const gemini = createMockProvider("gemini", { available: false });
    const openai = createMockProvider("openai");

    router.registerProvider(gemini);
    router.registerProvider(openai);

    const result = await router.chat(testRequest);

    expect(result.provider).toBe("openai");
    expect(gemini.chat).not.toHaveBeenCalled();
  });

  it("should throw when all providers fail", async () => {
    const gemini = createMockProvider("gemini", {
      chatError: new Error("Gemini error"),
    });
    const openai = createMockProvider("openai", {
      chatError: new Error("OpenAI error"),
    });
    const claude = createMockProvider("claude", {
      chatError: new Error("Claude error"),
    });

    router.registerProvider(gemini);
    router.registerProvider(openai);
    router.registerProvider(claude);

    await expect(router.chat(testRequest)).rejects.toThrow(
      "All AI providers failed"
    );
  });

  it("should include error details when all providers fail", async () => {
    const gemini = createMockProvider("gemini", {
      chatError: new Error("Rate limited"),
    });

    router.registerProvider(gemini);

    await expect(router.chat(testRequest)).rejects.toThrow("Rate limited");
  });

  it("should throw when no providers are registered", async () => {
    await expect(router.chat(testRequest)).rejects.toThrow(
      "All AI providers failed"
    );
  });
});

// ---------------------------------------------------------------------------
// AIRouter.resolveProvider
// ---------------------------------------------------------------------------

describe("AIRouter.resolveProvider", () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouter({
      fallbackChain: ["gemini", "openai"],
    });
  });

  it("should return preferred provider when available", async () => {
    const gemini = createMockProvider("gemini");
    router.registerProvider(gemini);

    const resolved = await router.resolveProvider("gemini");
    expect(resolved.provider).toBe("gemini");
  });

  it("should fall back when preferred is unavailable", async () => {
    const gemini = createMockProvider("gemini", { available: false });
    const openai = createMockProvider("openai");

    router.registerProvider(gemini);
    router.registerProvider(openai);

    const resolved = await router.resolveProvider("gemini");
    expect(resolved.provider).toBe("openai");
  });

  it("should throw when no provider is available", async () => {
    const gemini = createMockProvider("gemini", { available: false });
    router.registerProvider(gemini);

    await expect(router.resolveProvider()).rejects.toThrow(
      "No AI provider available"
    );
  });
});

// ---------------------------------------------------------------------------
// AIRouter.getAvailableProviders
// ---------------------------------------------------------------------------

describe("AIRouter.getAvailableProviders", () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouter({
      fallbackChain: [],
    });
  });

  it("should return only available providers", async () => {
    const gemini = createMockProvider("gemini", { available: true });
    const openai = createMockProvider("openai", { available: false });
    const claude = createMockProvider("claude", { available: true });

    router.registerProvider(gemini);
    router.registerProvider(openai);
    router.registerProvider(claude);

    const available = await router.getAvailableProviders();
    expect(available).toEqual(["gemini", "claude"]);
  });

  it("should return empty array when no providers are available", async () => {
    const gemini = createMockProvider("gemini", { available: false });
    router.registerProvider(gemini);

    const available = await router.getAvailableProviders();
    expect(available).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// AIRouter - provider chain deduplication
// ---------------------------------------------------------------------------

describe("AIRouter - provider chain building", () => {
  it("should not duplicate preferred provider in fallback chain", async () => {
    const router = new AIRouter({
      fallbackChain: ["gemini", "openai"],
    });

    const gemini = createMockProvider("gemini");
    const openai = createMockProvider("openai");

    router.registerProvider(gemini);
    router.registerProvider(openai);

    // Preferred = gemini, which is also first in fallback chain
    await router.chat({ ...testRequest, provider: "gemini" });

    // gemini.chat should be called exactly once (not twice)
    expect(gemini.chat).toHaveBeenCalledTimes(1);
  });
});
