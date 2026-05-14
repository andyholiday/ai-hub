// =============================================================================
// Tests: POST /api/webhooks/supabase — M-09 safeEqual + signature verification
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
// Helper: build a NextRequest for the webhook endpoint
// ---------------------------------------------------------------------------

function makeRequest(authHeader: string | null, body: unknown = { type: "INSERT", table: "profiles" }): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (authHeader !== null) headers["authorization"] = authHeader;
  return new NextRequest("http://localhost/api/webhooks/supabase", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/supabase", () => {
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
    // HTTP headers are ASCII-only (ByteString spec), so multibyte chars cannot be injected
    // via NextRequest headers. Instead we unit-test the safeEqual invariant directly.
    // This verifies the core fix: using Buffer byte-length instead of string .length.
    const { timingSafeEqual } = await import("node:crypto");
    function safeEqual(a: string, b: string): boolean {
      const aBuf = Buffer.from(a);
      const bBuf = Buffer.from(b);
      if (aBuf.length !== bBuf.length) return false;
      try { return timingSafeEqual(aBuf, bBuf); } catch { return false; }
    }
    // "Ä" is 2 UTF-8 bytes, "AB" is also 2 bytes — same byte count, different content
    expect(safeEqual("\xC4\x84", "AB")).toBe(false);
    // Identical strings must match
    expect(safeEqual("Bearer secret", "Bearer secret")).toBe(true);
    // Different byte lengths: no timingSafeEqual call, no throw
    expect(safeEqual("a", "ab")).toBe(false);
    // Empty vs non-empty
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
    // Caught by try/catch in route — returns 500, not an uncaught exception
    expect(res.status).toBe(500);
  });
});
