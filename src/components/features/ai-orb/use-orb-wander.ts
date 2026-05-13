'use client';

// =============================================================================
// useOrbWander — Scroll-coupled wandering position for the Living Orb
// Pattern P3.1, ADR-007
//
// Returns { x, y } MotionValues the consumer binds to a motion.div via style.
// When prefers-reduced-motion is active, returns static { x: 0, y: 0 }.
// All window/DOM access is deferred to useEffect (SSR-safe).
// =============================================================================

import { useEffect, useRef } from 'react';
import {
  useMotionValue,
  useSpring,
  type MotionValue,
} from 'framer-motion';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Spring config for smooth positional lag. */
const SPRING_CONFIG = { stiffness: 80, damping: 20 } as const;

/** Orb assumed size (px) — used for viewport clamping. */
const ORB_SIZE = 64;

/** Cursor repulsion radius in px. */
const REPULSION_RADIUS = 80;

/** Maximum anchors observed (Safari performance, ADR-007). */
const MAX_ANCHOR_TARGETS = 3;

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface OrbWanderPosition {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrbWander(): OrbWanderPosition {
  // Raw target values driven by logic below
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);

  // Springified output consumed by the motion.div
  const x = useSpring(targetX, SPRING_CONFIG);
  const y = useSpring(targetY, SPRING_CONFIG);

  // Stable ref for rAF throttling
  const rafPending = useRef(false);

  useEffect(() => {
    // SSR guard — should never fire server-side but belt-and-suspenders
    if (typeof window === 'undefined') return;

    // ------------------------------------------------------------------
    // prefers-reduced-motion check — bail out with static position
    // ------------------------------------------------------------------
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mql.matches) {
      // Keep at 0,0 (component applies offset via CSS fixed positioning)
      return;
    }

    // ------------------------------------------------------------------
    // Dock position: default bottom-right (28px from edge, matching CSS)
    // ------------------------------------------------------------------
    const getDockX = () => window.innerWidth - ORB_SIZE - 28;
    const getDockY = () => window.innerHeight - ORB_SIZE - 28;

    // Initialise to dock position
    targetX.set(getDockX());
    targetY.set(getDockY());

    // ------------------------------------------------------------------
    // IntersectionObserver — track up to MAX_ANCHOR_TARGETS anchors
    // ------------------------------------------------------------------
    const allAnchors = Array.from(
      document.querySelectorAll<HTMLElement>('[data-orb-anchor]'),
    ).slice(0, MAX_ANCHOR_TARGETS);

    let visibleAnchor: HTMLElement | null = null;

    const clampX = (v: number) =>
      Math.max(0, Math.min(window.innerWidth - ORB_SIZE, v));
    const clampY = (v: number) =>
      Math.max(0, Math.min(window.innerHeight - ORB_SIZE, v));

    const updateTargetToAnchor = (anchor: HTMLElement) => {
      const rect = anchor.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX.set(clampX(cx - ORB_SIZE / 2));
      targetY.set(clampY(cy - ORB_SIZE / 2));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleAnchor = entry.target as HTMLElement;
            updateTargetToAnchor(visibleAnchor);
            return;
          }
        }
        // No anchor visible — dock back
        visibleAnchor = null;
        targetX.set(getDockX());
        targetY.set(getDockY());
      },
      { threshold: 0.3 },
    );

    for (const anchor of allAnchors) {
      observer.observe(anchor);
    }

    // ------------------------------------------------------------------
    // Cursor avoidance — throttled via requestAnimationFrame
    // ------------------------------------------------------------------
    const handleMouseMove = (e: MouseEvent) => {
      if (rafPending.current) return;
      rafPending.current = true;

      requestAnimationFrame(() => {
        rafPending.current = false;

        const curX = e.clientX;
        const curY = e.clientY;
        const orbX = targetX.get();
        const orbY = targetY.get();

        const dx = orbX + ORB_SIZE / 2 - curX;
        const dy = orbY + ORB_SIZE / 2 - curY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPULSION_RADIUS && dist > 0) {
          // Push away proportionally
          const pushScale = (REPULSION_RADIUS - dist) / REPULSION_RADIUS;
          const pushX = (dx / dist) * REPULSION_RADIUS * pushScale;
          const pushY = (dy / dist) * REPULSION_RADIUS * pushScale;

          if (visibleAnchor) {
            // Preserve anchor target with push offset
            const rect = visibleAnchor.getBoundingClientRect();
            const anchorX = rect.left + rect.width / 2 - ORB_SIZE / 2;
            const anchorY = rect.top + rect.height / 2 - ORB_SIZE / 2;
            targetX.set(clampX(anchorX + pushX));
            targetY.set(clampY(anchorY + pushY));
          } else {
            targetX.set(clampX(getDockX() + pushX));
            targetY.set(clampY(getDockY() + pushY));
          }
        } else if (visibleAnchor) {
          // No repulsion needed — re-centre on anchor
          updateTargetToAnchor(visibleAnchor);
        } else {
          // No repulsion, no anchor — dock
          targetX.set(getDockX());
          targetY.set(getDockY());
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // ------------------------------------------------------------------
    // Cleanup
    // ------------------------------------------------------------------
    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [targetX, targetY]);

  return { x, y };
}
