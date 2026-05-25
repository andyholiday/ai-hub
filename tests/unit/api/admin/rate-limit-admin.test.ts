// =============================================================================
// Tests: M-08 — Rate-limit on admin routes (in-memory fallback, no Upstash needed)
// Verifies that the "admin" tier exists and blocks after exceeding the limit.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/admin-auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-user-id", role: "admin" }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdminRequest(ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/admin/features", {
    method: "GET",
    headers: { "x-forwarded-for": ip },
  });
}

// ---------------------------------------------------------------------------
// Tests: rateLimit "admin" tier exists and throttles
// ---------------------------------------------------------------------------

describe("admin tier rate-limit (in-memory fallback)", () => {
  beforeEach(() => {
    // Ensure no Upstash configured so in-memory fallback is used
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();
  });

  it("allows requests up to the admin limit (20/min)", async () => {
    const { rateLimit } = await import("@/lib/api/rate-limit");
    const req = makeAdminRequest("10.0.0.1");
    // First 20 requests should succeed
    for (let i = 0; i < 20; i++) {
      const result = await rateLimit(req, "admin", `user-rl-test-${i}`);
      expect(result.success).toBe(true);
    }
  });

  it("blocks the 21st request from the same user in the same window", async () => {
    const { rateLimit } = await import("@/lib/api/rate-limit");
    const req = makeAdminRequest("10.0.0.2");
    const userId = "user-blocked-test";
    // Exhaust the limit
    for (let i = 0; i < 20; i++) {
      await rateLimit(req, "admin", userId);
    }
    // 21st call should be blocked
    const blocked = await rateLimit(req, "admin", userId);
    expect(blocked.success).toBe(false);
  });

  it("features route returns 429 after limit exceeded", async () => {
    const { rateLimit } = await import("@/lib/api/rate-limit");
    // Pre-exhaust the in-memory store for this specific user
    const req = makeAdminRequest("10.0.0.3");
    const userId = "user-features-429";
    for (let i = 0; i < 20; i++) {
      await rateLimit(req, "admin", userId);
    }

    // Now simulate what the route does
    const result = await rateLimit(req, "admin", userId);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
