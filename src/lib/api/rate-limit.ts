// =============================================================================
// Rate Limiting Utility
// Configurable rate limiter using @upstash/ratelimit and @upstash/redis.
// Provides tiered rate limiting for different API route categories.
// =============================================================================

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Available rate-limiting tiers. */
export type RateLimitTier = "ai" | "search" | "api" | "auth";

/** Result returned by the `rateLimit` function. */
export interface RateLimitResult {
  /** Whether the request is allowed. */
  success: boolean;
  /** Maximum requests allowed in the current window. */
  limit: number;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Unix timestamp (ms) when the current window resets. */
  reset: number;
}

/** Headers to attach to every API response for rate-limit transparency. */
export type RateLimitHeaders = Record<string, string>;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Whether Upstash Redis is configured. Rate limiting is a feature flag:
 * when the env vars are missing, all requests are allowed without error.
 */
const isConfigured =
  typeof process.env.UPSTASH_REDIS_REST_URL === "string" &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === "string" &&
  process.env.UPSTASH_REDIS_REST_TOKEN.length > 0;

/**
 * Lazily initialised Redis client. Only created when the env vars exist.
 */
let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!isConfigured) return null;
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// ---------------------------------------------------------------------------
// Tier definitions
// ---------------------------------------------------------------------------

/**
 * Requests-per-window configuration for each tier.
 * Uses a sliding-window algorithm for smooth rate limiting.
 */
const TIER_CONFIG: Record<RateLimitTier, { requests: number; window: `${number} s` | `${number} m` | `${number} h` }> = {
  ai: { requests: 10, window: "1 m" },   // Strict  -- AI Chat, Completion, Evaluate, Auto-Tag
  search: { requests: 30, window: "1 m" },   // Medium  -- Semantic Search
  api: { requests: 60, window: "1 m" },   // Standard -- All other API routes
  auth: { requests: 5, window: "1 m" },   // Auth    -- Login, Register
};

/**
 * Cache of `Ratelimit` instances keyed by tier. Created once per tier on
 * first use and reused for the lifetime of the process.
 */
const limiters = new Map<RateLimitTier, Ratelimit>();

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  let limiter = limiters.get(tier);
  if (!limiter) {
    const config = TIER_CONFIG[tier];
    limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: `ratelimit:${tier}`,
    });
    limiters.set(tier, limiter);
  }
  return limiter;
}

// ---------------------------------------------------------------------------
// Identifier extraction
// ---------------------------------------------------------------------------

/**
 * Derive a stable identifier for rate limiting.
 * Prefers the authenticated user ID; falls back to the client IP address.
 */
function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`;

  // Next.js sets x-forwarded-for in most deployment environments.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first entry.
    const firstIp = forwarded.split(",")[0]?.trim() ?? "unknown";
    return `ip:${firstIp}`;
  }

  // Fallback: use the NextRequest ip property (available on Vercel/Edge).
  const ip = req.headers.get("x-real-ip") ?? "unknown";
  return `ip:${ip}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check rate limiting for an incoming request.
 *
 * @param req   - The incoming Next.js request.
 * @param tier  - The rate-limiting tier to apply.
 * @param userId - Optional authenticated user ID (preferred identifier).
 * @returns Rate limit result with `success`, `limit`, `remaining`, and `reset`.
 *
 * **Graceful Degradation**: If Upstash Redis is not configured or if the
 * Redis call fails, the function returns a successful result so that the
 * application continues to work without rate limiting.
 */
export async function rateLimit(
  req: NextRequest,
  tier: RateLimitTier,
  userId?: string,
): Promise<RateLimitResult> {
  const config = TIER_CONFIG[tier];

  // --- Feature flag: skip if not configured ---
  const limiter = getLimiter(tier);
  if (!limiter) {
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60_000,
    };
  }

  // --- Execute rate-limit check with graceful degradation ---
  try {
    const identifier = getIdentifier(req, userId);
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Redis is unreachable or returned an unexpected error.
    // Log the failure but do NOT block the request.
    console.error(
      `[rate-limit] Redis error for tier "${tier}" – skipping rate limit:`,
      error instanceof Error ? error.message : error,
    );

    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60_000,
    };
  }
}

// ---------------------------------------------------------------------------
// Header helper
// ---------------------------------------------------------------------------

/**
 * Build rate-limit response headers from a `RateLimitResult`.
 * Attach these to every API response for client transparency.
 */
export function rateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
