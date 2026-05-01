"use client";

// =============================================================================
// ConsentBanner
// GDPR Art. 6 + 13 — Opt-in for analytics/web-vitals tracking.
// Stores user choice under localStorage key "analytics-consent".
// =============================================================================

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "analytics-consent";
const HEADING_ID = "consent-banner-heading";
const DESC_ID = "consent-banner-desc";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Show banner only when no prior choice has been saved
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  // Focus first button on mount; manage Tab/Shift-Tab cycle within banner
  useEffect(() => {
    if (!visible) return;

    // Move focus into the dialog on open
    rejectRef.current?.focus();

    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        dialog!.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

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
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={HEADING_ID}
      aria-describedby={DESC_ID}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white px-4 py-4 shadow-lg sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p id={DESC_ID} className="text-sm text-surface-700">
          <span id={HEADING_ID} className="sr-only">
            Cookie-Einwilligung
          </span>
          Wir messen Ladezeiten (Web Vitals), um die Performance zu verbessern.
          Deine Daten werden nur mit deiner Zustimmung erhoben.{" "}
          <span className="text-surface-500">
            (DSGVO Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a)
          </span>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            ref={rejectRef}
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
