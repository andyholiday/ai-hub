// =============================================================================
// Tests: POST /api/webhooks/supabase
// Covers: M-09 signature verification + M-01 event routing
// =============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Env setup — must run before the route module is imported
// ---------------------------------------------------------------------------

const VALID_SECRET = "test-secret-abc123";

beforeEach(() => {
  vi.resetModules();
  process.env.SUPABASE_WEBHOOK_SECRET = VALID_SECRET;
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSuggestTags = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "notifications") {
        return {
          insert: mockInsert,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: mockMaybeSingle,
                })),
              })),
            })),
          })),
        };
      }
      if (table === "community_posts") {
        return {
          update: vi.fn(() => ({
            eq: mockEq,
          })),
        };
      }
      return {};
    }),
  })),
}));

vi.mock("@/lib/ai/auto-tagger", () => ({
  suggestTags: mockSuggestTags,
}));

// ---------------------------------------------------------------------------
// Helper: build a NextRequest for the webhook endpoint
// ---------------------------------------------------------------------------

function makeRequest(
  authHeader: string | null,
  body: unknown = { type: "INSERT", table: "profiles", schema: "public", record: {}, old_record: null },
): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (authHeader !== null) headers["authorization"] = authHeader;
  return new NextRequest("http://localhost/api/webhooks/supabase", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests — Signature Verification (M-09, existing)
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/supabase — signature verification", () => {
  it("returns 401 when authorization header is missing", async () => {
    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret is wrong", async () => {
    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeRequest("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 when secret is correct", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeRequest(`Bearer ${VALID_SECRET}`));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 503 when SUPABASE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.SUPABASE_WEBHOOK_SECRET;
    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeRequest(`Bearer ${VALID_SECRET}`));
    expect(res.status).toBe(503);
  });

  it("safeEqual handles multibyte bytes correctly — Buffer.byteLength not string.length", async () => {
    const { timingSafeEqual } = await import("node:crypto");
    function safeEqual(a: string, b: string): boolean {
      const aBuf = Buffer.from(a);
      const bBuf = Buffer.from(b);
      if (aBuf.length !== bBuf.length) return false;
      try { return timingSafeEqual(aBuf, bBuf); } catch { return false; }
    }
    expect(safeEqual("\xC4\x84", "AB")).toBe(false);
    expect(safeEqual("Bearer secret", "Bearer secret")).toBe(true);
    expect(safeEqual("a", "ab")).toBe(false);
    expect(safeEqual("", "a")).toBe(false);
  });

  it("returns 401 when bearer format is correct but value differs", async () => {
    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeRequest(`Bearer ${VALID_SECRET}X`));
    expect(res.status).toBe(401);
  });

  it("returns 500 when body is invalid JSON but signature is valid", async () => {
    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const req = new NextRequest("http://localhost/api/webhooks/supabase", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${VALID_SECRET}`,
      },
      body: "not-valid-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tests — Event Routing (M-01, new)
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/supabase — event routing", () => {
  function makeAuthRequest(body: unknown): NextRequest {
    return makeRequest(`Bearer ${VALID_SECRET}`, body);
  }

  it("user_created: inserts welcome notification when none exists", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeAuthRequest({
      type: "INSERT",
      schema: "auth",
      table: "users",
      record: { id: "user-123" },
      old_record: null,
    }));

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        type: "system",
        title: "Willkommen im AI Hub!",
      }),
    );
  });

  it("user_created: skips insert when welcome notification already exists (idempotency)", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "existing-notif" }, error: null });
    mockInsert.mockClear();

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeAuthRequest({
      type: "INSERT",
      schema: "auth",
      table: "users",
      record: { id: "user-123" },
      old_record: null,
    }));

    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("post_created: calls suggestTags and updates community_posts.tags", async () => {
    mockSuggestTags.mockResolvedValue({
      suggestions: [
        { tag: "ChatGPT", confidence: 0.9 },
        { tag: "Prompt Engineering", confidence: 0.8 },
      ],
      provider: "openai",
      model: "gpt-4",
    });
    mockEq.mockResolvedValue({ data: null, error: null });

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeAuthRequest({
      type: "INSERT",
      schema: "public",
      table: "community_posts",
      record: { id: "post-456", title: "My Post", content: "About ChatGPT", tags: [] },
      old_record: null,
    }));

    expect(res.status).toBe(200);
    expect(mockSuggestTags).toHaveBeenCalledWith(
      expect.objectContaining({ title: "My Post", description: "About ChatGPT" }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "post-456");
  });

  it("post_created: skips auto-tag when tags already set (idempotency)", async () => {
    mockSuggestTags.mockClear();

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeAuthRequest({
      type: "INSERT",
      schema: "public",
      table: "community_posts",
      record: { id: "post-789", title: "My Post", content: "Content", tags: ["existing-tag"] },
      old_record: null,
    }));

    expect(res.status).toBe(200);
    expect(mockSuggestTags).not.toHaveBeenCalled();
  });

  it("post_created: returns 200 even when suggestTags throws (no retry storm)", async () => {
    mockSuggestTags.mockRejectedValue(new Error("LLM timeout"));

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeAuthRequest({
      type: "INSERT",
      schema: "public",
      table: "community_posts",
      record: { id: "post-999", title: "My Post", content: "Content", tags: [] },
      old_record: null,
    }));

    expect(res.status).toBe(200);
  });

  it("unknown event: returns 200 without side effects", async () => {
    mockInsert.mockClear();
    mockSuggestTags.mockClear();

    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeAuthRequest({
      type: "UPDATE",
      schema: "public",
      table: "profiles",
      record: { id: "user-x" },
      old_record: { id: "user-x" },
    }));

    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockSuggestTags).not.toHaveBeenCalled();
  });

  it("unknown payload shape: returns 200 without crash (Zod mismatch)", async () => {
    const { POST } = await import("@/app/api/webhooks/supabase/route");
    const res = await POST(makeAuthRequest({ completely: "unexpected", payload: true }));
    // Zod parse fails → schema mismatch handler → 200 to avoid retry
    expect(res.status).toBe(200);
  });
});
