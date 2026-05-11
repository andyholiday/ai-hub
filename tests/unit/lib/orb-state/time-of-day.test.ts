// =============================================================================
// time-of-day.test.ts
// =============================================================================

import { describe, it, expect } from 'vitest';
import { getTimeOfDay } from '@/lib/orb-state/time-of-day';

function makeDate(hour: number): Date {
  const d = new Date(2026, 0, 15); // 15. Jan 2026, Datum egal
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe('getTimeOfDay', () => {
  it('returns "day" for mid-morning (10:00)', () => {
    expect(getTimeOfDay(makeDate(10))).toBe('day');
  });

  it('returns "evening" for 19:00', () => {
    expect(getTimeOfDay(makeDate(19))).toBe('evening');
  });

  it('returns "night" for 02:00', () => {
    expect(getTimeOfDay(makeDate(2))).toBe('night');
  });

  it('returns "night" for 23:00', () => {
    expect(getTimeOfDay(makeDate(23))).toBe('night');
  });

  // Edge cases: Grenzen
  it('returns "day" exactly at 06:00 (start of day)', () => {
    expect(getTimeOfDay(makeDate(6))).toBe('day');
  });

  it('returns "night" at 05:59 — one hour before day starts', () => {
    const d = new Date(2026, 0, 15);
    d.setHours(5, 59, 59, 0);
    expect(getTimeOfDay(d)).toBe('night');
  });

  it('returns "evening" exactly at 18:00 (start of evening)', () => {
    expect(getTimeOfDay(makeDate(18))).toBe('evening');
  });

  it('returns "night" exactly at 22:00 (start of night)', () => {
    expect(getTimeOfDay(makeDate(22))).toBe('night');
  });
});
