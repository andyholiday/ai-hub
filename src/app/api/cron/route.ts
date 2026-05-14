// =============================================================================
// Cron Job API Route
// GET /api/cron
// Scheduled tasks protected by CRON_SECRET via Authorization: Bearer header.
// =============================================================================

import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess } from "@/lib/api/response";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Guard: reject all requests if CRON_SECRET is not configured
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron] CRON_SECRET is not configured - rejecting all requests");
    return new Response("Server misconfiguration", { status: 503 });
  }

  // Verify the cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${cronSecret}`;

  // Use timing-safe comparison to prevent timing attacks
  const authorized =
    authHeader !== null &&
    authHeader.length === expected.length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));

  if (!authorized) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const attemptedSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7, 11)
      : authHeader?.slice(0, 4) ?? "";
    console.error(
      JSON.stringify({
        event: "cron_auth_failed",
        timestamp: new Date().toISOString(),
        ip,
        user_agent: request.headers.get("user-agent") ?? "unknown",
        attempted_secret_prefix: attemptedSecret,
      }),
    );
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createAdminClient();
  const results: Record<string, unknown> = {};

  // Job 1: Daily Chat Retention Cleanup (GDPR, 90-day retention)
  // Defined in migration 00017_chat_messages_retention.sql
  // cleanup_expired_chat_messages is not yet in generated types — cast through unknown
  type RpcClient = { rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }> };
  try {
    const { data, error } = await (supabase as unknown as RpcClient).rpc("cleanup_expired_chat_messages");
    results.chat_retention = error
      ? { ok: false, error: error.message }
      : { ok: true, deleted: data };
  } catch (err) {
    results.chat_retention = { ok: false, error: String(err) };
  }

  // Job 2: Streak Reset — not needed; update_login_streak has a 48h guard built in.
  // Job 3: Daily Cap Reset — not needed; Redis keys have TTL 24h, auto-expire.

  console.log("[cron] completed", JSON.stringify(results));

  return apiSuccess(results);
}
