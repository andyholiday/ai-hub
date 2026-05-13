// =============================================================================
// Orb Idle State Machine — XState v5 (Pattern P3.3, ADR-009)
//
// 5 States:
//   active          — User interagiert
//   idle.breathing  — Atemrhythmus (3s Zyklus, scale 1.0→1.04→1.0)
//   idle.mini       — Mini-Idle alle 45–90s, ~2s Drift
//   idle.maxi       — Easter-Egg, 5% nach 3min Idle, ~4s
//   muted           — prefers-reduced-motion oder User-Toggle
//
// Pure XState — keine Side-Effects, kein DOM-Zugriff.
// =============================================================================

import { setup, assign } from 'xstate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrbIdleEvent =
  | { type: 'ACTIVITY' }
  | { type: 'MUTE_TOGGLE' }
  | { type: 'UNMUTE_TOGGLE' }
  | { type: 'REDUCED_MOTION' };

export interface OrbIdleContext {
  /** Zufaelliges Mini-Idle-Intervall in ms (45_000–90_000). */
  miniIdleDelayMs: number;
}

export type OrbIdleState =
  | 'active'
  | 'idle.breathing'
  | 'idle.mini'
  | 'idle.maxi'
  | 'muted';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gibt einen zufaelligen Wert zwischen min und max (inkl.) zurueck. */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Machine
// ---------------------------------------------------------------------------

export const idleMachine = setup({
  types: {
    events: {} as OrbIdleEvent,
    context: {} as OrbIdleContext,
  },
  actions: {
    refreshMiniDelay: assign({
      miniIdleDelayMs: () => randomBetween(45_000, 90_000),
    }),
  },
  guards: {
    /**
     * Easter-Egg-Guard: 5% Wahrscheinlichkeit fuer Maxi-State.
     * Deterministisch testbar via vi.spyOn(Math, 'random').
     */
    isMaxiChance: () => Math.random() < 0.05,
  },
  delays: {
    ACTIVITY_TIMEOUT: 15_000,
    MINI_IDLE_DELAY: ({ context }: { context: OrbIdleContext }) => context.miniIdleDelayMs,
    MINI_DURATION: 2_000,
    MAXI_TRIGGER_DELAY: 180_000,
    MAXI_DURATION: 4_000,
  },
}).createMachine({
  id: 'orbIdle',
  initial: 'active',
  context: {
    miniIdleDelayMs: randomBetween(45_000, 90_000),
  },
  on: {
    // Aus jedem State (ausser muted-Override): ACTIVITY → active
    ACTIVITY: { target: '#orbIdle.active' },
    // Aus jedem State: MUTE_TOGGLE / REDUCED_MOTION → muted
    MUTE_TOGGLE: { target: '#orbIdle.muted' },
    REDUCED_MOTION: { target: '#orbIdle.muted' },
  },
  states: {
    active: {
      after: {
        // Nach 15s ohne ACTIVITY → idle.breathing
        ACTIVITY_TIMEOUT: { target: '#orbIdle.idle' },
      },
    },

    idle: {
      initial: 'breathing',
      states: {
        breathing: {
          // Neues zufaelliges Intervall beim Betreten des breathing-States
          entry: ['refreshMiniDelay'],
          after: {
            // → idle.mini nach zufaelligem Intervall (45–90s)
            MINI_IDLE_DELAY: { target: 'mini' },
            // → idle.maxi nach 3min, aber nur bei 5% Chance
            MAXI_TRIGGER_DELAY: [
              { guard: 'isMaxiChance', target: 'maxi' },
              { target: 'breathing' }, // kein Maxi: bleibt breathing (Timer-Reset)
            ],
          },
        },

        mini: {
          after: {
            // Nach 2s zurueck zu breathing
            MINI_DURATION: { target: 'breathing' },
          },
        },

        maxi: {
          after: {
            // Nach 4s Easter-Egg zurueck zu breathing
            MAXI_DURATION: { target: 'breathing' },
          },
        },
      },
    },

    muted: {
      on: {
        // Nur UNMUTE_TOGGLE bricht muted auf → idle.breathing
        UNMUTE_TOGGLE: { target: '#orbIdle.idle' },
        // Root-Handler ACTIVITY/MUTE_TOGGLE/REDUCED_MOTION lokal deaktivieren:
        // In muted soll ACTIVITY nichts aendern.
        ACTIVITY: {},
        MUTE_TOGGLE: {},
        REDUCED_MOTION: {},
      },
    },
  },
});
