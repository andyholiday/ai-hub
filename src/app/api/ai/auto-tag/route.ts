// =============================================================================
// Auto-Tagging API
// POST /api/ai/auto-tag
// Accepts content (title + description) and returns AI-generated tag
// suggestions using the existing AI Router.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { suggestTags } from "@/lib/ai/auto-tagger";
import {
  apiSuccess,
  apiError,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { autoTagSchema } from "@/lib/validators/auto-tag";
import type { Database } from "@/lib/supabase/types";

export const dynamic = 'force-dynamic';

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

    // --- Rate limiting ---
    const rl = await rateLimit(req, "ai", user.id);
    if (!rl.success) {
      return NextResponse.json(
        { data: null, error: { code: "RATE_LIMITED", message: "Rate limit exceeded. Please try again later." } },
        { status: 429, headers: rateLimitHeaders(rl) },
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
