// =============================================================================
// Auto-Tagging API
// POST /api/ai/auto-tag
// Accepts content (title + description) and returns AI-generated tag
// suggestions using the existing AI Router.
// =============================================================================

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { suggestTags } from "@/lib/ai/auto-tagger";
import {
  apiSuccess,
  apiError,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { autoTagSchema } from "@/lib/validators/auto-tag";
import type { Database } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Rate Limiting Interface (prepared for future implementation)
// ---------------------------------------------------------------------------

/**
 * Rate limit configuration for auto-tagging requests.
 * To be connected to a proper rate limiter (e.g. Upstash Redis).
 */
interface RateLimitConfig {
  /** Maximum requests per window. */
  maxRequests: number;
  /** Window duration in seconds. */
  windowSeconds: number;
}

/** Default rate limit: 10 requests per minute per user. */
const _RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60,
};

/**
 * Check rate limit for a user.
 * TODO: Implement with Upstash Redis or similar.
 * Currently always returns allowed.
 */
async function checkRateLimit(
  _userId: string,
  _config: RateLimitConfig,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  // Placeholder: always allow. Connect to Redis/Upstash for production.
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------

interface AutoTagResponse {
  suggestions: Array<{
    tag: string;
    confidence: number;
    category?: string;
  }>;
  meta: {
    provider: string;
    model: string;
    suggestionsCount: number;
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // --- Auth check: user must be logged in ---
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    // --- Rate limiting (prepared) ---
    const rateLimitResult = await checkRateLimit(user.id, _RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      return apiError(
        "RATE_LIMITED",
        `Too many requests. Retry after ${rateLimitResult.retryAfterSeconds ?? 60} seconds.`,
        429,
      );
    }

    // --- Parse and validate request body ---
    const body: unknown = await req.json();
    const parsed = autoTagSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { title, description, existingTags, maxSuggestions } = parsed.data;

    // --- Call auto-tagger service ---
    const result = await suggestTags({
      title,
      description,
      existingTags,
      maxSuggestions,
    });

    const response: AutoTagResponse = {
      suggestions: result.suggestions,
      meta: {
        provider: result.provider,
        model: result.model,
        suggestionsCount: result.suggestions.length,
      },
    };

    return apiSuccess(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";

    // Check if this is a provider availability issue
    if (message.includes("No AI provider available") || message.includes("All AI providers failed")) {
      return apiError(
        "AI_UNAVAILABLE",
        "AI service is temporarily unavailable. Please try again later.",
        503,
      );
    }

    return apiInternalError(message);
  }
}
