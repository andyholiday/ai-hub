// =============================================================================
// Supabase Webhook Route
// POST /api/webhooks/supabase
// Handles database webhooks from Supabase (e.g., user creation, profile updates).
// =============================================================================
/* eslint-disable no-console -- intentional structured operational logging for webhook event audit trail; console.warn/error reserved for misconfig and exceptions */

import * as nodeCrypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { suggestTags } from "@/lib/ai/auto-tagger";

export const dynamic = 'force-dynamic';

/**
 * Timing-safe string comparison. Uses Buffer byte length (utf8 encoding) for
 * length-check; timingSafeEqual on equal-length buffers. Falls back to false
 * on any error (e.g. mismatched buffer sizes due to encoding edge-cases).
 */
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  try {
    return nodeCrypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Zod schema for the Supabase webhook body
// ---------------------------------------------------------------------------

const WebhookBodySchema = z.object({
  type: z.string(),
  table: z.string(),
  schema: z.string(),
  record: z.record(z.unknown()).nullable().optional(),
  old_record: z.record(z.unknown()).nullable().optional(),
});

type WebhookBody = z.infer<typeof WebhookBodySchema>;

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleUserCreated(record: Record<string, unknown>): Promise<void> {
  const newUserId = record["id"];
  if (typeof newUserId !== "string") {
    console.error("[Supabase Webhook] user_created: missing record.id");
    return;
  }

  const supabase = createAdminClient();

  // Idempotency: skip if welcome notification already exists
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", newUserId)
    .eq("type", "system")
    .eq("title", "Willkommen im AI Hub!")
    .maybeSingle();

  if (existing) {
    console.log("[Supabase Webhook] user_created: welcome notification already exists, skipping");
    return;
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: newUserId,
    type: "system",
    title: "Willkommen im AI Hub!",
    message: "Schön dass du da bist. Schau in der Community vorbei oder starte direkt mit unserem KI-Chat.",
    link: "/dashboard",
  });

  if (error) {
    console.error("[Supabase Webhook] user_created: failed to insert welcome notification", error.message);
  } else {
    console.log("[Supabase Webhook] user_created: welcome notification sent to", newUserId);
  }
}

async function handlePostCreated(record: Record<string, unknown>): Promise<void> {
  const postId = record["id"];
  const title = record["title"];
  const content = record["content"];

  if (typeof postId !== "string") {
    console.error("[Supabase Webhook] post_created: missing record.id");
    return;
  }

  // Idempotency: skip if tags already set
  const existingTags = record["tags"];
  if (Array.isArray(existingTags) && existingTags.length > 0) {
    console.log("[Supabase Webhook] post_created: tags already set, skipping auto-tag");
    return;
  }

  const supabase = createAdminClient();

  try {
    const result = await suggestTags({
      title: typeof title === "string" ? title : "",
      description: typeof content === "string" ? content : "",
    });

    const tags = result.suggestions.map((s) => s.tag);

    if (tags.length === 0) {
      console.log("[Supabase Webhook] post_created: no tags suggested for post", postId);
      return;
    }

    const { error } = await supabase
      .from("community_posts")
      .update({ tags })
      .eq("id", postId);

    if (error) {
      console.error("[Supabase Webhook] post_created: failed to update tags", error.message);
    } else {
      console.log("[Supabase Webhook] post_created: auto-tagged post", postId, "with", tags);
    }
  } catch (err) {
    // Auto-tag failures (e.g. LLM timeout) must not cause webhook retry storms
    console.error("[Supabase Webhook] post_created: auto-tag error (ignored):", String(err));
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

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

  // Use timing-safe comparison to prevent timing attacks and handle multibyte secrets
  const authorized = signature !== null && safeEqual(signature, expected);

  if (!authorized) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let body: WebhookBody;
  try {
    const raw: unknown = await request.json();
    const parsed = WebhookBodySchema.safeParse(raw);

    if (!parsed.success) {
      // Schema mismatch: log and return 200 to avoid Supabase retry storm
      console.warn("[Supabase Webhook] Unknown payload shape:", parsed.error.message);
      return NextResponse.json({ success: true, received: true });
    }

    body = parsed.data;
  } catch (error) {
    console.error("[Supabase Webhook] Error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }

  const { type, schema, table, record } = body;
  console.log("[Supabase Webhook] Received:", type, `${schema}.${table}`);

  if (type === "INSERT" && schema === "auth" && table === "users") {
    await handleUserCreated(record ?? {});
  } else if (type === "INSERT" && schema === "public" && table === "community_posts") {
    await handlePostCreated(record ?? {});
  } else {
    // Unknown event — log and return 200 to avoid Supabase retry
    console.log("[Supabase Webhook] Unhandled event:", type, `${schema}.${table}`);
  }

  return NextResponse.json({ success: true, received: true });
}
