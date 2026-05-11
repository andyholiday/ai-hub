'use client';

// =============================================================================
// useOrbIdleState — Hook fuer XState Idle-Machine (Pattern P3.3, ADR-009)
//
// - Verbindet globale Browser-Events (mousemove, keydown, scroll) mit der
//   ACTIVITY-Transition der Machine.
// - Erkennt prefers-reduced-motion und feuert REDUCED_MOTION-Event.
// - SSR-sicher: kein window-Zugriff auf dem Server.
// =============================================================================

import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { idleMachine } from '@/lib/orb-state/idle-machine';

// ---------------------------------------------------------------------------
// Return-Type
// ---------------------------------------------------------------------------

export interface OrbIdleStateResult {
  /** Aktueller State-Value (z.B. 'active', 'idle.breathing', 'muted'). */
  state: string;
  /** XState send-Funktion fuer manuelle Events (z.B. MUTE_TOGGLE). */
  send: ReturnType<typeof useMachine<typeof idleMachine>>[1];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrbIdleState(): OrbIdleStateResult {
  const [snapshot, send] = useMachine(idleMachine);

  useEffect(() => {
    // SSR-Guard: window ist nur im Browser verfuegbar.
    if (typeof window === 'undefined') return;

    // raf-throttle fuer mousemove: sendet ACTIVITY nur einmal pro Frame.
    let rafPending = false;

    function handleActivity() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        send({ type: 'ACTIVITY' });
        rafPending = false;
      });
    }

    function handleDirectActivity() {
      send({ type: 'ACTIVITY' });
    }

    // prefers-reduced-motion Detection
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    function handleReducedMotion(e: MediaQueryListEvent) {
      if (e.matches) {
        send({ type: 'REDUCED_MOTION' });
      } else {
        send({ type: 'UNMUTE_TOGGLE' });
      }
    }

    // Initialer Check beim Mount
    if (mediaQuery.matches) {
      send({ type: 'REDUCED_MOTION' });
    }

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleDirectActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    mediaQuery.addEventListener('change', handleReducedMotion);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleDirectActivity);
      window.removeEventListener('scroll', handleActivity);
      mediaQuery.removeEventListener('change', handleReducedMotion);
    };
  }, [send]);

  // Flache State-Value-Darstellung (z.B. "idle.breathing" statt { idle: "breathing" })
  const stateValue = snapshot.value;
  const stateString =
    typeof stateValue === 'string'
      ? stateValue
      : Object.entries(stateValue as Record<string, string>)
          .map(([parent, child]) => `${parent}.${child}`)
          .join('');

  return { state: stateString, send };
}
