// =============================================================================
// Supabase Webhook Route
// POST /api/webhooks/supabase
// Handles database webhooks from Supabase (e.g., user creation, profile updates).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export const dynamic = 'force-dynamic';

/**
 * Constant-time comparison of two strings to prevent timing-oracle attacks.
 * Returns false if either argument is missing or their byte lengths differ
 * (length difference is not secret, only the content is protected).
 */
function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  // Verify webhook token using constant-time comparison to prevent timing attacks.
  // Note: Supabase database webhooks send a static shared secret, not an HMAC.
  // If Supabase adds HMAC support in future, replace this with HMAC-SHA256 verification.
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  const signature = request.headers.get("x-supabase-signature");

  if (!secret || !signature || !constantTimeEqual(signature, secret)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  try {
    const payload = await request.json();

    // TODO: Handle different webhook event types
    // - INSERT on profiles: Send welcome notification
    // - UPDATE on profiles: Sync gamification data
    // - INSERT on best_practices: Trigger auto-tagging
    // - INSERT on xp_log: Check for level-up

    // eslint-disable-next-line no-console
    console.log("[Supabase Webhook] Received:", payload.type, payload.table);

    return NextResponse.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error("[Supabase Webhook] Error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
