"use client";

// ADR: docs/architecture/adr/ADR-008-proactive-bubble-rule-engine.md
// Pattern P3.2 — Proaktive Orb-Bubble (regelbasiert, kein LLM-Call)

// =============================================================================
// Orb Bubble — useOrbTrigger Hook (Pattern P3.2)
// Setzt Event-Listener fuer Trigger-Events und liefert BubblePayload | null.
// Spike-Trigger: Nach 5s SECTION_DWELL triggern fuer initiale Validierung.
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { decideBubble } from "@/lib/orb-rules/rule-engine";
import { canShowBubble, markBubbleShown, markBubbleDismissed } from "@/lib/orb-rules/cooldown";
import type { BubblePayload } from "@/lib/orb-rules/trigger-types";

// Allow test environments to override the spike delay via window.__SPIKE_TRIGGER_DELAY_MS__
// SSR-safe: guarded by typeof window check.
const SPIKE_TRIGGER_DELAY_MS =
  typeof window !== 'undefined' &&
  typeof (window as unknown as Record<string, unknown>).__SPIKE_TRIGGER_DELAY_MS__ === 'number'
    ? (window as unknown as Record<string, unknown>).__SPIKE_TRIGGER_DELAY_MS__ as number
    : 5_000;

export function useOrbTrigger(): {
  payload: BubblePayload | null;
  dismiss: () => void;
} {
  const [payload, setPayload] = useState<BubblePayload | null>(null);
  const firedRef = useRef(false);

  const dismiss = useCallback(() => {
    setPayload(null);
    markBubbleDismissed();
  }, []);

  const tryTrigger = useCallback((event: Parameters<typeof decideBubble>[0]) => {
    if (firedRef.current) return;
    const result = decideBubble(event, { canShow: canShowBubble() });
    if (result) {
      firedRef.current = true;
      setPayload(result);
      markBubbleShown();
    }
  }, []);

  useEffect(() => {
    // Spike-Trigger: nach 5s festen SECTION_DWELL feuern
    const timer = setTimeout(() => {
      tryTrigger({
        kind: 'SECTION_DWELL',
        sectionId: 'spike-default',
        dwellMs: SPIKE_TRIGGER_DELAY_MS,
      });
    }, SPIKE_TRIGGER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [tryTrigger]);

  // Inaktivitaets-Timer (90 s) — nur wenn noch kein Bubble gefeuert
  useEffect(() => {
    const INACTIVITY_MS = 90_000;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        tryTrigger({ kind: 'INACTIVITY', idleMs: INACTIVITY_MS });
      }, INACTIVITY_MS);
    };

    // Throttle: mousemove/keydown/scroll nur alle 250ms verarbeiten
    let lastThrottle = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastThrottle < 250) return;
      lastThrottle = now;
      resetTimer();
    };

    resetTimer();
    document.addEventListener('mousemove', throttledReset);
    document.addEventListener('keydown', throttledReset);
    document.addEventListener('scroll', throttledReset, { passive: true });

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      document.removeEventListener('mousemove', throttledReset);
      document.removeEventListener('keydown', throttledReset);
      document.removeEventListener('scroll', throttledReset);
    };
  }, [tryTrigger]);

  // Section-Dwell via IntersectionObserver auf [data-orb-section]
  useEffect(() => {
    const DWELL_THRESHOLD_MS = 30_000;
    const dwellTimers = new Map<Element, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const timer = setTimeout(() => {
              const sectionId = entry.target.getAttribute('data-orb-section') ?? 'unknown';
              tryTrigger({ kind: 'SECTION_DWELL', sectionId, dwellMs: DWELL_THRESHOLD_MS });
            }, DWELL_THRESHOLD_MS);
            dwellTimers.set(entry.target, timer);
          } else {
            const t = dwellTimers.get(entry.target);
            if (t) {
              clearTimeout(t);
              dwellTimers.delete(entry.target);
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll('[data-orb-section]');
    sections.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      dwellTimers.forEach(clearTimeout);
    };
  }, [tryTrigger]);

  return { payload, dismiss };
}
