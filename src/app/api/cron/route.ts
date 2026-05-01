// =============================================================================
// Cron Job API Route
// GET /api/cron
// Placeholder for scheduled tasks (e.g., analytics aggregation, cleanup).
// Protected by a secret token via the Authorization header.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify the cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  // TODO: Implement scheduled tasks
  // - Aggregate daily analytics
  // - Clean up expired sessions
  // - Process pending notifications
  // - Recalculate leaderboard rankings

  return NextResponse.json({
    success: true,
    message: "Cron job executed successfully",
    timestamp: new Date().toISOString(),
  });
}
