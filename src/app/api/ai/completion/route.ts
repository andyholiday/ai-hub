// =============================================================================
// AI Completion API Route
// POST /api/ai/completion
// Placeholder for one-shot AI text completion requests.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // --- Auth check ---
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    // --- Rate limiting ---
    const rl = await rateLimit(req, "ai", auth.userId);
    if (!rl.success) {
      return NextResponse.json(
        { data: null, error: { code: "RATE_LIMITED", message: "Rate limit exceeded. Please try again later." } },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    return NextResponse.json(
      { error: "Not implemented. This endpoint is reserved for future use." },
      { status: 501 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
