// =============================================================================
// Tests: AIRouter — Privacy-Mode-Branch (ADR-013)
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIRouter } from "@/lib/ai/router";
import type {
  IAIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
  AIModel,
} from "@/lib/ai/types";

// ---------------------------------------------------------------------------
// Mock: mistral-eu provider module
// ---------------------------------------------------------------------------

const mockEuChat = vi.fn();
const mockEuChatStream = vi.fn();

// MistralEuProvider muss als Klasse (Konstruktor) gemockt werden.
// vi.fn() als plain function schlägt bei `new MistralEuProvider(...)` fehl —
// daher wird eine echte Klasse mit gemockten Methoden genutzt.
vi.mock("@/lib/ai/providers/mistral-eu", () => {
  class MockMistralEuProvider {
    provider = "mistral";
    name = "Mistral EU (Privacy Mode)";
    chat = mockEuChat;
    chatStream = mockEuChatStream;
    isAvailable = vi.fn().mockResolvedValue(true);
    getModels = vi.fn().mockReturnValue([]);
  }

  return {
    MistralEuProvider: MockMistralEuProvider,
    createMistralEuConfig: vi.fn().mockReturnValue({
      provider: "mistral",
      apiKey: "test-eu-key",
      defaultModel: "mistral-small-latest",
      models: [],
      enabled: true,
    }),
    MISTRAL_EU_DEFAULT_MODEL: "mistral-small-latest",
    MISTRAL_EU_BASE_URL: "https://api.mistral.ai",
  };
});

vi.mock("@/lib/ai/config", () => ({
  getRouterConfig: () => ({
    defaultProvider: "gemini",
    strategy: "fallback",
    fallbackChain: ["gemini", "openai"],
    providers: {},
  }),
}));

vi.mock("@/lib/ai/providers", () => ({
  createAllProviders: () => [],
}));

// ---------------------------------------------------------------------------
// Helper: minimal IAIProvider mock
// ---------------------------------------------------------------------------

function makeMockProvider(
  provider: IAIProvider["provider"],
  chatResult: ChatCompletionResponse
): IAIProvider {
  return {
    provider,
    name: `${provider}-mock`,
    chat: vi.fn().mockResolvedValue(chatResult),
    chatStream: async function* () {} as IAIProvider["chatStream"],
    isAvailable: vi.fn().mockResolvedValue(true),
    getModels: vi.fn().mockReturnValue([] as AIModel[]),
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const privacyRequest: ChatCompletionRequest = {
  messages: [{ id: "m1", role: "user", content: "Hello", timestamp: new Date() }],
  privacyMode: true,
};

const standardRequest: ChatCompletionRequest = {
  messages: [{ id: "m1", role: "user", content: "Hello", timestamp: new Date() }],
  privacyMode: false,
};

const mockEuResponse: ChatCompletionResponse = {
  id: "eu-resp-1",
  message: {
    id: "msg-eu-1",
    role: "assistant",
    content: "EU Privacy response",
    timestamp: new Date(),
  },
  usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
  provider: "mistral",
  model: "mistral-small-latest",
  latencyMs: 200,
};

const mockStandardResponse: ChatCompletionResponse = {
  id: "std-resp-1",
  message: {
    id: "msg-std-1",
    role: "assistant",
    content: "Standard response",
    timestamp: new Date(),
  },
  usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
  provider: "gemini",
  model: "gemini-model",
  latencyMs: 100,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AIRouter — Privacy-Mode-Branch", () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouter({ fallbackChain: ["gemini", "openai"] });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should route to MistralEuProvider when privacyMode is true", async () => {
    mockEuChat.mockResolvedValueOnce(mockEuResponse);

    const result = await router.chat(privacyRequest);

    expect(mockEuChat).toHaveBeenCalledOnce();
    expect(result.provider).toBe("mistral");
    expect(result.model).toBe("mistral-small-latest");
  });

  it("should bypass standard provider pool when privacyMode is true", async () => {
    mockEuChat.mockResolvedValueOnce(mockEuResponse);

    const standardProvider = makeMockProvider("gemini", mockStandardResponse);
    router.registerProvider(standardProvider);

    await router.chat(privacyRequest);

    expect(standardProvider.chat).not.toHaveBeenCalled();
    expect(mockEuChat).toHaveBeenCalledOnce();
  });

  it("should use standard provider pool when privacyMode is false", async () => {
    const standardProvider = makeMockProvider("gemini", mockStandardResponse);
    router.registerProvider(standardProvider);

    const result = await router.chat(standardRequest);

    expect(mockEuChat).not.toHaveBeenCalled();
    expect(standardProvider.chat).toHaveBeenCalledOnce();
    expect(result.provider).toBe("gemini");
  });

  it("should use standard provider pool when privacyMode is undefined", async () => {
    const requestWithoutPrivacy: ChatCompletionRequest = {
      messages: [{ id: "m1", role: "user", content: "Hello", timestamp: new Date() }],
    };

    const standardProvider = makeMockProvider("gemini", mockStandardResponse);
    router.registerProvider(standardProvider);

    await router.chat(requestWithoutPrivacy);

    expect(mockEuChat).not.toHaveBeenCalled();
    expect(standardProvider.chat).toHaveBeenCalledOnce();
  });

  it("should route chatStream to MistralEuProvider when privacyMode is true", async () => {
    const mockChunks: StreamChunk[] = [
      { id: "c1", content: "EU", isComplete: false },
      { id: "c2", content: "", isComplete: true },
    ];

    mockEuChatStream.mockImplementation(async function* () {
      for (const chunk of mockChunks) yield chunk;
    });

    const chunks: StreamChunk[] = [];
    for await (const chunk of router.chatStream(privacyRequest)) {
      chunks.push(chunk);
    }

    expect(mockEuChatStream).toHaveBeenCalledOnce();
    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.content).toBe("EU");
    expect(chunks[1]?.isComplete).toBe(true);
  });

  it("should NOT route chatStream to EU provider when privacyMode is false", async () => {
    const standardProvider = makeMockProvider("gemini", mockStandardResponse);
    router.registerProvider(standardProvider);

    // Register a streaming implementation on the standard provider
    const chunks: StreamChunk[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock override
    (standardProvider as any).chatStream = async function* () {
      yield { id: "s1", content: "Standard stream", isComplete: false };
      yield { id: "s2", content: "", isComplete: true };
    };

    for await (const chunk of router.chatStream(standardRequest)) {
      chunks.push(chunk);
    }

    expect(mockEuChatStream).not.toHaveBeenCalled();
    expect(chunks[0]?.content).toBe("Standard stream");
  });
});
