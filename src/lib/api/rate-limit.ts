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
export type RateLimitTier = "ai" | "search" | "api" | "auth" | "admin";

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
  /**
   * Set to true when Upstash is required (fail-closed mode) but not configured.
   * Callers should return HTTP 503 rather than 429 in this case.
   */
  configError?: true;
}

/** Headers to attach to every API response for rate-limit transparency. */
export type RateLimitHeaders = Record<string, string>;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Whether Upstash Redis is configured. Rate limiting is a feature flag:
 * when the env vars are missing, an in-memory fallback is used instead.
 */
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured =
  typeof upstashUrl === "string" && upstashUrl.length > 0 &&
  typeof upstashToken === "string" && upstashToken.length > 0;

/**
 * Hard-fail only in Vercel production deployments when Upstash is not configured.
 * In-memory rate limiting is per-Lambda-instance and provides no real
 * protection in multi-instance deployments (Vercel, any serverless platform).
 *
 * Detection strategy:
 * - VERCEL_ENV === "production": true only in Vercel production, NOT in preview.
 * - NODE_ENV === "production" alone is intentionally NOT used: Vercel sets it in
 *   both preview and production environments, causing false positives on previews.
 *
 * The check is deferred to the first `rateLimit()` call (runtime). Throwing at
 * module-load time would crash `next build` because NODE_ENV=production is set
 * during the build phase, before any env var resolution against Vercel.
 */
const isProdRuntime =
  process.env.NEXT_PHASE !== "phase-production-build" &&
  process.env.VERCEL_ENV === "production";

let prodGateChecked = false;
function assertProdConfigured(): void {
  if (prodGateChecked) return;
  prodGateChecked = true;
  if (isProdRuntime && !isConfigured) {
    // Warn instead of throw so a missing Upstash config in production degrades
    // gracefully to the in-memory fallback rather than returning 500 to users.
    // Ops alert: check Vercel Dashboard → Integrations → Upstash.
    console.error(
      "[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are " +
        "missing in Vercel production. In-memory fallback is per-Lambda-instance " +
        "and ineffective at scale. Set the vars via Vercel Dashboard → Integrations → Upstash.",
    );
  }
}

/**
 * Controls the behaviour when Upstash is not configured.
 *
 * - "warn"       – use per-process in-memory fallback (logs a warning).
 *                  Safe for local development; unreliable on multi-instance.
 * - "fail-closed" – reject all requests with 503 when Upstash is missing.
 *                  Recommended for production to avoid silently disabled limits.
 *
 * Set via RATE_LIMIT_FALLBACK_BEHAVIOR env var.
 * Defaults to "fail-closed" when NODE_ENV === "production", "warn" otherwise.
 */
const fallbackBehavior: "warn" | "fail-closed" = (() => {
  const env = process.env.RATE_LIMIT_FALLBACK_BEHAVIOR;
  if (env === "warn" || env === "fail-closed") return env;
  return process.env.NODE_ENV === "production" ? "fail-closed" : "warn";
})();

/**
 * Lazily initialised Redis client. Only created when the env vars exist.
 */
let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!isConfigured) return null;
  if (!redis) {
    redis = new Redis({
      url: upstashUrl!,
      token: upstashToken!,
    });
  }
  return redis;
}

// ---------------------------------------------------------------------------
// In-Memory Fallback (used when Upstash is not configured)
// ---------------------------------------------------------------------------

/**
 * WARNING: In-memory rate limiting is per-process. In a multi-instance
 * deployment (e.g. multiple Vercel serverless containers) each instance
 * has its own counter — the aggregate limit across instances is higher
 * than the configured per-tier limit. Use Upstash for shared enforcement.
 */

/** Emitted once per container lifecycle to avoid log spam. */
let fallbackWarningEmitted = false;

interface InMemoryBucket {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, InMemoryBucket>();

/**
 * Parse a tier window string (e.g. "1 m", "60 s", "1 h") into milliseconds.
 */
function windowToMs(window: `${number} s` | `${number} m` | `${number} h`): number {
  const [amount, unit] = window.split(" ") as [string, "s" | "m" | "h"];
  const n = parseInt(amount, 10);
  if (unit === "s") return n * 1_000;
  if (unit === "m") return n * 60_000;
  return n * 3_600_000; // h
}

/**
 * Check and increment an in-memory counter for the given identifier+tier.
 * Expired entries are cleaned up lazily on each call.
 */
function checkInMemory(
  identifier: string,
  tier: RateLimitTier,
): RateLimitResult {
  const config = TIER_CONFIG[tier];
  const windowMs = windowToMs(config.window);
  const key = `${tier}:${identifier}`;
  const now = Date.now();

  // Lazy cleanup: remove expired entries to avoid unbounded growth
  for (const [k, bucket] of inMemoryStore) {
    if (bucket.resetAt <= now) inMemoryStore.delete(k);
  }

  const bucket = inMemoryStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // First request in this window
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset: now + windowMs,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, config.requests - bucket.count);
  return {
    success: bucket.count <= config.requests,
    limit: config.requests,
    remaining,
    reset: bucket.resetAt,
  };
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
  admin: { requests: 20, window: "1 m" }, // Admin   -- Admin panel routes (brute-force protection)
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
 * **Graceful Degradation**: If Upstash Redis is not configured, an in-memory
 * per-process fallback is used (see WARNING on `checkInMemory`). If Redis is
 * configured but unreachable, the in-memory fallback is used for that request.
 */
export async function rateLimit(
  req: NextRequest,
  tier: RateLimitTier,
  userId?: string,
): Promise<RateLimitResult> {
  // Enforce Upstash in production at first runtime call (not at module load).
  assertProdConfigured();

  const identifier = getIdentifier(req, userId);

  // --- Handle missing Upstash according to configured fallback behavior ---
  const limiter = getLimiter(tier);
  if (!limiter) {
    if (fallbackBehavior === "fail-closed") {
      // Hard config error: Upstash is required in this environment.
      // Callers must treat configError=true as a 503, not a 429.
      // Logged once per process to avoid spamming production telemetry.
      if (!fallbackWarningEmitted) {
        fallbackWarningEmitted = true;
        console.error(
          JSON.stringify({
            event: "rate_limit_config_error",
            tier,
            reason:
              "Upstash not configured and RATE_LIMIT_FALLBACK_BEHAVIOR=fail-closed. " +
              "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or set " +
              "RATE_LIMIT_FALLBACK_BEHAVIOR=warn to allow in-memory fallback.",
          }),
        );
      }
      return { success: false, limit: 0, remaining: 0, reset: 0, configError: true };
    }

    // fallbackBehavior === "warn": per-process in-memory (local dev only).
    // One-time warning per process lifecycle to avoid log spam.
    if (!fallbackWarningEmitted) {
      fallbackWarningEmitted = true;
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "rate_limit_fallback_active",
          reason:
            "Upstash not configured — using per-process in-memory limiter (dev/test only). " +
            "Set RATE_LIMIT_FALLBACK_BEHAVIOR=fail-closed to enforce Upstash in production.",
        }),
      );
    }
    return checkInMemory(identifier, tier);
  }

  // --- Execute rate-limit check with graceful degradation ---
  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Redis is unreachable or returned an unexpected error.
    // Fall back to in-memory so requests are still gated.
    console.error(
      `[rate-limit] Redis error for tier "${tier}" – falling back to in-memory:`,
      error instanceof Error ? error.message : error,
    );

    return checkInMemory(identifier, tier);
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
