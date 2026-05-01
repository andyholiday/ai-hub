// =============================================================================
// Tests: Rate Limiting Utility
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimitHeaders } from "@/lib/api/rate-limit";
import type { RateLimitResult } from "@/lib/api/rate-limit";

// ---------------------------------------------------------------------------
// Note on rateLimit function:
// The main `rateLimit` function depends on @upstash/ratelimit and @upstash/redis
// with env-var checks. Since UPSTASH_REDIS_REST_URL / TOKEN are not set in test,
// the function gracefully returns success (feature-flag behaviour).
// We test the graceful-degradation path and the pure utility functions.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// rateLimitHeaders
// ---------------------------------------------------------------------------

describe("rateLimitHeaders", () => {
  it("should return correct X-RateLimit headers from a result", () => {
    const result: RateLimitResult = {
      success: true,
      limit: 60,
      remaining: 42,
      reset: 1700000000000,
    };

    const headers = rateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe("60");
    expect(headers["X-RateLimit-Remaining"]).toBe("42");
    expect(headers["X-RateLimit-Reset"]).toBe("1700000000000");
  });

  it("should stringify numeric values", () => {
    const result: RateLimitResult = {
      success: false,
      limit: 10,
      remaining: 0,
      reset: 0,
    };

    const headers = rateLimitHeaders(result);

    expect(typeof headers["X-RateLimit-Limit"]).toBe("string");
    expect(typeof headers["X-RateLimit-Remaining"]).toBe("string");
    expect(typeof headers["X-RateLimit-Reset"]).toBe("string");
  });

  it("should contain exactly three header keys", () => {
    const result: RateLimitResult = {
      success: true,
      limit: 30,
      remaining: 29,
      reset: 1700000060000,
    };

    const headers = rateLimitHeaders(result);
    expect(Object.keys(headers)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// rateLimit - Graceful Degradation (no Upstash env vars)
// ---------------------------------------------------------------------------

describe("rateLimit - graceful degradation without Upstash config", () => {
  let originalUrl: string | undefined;
  let originalToken: string | undefined;

  beforeEach(() => {
    // Ensure env vars are NOT set so feature flag returns early
    originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    // Restore env vars
    if (originalUrl !== undefined) {
      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    }
    if (originalToken !== undefined) {
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    }
  });

  it("should return success when Upstash is not configured (feature flag)", async () => {
    // Dynamic import to get fresh module evaluation after env var changes
    // Note: The module-level `isConfigured` is evaluated once at import time.
    // Since our test environment doesn't have Upstash env vars, the imported
    // rateLimit will use the unconfigured (graceful) path.
    const { rateLimit } = await import("@/lib/api/rate-limit");

    const mockRequest = {
      headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
    } as unknown as Parameters<typeof rateLimit>[0];

    const result = await rateLimit(mockRequest, "api");

    expect(result.success).toBe(true);
    expect(result.limit).toBe(60); // "api" tier = 60 requests
    expect(result.remaining).toBe(59);
    expect(typeof result.reset).toBe("number");
  });

  it("should return correct tier limits for different tiers", async () => {
    const { rateLimit } = await import("@/lib/api/rate-limit");

    const mockRequest = {
      headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
    } as unknown as Parameters<typeof rateLimit>[0];

    const aiResult = await rateLimit(mockRequest, "ai");
    expect(aiResult.limit).toBe(10); // "ai" tier = 10 requests

    const authResult = await rateLimit(mockRequest, "auth");
    expect(authResult.limit).toBe(5); // "auth" tier = 5 requests

    const searchResult = await rateLimit(mockRequest, "search");
    expect(searchResult.limit).toBe(30); // "search" tier = 30 requests
  });
});
