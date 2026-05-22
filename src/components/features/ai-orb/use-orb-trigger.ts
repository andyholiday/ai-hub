"use client";

// ADR: docs/architecture/adr/ADR-008-proactive-bubble-rule-engine.md
// Pattern P3.2 — Proaktive Orb-Bubble (regelbasiert, kein LLM-Call)

// =============================================================================
// Orb Bubble — useOrbTrigger Hook (Pattern P3.2)
// Emitters with real data sources:
//   - INACTIVITY: DOM events (mousemove, keydown, scroll)
//   - SECTION_DWELL: IntersectionObserver on [data-orb-section]
//   - RETURN_VISIT: localStorage timestamp (orb-last-visit)
//   - DEEP_SCROLL: window scroll event (>80% page height, 30s dwell estimate)
//   - CODE_BLOCK_VISIBLE: IntersectionObserver on pre/code elements
// Triggers without a data source (TODO — no real signal in the app):
//   - XP_MILESTONE: requires XP system event bus (not wired)
//   - FIRST_AI_CHAT: requires chat session count from DB (not wired)
//   - SEARCH_NO_RESULT: requires a search UI emitting events (not wired)
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { decideBubble } from "@/lib/orb-rules/rule-engine";
import { canShowBubble, markBubbleShown, markBubbleDismissed } from "@/lib/orb-rules/cooldown";
import type { BubblePayload } from "@/lib/orb-rules/trigger-types";

const RETURN_VISIT_KEY = 'orb-last-visit';
const DEEP_SCROLL_THRESHOLD = 0.8;
const DEEP_SCROLL_DWELL_ESTIMATE_MS = 30_000;

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

  // RETURN_VISIT — localStorage timestamp; fires on mount if last visit was >1 day ago
  useEffect(() => {
    const now = Date.now();
    const rawLast = localStorage.getItem(RETURN_VISIT_KEY);
    localStorage.setItem(RETURN_VISIT_KEY, String(now));
    if (rawLast) {
      const daysSince = (now - Number(rawLast)) / 86_400_000;
      if (daysSince >= 1) {
        tryTrigger({ kind: 'RETURN_VISIT', daysSinceLastVisit: Math.floor(daysSince), lastSection: 'dashboard' });
      }
    }
  }, [tryTrigger]);

  // INACTIVITY — DOM events (90 s idle threshold)
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

  // SECTION_DWELL — IntersectionObserver auf [data-orb-section]
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

  // DEEP_SCROLL — scrolled past 80% of page height
  useEffect(() => {
    let fired = false;
    const handleScroll = () => {
      if (fired) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= DEEP_SCROLL_THRESHOLD) {
        fired = true;
        tryTrigger({
          kind: 'DEEP_SCROLL',
          scrollPct: Math.round((scrolled / total) * 100),
          readMs: DEEP_SCROLL_DWELL_ESTIMATE_MS,
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tryTrigger]);

  // CODE_BLOCK_VISIBLE — IntersectionObserver on pre/code blocks
  useEffect(() => {
    const CODE_DWELL_MS = 8_000;
    const dwellTimers = new Map<Element, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const timer = setTimeout(() => {
              tryTrigger({ kind: 'CODE_BLOCK_VISIBLE', visibleMs: CODE_DWELL_MS });
            }, CODE_DWELL_MS);
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

    document.querySelectorAll('pre, code').forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      dwellTimers.forEach(clearTimeout);
    };
  }, [tryTrigger]);

  return { payload, dismiss };
}
