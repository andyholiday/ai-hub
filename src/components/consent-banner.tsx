"use client";

// =============================================================================
// ConsentBanner
// GDPR Art. 6 + 13 — Opt-in for analytics/web-vitals tracking.
// Stores user choice under localStorage key "analytics-consent".
// =============================================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "analytics-consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only when no prior choice has been saved
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "granted");
    setVisible(false);
  }

  function handleReject() {
    localStorage.setItem(STORAGE_KEY, "denied");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie-Einwilligung"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white px-4 py-4 shadow-lg sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-surface-700">
          Wir messen Ladezeiten (Web Vitals), um die Performance zu verbessern.
          Deine Daten werden nur mit deiner Zustimmung erhoben.{" "}
          <span className="text-surface-500">
            (DSGVO Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a)
          </span>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500"
          >
            Ablehnen
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-brand-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
