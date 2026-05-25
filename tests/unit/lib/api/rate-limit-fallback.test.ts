// =============================================================================
// Tests: Rate-Limit — In-Memory Fallback Behaviour
// Prueft: Upstash-Path vs in-memory-Path, per-key counter, Limit-Ueberschreitung
//
// Wichtig: `isConfigured` wird zur Modul-Ladezeit ausgewertet. Wir muessen
// vi.mock fuer @upstash/* nutzen um den Redis-Pfad sauber zu steuern.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @upstash/redis und @upstash/ratelimit damit wir den Redis-Pfad
// kontrollieren koennen ohne echte Netzwerk-Calls.
// ---------------------------------------------------------------------------

const mockLimit = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn().mockReturnValue({});
    limit = mockLimit;
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(ip = "1.2.3.4") {
  return {
    headers: new Headers({ "x-forwarded-for": ip }),
  } as unknown as import("next/server").NextRequest;
}

// ---------------------------------------------------------------------------
// Tests: in-memory fallback (no Upstash env vars)
// ---------------------------------------------------------------------------

describe("rateLimit in-memory fallback — no Upstash configured", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Make sure env vars are absent so module uses in-memory path
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("emits console.warn when falling back to in-memory", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rateLimit } = await import("@/lib/api/rate-limit");

    await rateLimit(makeRequest(), "api");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("rate_limit_fallback_active"),
    );
    warnSpy.mockRestore();
  });

  it("returns success=true for first request within window", async () => {
    const { rateLimit } = await import("@/lib/api/rate-limit");
    const result = await rateLimit(makeRequest("10.0.0.1"), "api");

    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("tracks per-key counters independently", async () => {
    const { rateLimit } = await import("@/lib/api/rate-limit");

    const resultA = await rateLimit(makeRequest("10.0.0.100"), "auth");
    const resultB = await rateLimit(makeRequest("10.0.0.200"), "auth");

    // Two different IPs — each should have full remaining quota
    expect(resultA.remaining).toBe(resultB.remaining);
  });

  it("returns success=false and remaining=0 when limit is exceeded", async () => {
    const { rateLimit } = await import("@/lib/api/rate-limit");
    const req = makeRequest("10.0.0.250");

    // auth tier = 5 requests per minute; send 6 requests
    const results = [];
    for (let i = 0; i < 6; i++) {
      results.push(await rateLimit(req, "auth"));
    }

    // results has exactly 6 entries — non-null assertion is safe here
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const last = results[results.length - 1]!;
    expect(last.success).toBe(false);
    expect(last.remaining).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: Upstash Redis path (mocked)
// ---------------------------------------------------------------------------

describe("rateLimit — Upstash Redis path (mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set env vars so isConfigured = true at module level
    // Note: because isConfigured is module-level, we use vi.resetModules
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
  });

  it("uses Redis limiter when Upstash env vars are set", async () => {
    vi.resetModules();
    const futureReset = Date.now() + 60_000;
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: futureReset });

    const { rateLimit } = await import("@/lib/api/rate-limit");
    const result = await rateLimit(makeRequest("5.5.5.5"), "ai");

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(mockLimit).toHaveBeenCalled();
  });

  it("falls back to in-memory when Redis throws", async () => {
    vi.resetModules();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockLimit.mockRejectedValue(new Error("Redis connection refused"));

    const { rateLimit } = await import("@/lib/api/rate-limit");
    const result = await rateLimit(makeRequest("6.6.6.6"), "search");

    // Should gracefully degrade — still returns a result
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("limit");
    errorSpy.mockRestore();
  });
});
