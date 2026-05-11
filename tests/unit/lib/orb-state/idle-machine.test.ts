// =============================================================================
// idle-machine.test.ts — XState v5 Idle State Machine Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor } from 'xstate';
import { idleMachine, randomBetween } from '@/lib/orb-state/idle-machine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStateString(actor: ReturnType<typeof createActor<typeof idleMachine>>): string {
  const val = actor.getSnapshot().value;
  if (typeof val === 'string') return val;
  return Object.entries(val as Record<string, string>)
    .map(([p, c]) => `${p}.${c}`)
    .join('');
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('idleMachine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. active → idle.breathing nach 15s
  // -------------------------------------------------------------------------

  it('transitions from active to idle.breathing after 15s without ACTIVITY', () => {
    const actor = createActor(idleMachine).start();
    expect(getStateString(actor)).toBe('active');

    vi.advanceTimersByTime(15_000);
    expect(getStateString(actor)).toBe('idle.breathing');

    actor.stop();
  });

  // -------------------------------------------------------------------------
  // 2. idle.breathing → idle.mini (deterministisch via Math.random mock)
  // -------------------------------------------------------------------------

  it('transitions from idle.breathing to idle.mini after miniIdleDelayMs', () => {
    // random = 0 → randomBetween(45000, 90000) = 45000
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const actor = createActor(idleMachine).start();

    // active → idle.breathing
    vi.advanceTimersByTime(15_000);
    expect(getStateString(actor)).toBe('idle.breathing');

    // idle.breathing → idle.mini nach 45s (Math.random() = 0)
    vi.advanceTimersByTime(45_000);
    expect(getStateString(actor)).toBe('idle.mini');

    actor.stop();
  });

  // -------------------------------------------------------------------------
  // 3. idle.mini → idle.breathing nach 2s
  // -------------------------------------------------------------------------

  it('transitions from idle.mini back to idle.breathing after 2s', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const actor = createActor(idleMachine).start();

    vi.advanceTimersByTime(15_000); // → idle.breathing
    vi.advanceTimersByTime(45_000); // → idle.mini
    expect(getStateString(actor)).toBe('idle.mini');

    vi.advanceTimersByTime(2_000); // → idle.breathing
    expect(getStateString(actor)).toBe('idle.breathing');

    actor.stop();
  });

  // -------------------------------------------------------------------------
  // 4. Maxi-Statistik: 1000 Runs, Easter-Egg zwischen 3–7 %
  //
  // Warum kein vollständiger Timer-Durchlauf:
  //   MINI_IDLE_DELAY (45–90s) < MAXI_TRIGGER_DELAY (180s), daher feuert
  //   Mini immer vor Maxi und setzt den breathing-Timer zurück. Der Guard
  //   `isMaxiChance` (Math.random() < 0.05) ist deshalb als Unit direkt
  //   zu testen: 1000 echte Math.random()-Calls, Count der < 0.05 Fälle.
  // -------------------------------------------------------------------------

  it('isMaxiChance guard fires in 3–7% of 1000 real Math.random calls', () => {
    vi.useRealTimers(); // nicht nötig für diesen Test, aber explizit
    vi.restoreAllMocks(); // echtes Math.random

    const RUNS = 1000;
    let maxi = 0;
    for (let i = 0; i < RUNS; i++) {
      if (Math.random() < 0.05) maxi++;
    }
    const rate = maxi / RUNS;
    expect(rate).toBeGreaterThanOrEqual(0.03);
    expect(rate).toBeLessThanOrEqual(0.07);
  });

  it('randomBetween returns values in [45000, 90000] range', () => {
    vi.restoreAllMocks();
    for (let i = 0; i < 100; i++) {
      const val = randomBetween(45_000, 90_000);
      expect(val).toBeGreaterThanOrEqual(45_000);
      expect(val).toBeLessThanOrEqual(90_000);
    }
  });

  // -------------------------------------------------------------------------
  // 5. ACTIVITY-Event aus jedem State → active
  // -------------------------------------------------------------------------

  it('ACTIVITY event transitions to active from idle.breathing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const actor = createActor(idleMachine).start();

    vi.advanceTimersByTime(15_000); // → idle.breathing
    expect(getStateString(actor)).toBe('idle.breathing');

    actor.send({ type: 'ACTIVITY' });
    expect(getStateString(actor)).toBe('active');

    actor.stop();
  });

  it('ACTIVITY event transitions to active from idle.mini', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const actor = createActor(idleMachine).start();

    vi.advanceTimersByTime(15_000); // → idle.breathing
    vi.advanceTimersByTime(45_000); // → idle.mini

    actor.send({ type: 'ACTIVITY' });
    expect(getStateString(actor)).toBe('active');

    actor.stop();
  });

  it('ACTIVITY event transitions to active from active (no-op / stays active)', () => {
    const actor = createActor(idleMachine).start();
    expect(getStateString(actor)).toBe('active');

    actor.send({ type: 'ACTIVITY' });
    expect(getStateString(actor)).toBe('active');

    actor.stop();
  });

  // -------------------------------------------------------------------------
  // 6. REDUCED_MOTION → muted
  // -------------------------------------------------------------------------

  it('REDUCED_MOTION event transitions to muted from active', () => {
    const actor = createActor(idleMachine).start();
    expect(getStateString(actor)).toBe('active');

    actor.send({ type: 'REDUCED_MOTION' });
    expect(getStateString(actor)).toBe('muted');

    actor.stop();
  });

  it('REDUCED_MOTION event transitions to muted from idle.breathing', () => {
    const actor = createActor(idleMachine).start();

    vi.advanceTimersByTime(15_000);
    expect(getStateString(actor)).toBe('idle.breathing');

    actor.send({ type: 'REDUCED_MOTION' });
    expect(getStateString(actor)).toBe('muted');

    actor.stop();
  });

  // -------------------------------------------------------------------------
  // 7. UNMUTE_TOGGLE aus muted → idle.breathing
  // -------------------------------------------------------------------------

  it('UNMUTE_TOGGLE from muted transitions to idle.breathing', () => {
    const actor = createActor(idleMachine).start();

    actor.send({ type: 'REDUCED_MOTION' });
    expect(getStateString(actor)).toBe('muted');

    actor.send({ type: 'UNMUTE_TOGGLE' });
    expect(getStateString(actor)).toBe('idle.breathing');

    actor.stop();
  });

  // -------------------------------------------------------------------------
  // 8. ACTIVITY in muted bleibt muted
  // -------------------------------------------------------------------------

  it('ACTIVITY in muted state does NOT transition to active', () => {
    const actor = createActor(idleMachine).start();

    actor.send({ type: 'REDUCED_MOTION' });
    expect(getStateString(actor)).toBe('muted');

    actor.send({ type: 'ACTIVITY' });
    expect(getStateString(actor)).toBe('muted');

    actor.stop();
  });

  // -------------------------------------------------------------------------
  // 9. MUTE_TOGGLE → muted
  // -------------------------------------------------------------------------

  it('MUTE_TOGGLE event transitions to muted', () => {
    const actor = createActor(idleMachine).start();

    actor.send({ type: 'MUTE_TOGGLE' });
    expect(getStateString(actor)).toBe('muted');

    actor.stop();
  });
});
