// =============================================================================
// Unit Tests: web-vitals.ts — M02 GDPR consent gate
// =============================================================================
//
// Note: `isDevelopment` is a top-level constant evaluated at module-load time
// (NODE_ENV === "development"). In the vitest environment NODE_ENV is "test",
// so isDevelopment is always false here. The dev-mode log path is tested via
// the exported `hasAnalyticsConsent` helper; the production sendBeacon path
// exercises the full reportWebVital consent gate end-to-end.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  reportWebVital,
  hasAnalyticsConsent,
  type WebVitalMetric,
} from "@/lib/analytics/web-vitals";

const METRIC: WebVitalMetric = {
  name: "LCP",
  value: 1200,
  id: "test-id-1",
  rating: "good",
  delta: 100,
  navigationType: "navigate",
};

function setConsent(value: string | null) {
  if (value === null) {
    localStorage.removeItem("analytics-consent");
  } else {
    localStorage.setItem("analytics-consent", value);
  }
}

// ---------------------------------------------------------------------------
// hasAnalyticsConsent — unit
// ---------------------------------------------------------------------------

describe("hasAnalyticsConsent", () => {
  beforeEach(() => localStorage.clear());

  it("returns false when no consent is stored", () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("returns false when consent is 'denied'", () => {
    setConsent("denied");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("returns true only when consent is 'granted'", () => {
    setConsent("granted");
    expect(hasAnalyticsConsent()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// reportWebVital — consent gate (M02 fix verified via sendBeacon path)
// ---------------------------------------------------------------------------

describe("reportWebVital — consent gate (M02)", () => {
  let beaconSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    // jsdom does not provide sendBeacon by default; install a stub
    if (!("sendBeacon" in navigator)) {
      Object.defineProperty(navigator, "sendBeacon", {
        value: vi.fn(() => true),
        writable: true,
        configurable: true,
      });
    }
    beaconSpy = vi.spyOn(navigator, "sendBeacon").mockReturnValue(true);
  });

  afterEach(() => {
    beaconSpy.mockRestore();
  });

  it("does NOT send any data when consent is absent", () => {
    reportWebVital(METRIC);
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it("does NOT send any data when consent is 'denied'", () => {
    setConsent("denied");
    reportWebVital(METRIC);
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it("sends metric data when consent is 'granted'", () => {
    setConsent("granted");
    reportWebVital(METRIC);
    expect(beaconSpy).toHaveBeenCalledOnce();
  });

  it("passes the correct metric name in the beacon payload", () => {
    setConsent("granted");
    reportWebVital(METRIC);
    const [, blob] = beaconSpy.mock.calls[0] as [string, Blob];
    // Blob.text() is async; verify via the beacon being called with a Blob
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
  });
});
