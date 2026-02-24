"use client";

// =============================================================================
// Web Vitals Reporter Component
// Hooks into Next.js Web Vitals and forwards metrics to the reporting layer
// =============================================================================

import { useReportWebVitals } from "next/web-vitals";
import { reportWebVital } from "@/lib/analytics/web-vitals";
import type { WebVitalMetric } from "@/lib/analytics/web-vitals";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Invisible component that subscribes to Web Vitals via the Next.js hook
 * and reports each metric through `reportWebVital`.
 *
 * Mount once in the root layout.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    reportWebVital(metric as WebVitalMetric);
  });

  return null;
}
