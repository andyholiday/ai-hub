// =============================================================================
// Supabase Webhook Route
// POST /api/webhooks/supabase
// Handles database webhooks from Supabase (e.g., user creation, profile updates).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Verify webhook signature
  const signature = request.headers.get("x-supabase-signature");

  if (!signature || signature !== process.env.SUPABASE_WEBHOOK_SECRET) {
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
