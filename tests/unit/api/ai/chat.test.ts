// =============================================================================
// Tests: POST /api/ai/chat — Streaming-Pfad, Fallback-Chain, Auth, Rate-Limit
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — declared before subject import
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  rateLimit: vi.fn(),
  rateLimitHeaders: vi.fn(() => ({ "X-RateLimit-Limit": "10" })),
}));

vi.mock("@/lib/ai/router", () => ({
  getAIRouterWithDBKeys: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
  })),
}));

// Silence LLM-gate (disabled via env default)
vi.mock("@/lib/ai/gate/llm-gate", () => ({
  decideGate: vi.fn(),
}));

vi.mock("@/lib/ai/gate/telemetry", () => ({
  logGateDecision: vi.fn(),
}));

vi.mock("@/lib/audit/c2pa-manifest", () => ({
  buildManifest: vi.fn().mockResolvedValue({}),
  persistManifest: vi.fn(),
}));

vi.mock("@/lib/ai/pricing", () => ({
  calculateCost: vi.fn().mockReturnValue({ estimatedCost: 0 }),
}));

vi.mock("@/lib/ai/system-prompt", () => ({
  AI_HUB_SYSTEM_PROMPT: "Test system prompt",
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { requireAuth } from "@/lib/api/require-auth";
import { rateLimit } from "@/lib/api/rate-limit";
import { getAIRouterWithDBKeys } from "@/lib/ai/router";
import { POST } from "@/app/api/ai/chat/route";

const mockRequireAuth = vi.mocked(requireAuth);
const mockRateLimit = vi.mocked(rateLimit);
const mockGetAIRouterWithDBKeys = vi.mocked(getAIRouterWithDBKeys);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockAuthOk(userId = "user-123") {
  mockRequireAuth.mockResolvedValue({
    userId,
    role: "user",
    supabase: {} as never,
  });
}

function mockRateLimitOk() {
  mockRateLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60_000 });
}

const VALID_MESSAGES = [{ role: "user" as const, content: "Hello" }];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/ai/chat — unauthenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({
      response: NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      ),
    });

    const res = await POST(buildRequest({ messages: VALID_MESSAGES }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/ai/chat — rate limited", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockAuthOk();
    mockRateLimit.mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() + 60_000 });

    const res = await POST(buildRequest({ messages: VALID_MESSAGES }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe("RATE_LIMITED");
  });
});

describe("POST /api/ai/chat — non-streaming fallback chain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthOk();
    mockRateLimitOk();
  });

  it("returns AI response when primary provider succeeds", async () => {
    const mockResult = {
      id: "resp-1",
      message: { id: "msg-1", role: "assistant", content: "Hi!", timestamp: new Date() },
      usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
      provider: "gemini",
      model: "gemini-pro",
      latencyMs: 100,
    };

    mockGetAIRouterWithDBKeys.mockResolvedValue({
      chat: vi.fn().mockResolvedValue(mockResult),
      chatStream: vi.fn(),
    } as never);

    const res = await POST(buildRequest({ messages: VALID_MESSAGES, stream: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.provider).toBe("gemini");
  });

  it("returns 5xx when all providers fail", async () => {
    mockGetAIRouterWithDBKeys.mockResolvedValue({
      chat: vi.fn().mockRejectedValue(new Error("All AI providers failed")),
      chatStream: vi.fn(),
    } as never);

    const res = await POST(buildRequest({ messages: VALID_MESSAGES, stream: false }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("AI_PROVIDER_FAILED");
  });

  it("returns 429 with sanitized message when provider returns rate-limit error", async () => {
    mockGetAIRouterWithDBKeys.mockResolvedValue({
      chat: vi.fn().mockRejectedValue(new Error("rate limit exceeded 429")),
      chatStream: vi.fn(),
    } as never);

    const res = await POST(buildRequest({ messages: VALID_MESSAGES, stream: false }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe("AI_PROVIDER_RATE_LIMITED");
    // Sanitized — no raw provider text
    expect(body.error.message).not.toContain("rate limit exceeded");
  });
});

describe("POST /api/ai/chat — streaming response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthOk();
    mockRateLimitOk();
  });

  it("returns streaming Response with SSE content-type", async () => {
    async function* mockStream() {
      yield { id: "c1", content: "Hello", isComplete: false, metadata: { provider: "gemini", model: "gemini-pro" } };
      yield { id: "c2", content: " world", isComplete: true, metadata: { tokensUsed: 5, provider: "gemini", model: "gemini-pro" } };
    }

    mockGetAIRouterWithDBKeys.mockResolvedValue({
      chat: vi.fn(),
      chatStream: vi.fn().mockReturnValue(mockStream()),
    } as never);

    const res = await POST(buildRequest({ messages: VALID_MESSAGES, stream: true }));
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.status).toBe(200);
  });
});
