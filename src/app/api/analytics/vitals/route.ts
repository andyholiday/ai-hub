// =============================================================================
// API Route: POST /api/analytics/vitals
// Receives Web Vitals metrics from the client and logs them server-side
// =============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_METRIC_NAMES = new Set([
  "CLS",
  "FCP",
  "FID",
  "INP",
  "LCP",
  "TTFB",
]);

const VALID_RATINGS = new Set(["good", "needs-improvement", "poor", "unknown"]);

interface VitalPayload {
  name: string;
  value: number;
  id: string;
  rating: string;
  delta?: number;
  navigationType?: string;
  timestamp?: number;
}

function isValidPayload(body: unknown): body is VitalPayload {
  if (typeof body !== "object" || body === null) return false;

  const b = body as Record<string, unknown>;

  return (
    typeof b["name"] === "string" &&
    VALID_METRIC_NAMES.has(b["name"]) &&
    typeof b["value"] === "number" &&
    typeof b["id"] === "string" &&
    typeof b["rating"] === "string" &&
    VALID_RATINGS.has(b["rating"])
  );
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: "Invalid metric payload" },
        { status: 400 },
      );
    }

    // eslint-disable-next-line no-console -- intentional server-side metrics logging
    console.info("[Web Vital]", {
      name: body.name,
      value: Math.round(body.value * 100) / 100,
      rating: body.rating,
      id: body.id,
      delta: body.delta != null ? Math.round(body.delta * 100) / 100 : undefined,
      navigationType: body.navigationType,
      timestamp: body.timestamp ?? Date.now(),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process metric" },
      { status: 400 },
    );
  }
}
