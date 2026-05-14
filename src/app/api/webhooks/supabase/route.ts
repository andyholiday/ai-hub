// =============================================================================
// Supabase Webhook Route
// POST /api/webhooks/supabase
// Handles database webhooks from Supabase (e.g., user creation, profile updates).
// =============================================================================

import * as nodeCrypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Guard: reject all requests if SUPABASE_WEBHOOK_SECRET is not configured
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Supabase Webhook] SUPABASE_WEBHOOK_SECRET is not configured - rejecting all requests");
    return new Response("Server misconfiguration", { status: 503 });
  }

  // Verify webhook signature.
  // Supabase Database Webhooks deliver the shared secret in the Authorization
  // header as `Bearer <secret>`, not as a custom `x-supabase-signature` header.
  const signature = request.headers.get("authorization");
  const expected = `Bearer ${webhookSecret}`;

  // Use timing-safe comparison to prevent timing attacks
  const authorized =
    signature !== null &&
    signature.length === expected.length &&
    nodeCrypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!authorized) {
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
