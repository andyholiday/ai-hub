// =============================================================================
// Web Vitals Reporting
// Lightweight performance monitoring for Core Web Vitals metrics
// =============================================================================

/**
 * Shape of a Web Vitals metric as provided by the `web-vitals` library
 * bundled with Next.js.
 */
export interface WebVitalMetric {
  /** Metric name (CLS, FCP, FID, INP, LCP, TTFB) */
  name: string;
  /** Metric value */
  value: number;
  /** Unique identifier for this metric instance */
  id: string;
  /** Rating: "good" | "needs-improvement" | "poor" */
  rating?: string;
  /** Delta since last report */
  delta: number;
  /** Navigation type */
  navigationType?: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const VITALS_ENDPOINT = "/api/analytics/vitals";

const isDevelopment = process.env.NODE_ENV === "development";

// ---------------------------------------------------------------------------
// Consent Check
// ---------------------------------------------------------------------------

/**
 * Returns true only when the user has explicitly granted analytics consent.
 * Applied consistently in both development and production paths (GDPR M02).
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("analytics-consent") === "granted";
}

// ---------------------------------------------------------------------------
// Reporter
// ---------------------------------------------------------------------------

/**
 * Reports a single Web Vital metric.
 *
 * - **Development**: logs to the browser console with colour-coded ratings.
 * - **Production**: sends a POST request to the analytics endpoint.
 *
 * In both modes, consent is required before any data is logged or sent.
 */
export function reportWebVital(metric: WebVitalMetric): void {
  if (!hasAnalyticsConsent()) return;

  if (isDevelopment) {
    logMetricToConsole(metric);
    return;
  }

  sendMetricToEndpoint(metric);
}

// ---------------------------------------------------------------------------
// Development Logger
// ---------------------------------------------------------------------------

const RATING_COLOURS: Record<string, string> = {
  good: "#0CCE6B",
  "needs-improvement": "#FFA400",
  poor: "#FF4E42",
};

function logMetricToConsole(metric: WebVitalMetric): void {
  const colour = RATING_COLOURS[metric.rating ?? ""] ?? "#888888";

  // eslint-disable-next-line no-console -- intentional dev-mode metrics logging
  console.log(
    `%c[Web Vital] ${metric.name}`,
    `color: ${colour}; font-weight: bold;`,
    {
      value: Math.round(metric.value * 100) / 100,
      rating: metric.rating ?? "unknown",
      delta: Math.round(metric.delta * 100) / 100,
      id: metric.id,
    },
  );
}

// ---------------------------------------------------------------------------
// Production Sender
// ---------------------------------------------------------------------------

function sendMetricToEndpoint(metric: WebVitalMetric): void {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating ?? "unknown",
    delta: metric.delta,
    navigationType: metric.navigationType ?? "unknown",
    timestamp: Date.now(),
  });

  // Prefer `navigator.sendBeacon` so the request survives page unloads.
  // Fall back to `fetch` with keepalive.
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(VITALS_ENDPOINT, blob);
    return;
  }

  fetch(VITALS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Silently ignore – monitoring should never break the app.
  });
}
