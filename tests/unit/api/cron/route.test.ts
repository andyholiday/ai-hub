// =============================================================================
// Tests: GET /api/cron — M-02 Cron-Job Route
// =============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Env setup
// ---------------------------------------------------------------------------

const VALID_CRON_SECRET = "cron-secret-xyz789";

beforeEach(() => {
  vi.resetModules();
  process.env.CRON_SECRET = VALID_CRON_SECRET;
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeRequest(authHeader: string | null): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader !== null) headers["authorization"] = authHeader;
  return new NextRequest("http://localhost/api/cron", {
    method: "GET",
    headers,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/cron", () => {
  it("returns 401 when authorization header is missing", async () => {
    const { GET } = await import("@/app/api/cron/route");
    const res = await GET(makeRequest(null));
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret is wrong", async () => {
    const { GET } = await import("@/app/api/cron/route");
    const res = await GET(makeRequest("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 503 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("@/app/api/cron/route");
    const res = await GET(makeRequest(`Bearer ${VALID_CRON_SECRET}`));
    expect(res.status).toBe(503);
  });

  it("returns 200 with results object on valid secret and successful DB call", async () => {
    mockRpc.mockResolvedValue({ data: 5, error: null });

    const { GET } = await import("@/app/api/cron/route");
    const res = await GET(makeRequest(`Bearer ${VALID_CRON_SECRET}`));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.chat_retention).toEqual({ ok: true, deleted: 5 });
  });

  it("returns 200 with chat_retention.ok=false when DB RPC returns error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "function not found" } });

    const { GET } = await import("@/app/api/cron/route");
    const res = await GET(makeRequest(`Bearer ${VALID_CRON_SECRET}`));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.chat_retention).toEqual({ ok: false, error: "function not found" });
  });

  it("returns 200 with chat_retention.ok=false when DB RPC throws (cron must not crash)", async () => {
    mockRpc.mockRejectedValue(new Error("network timeout"));

    const { GET } = await import("@/app/api/cron/route");
    const res = await GET(makeRequest(`Bearer ${VALID_CRON_SECRET}`));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.chat_retention.ok).toBe(false);
    expect(typeof json.data.chat_retention.error).toBe("string");
  });
});
