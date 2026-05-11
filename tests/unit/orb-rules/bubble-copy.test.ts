// =============================================================================
// Bubble Copy Tests — Template-Substitution + alle 8 Trigger haben Texte
// =============================================================================

import { describe, it, expect } from 'vitest';
import { getBubbleCopy } from '@/lib/orb-rules/bubble-copy';
import type { TriggerEvent } from '@/lib/orb-rules/trigger-types';

describe('getBubbleCopy — alle 8 Trigger haben Texte', () => {
  it('SECTION_DWELL liefert headline und body', () => {
    const result = getBubbleCopy({ kind: 'SECTION_DWELL', sectionId: 'intro', dwellMs: 30_000 });
    expect(result.headline).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  it('CODE_BLOCK_VISIBLE liefert headline und body', () => {
    const result = getBubbleCopy({ kind: 'CODE_BLOCK_VISIBLE', visibleMs: 10_000 });
    expect(result.headline).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  it('SEARCH_NO_RESULT substituiert {{query}} korrekt', () => {
    const query = 'typescript generics';
    const result = getBubbleCopy({ kind: 'SEARCH_NO_RESULT', query });
    expect(result.body).toContain(query);
    expect(result.headline).toBeTruthy();
  });

  it('INACTIVITY liefert headline und body', () => {
    const result = getBubbleCopy({ kind: 'INACTIVITY', idleMs: 90_000 });
    expect(result.headline).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  it('XP_MILESTONE substituiert xp und nextStep korrekt', () => {
    const result = getBubbleCopy({ kind: 'XP_MILESTONE', xp: 1000, nextStep: 'Level 10' });
    expect(result.body).toContain('1000');
    expect(result.body).toContain('Level 10');
    expect(result.headline).toBeTruthy();
  });

  it('FIRST_AI_CHAT liefert headline und body', () => {
    const result = getBubbleCopy({ kind: 'FIRST_AI_CHAT' });
    expect(result.headline).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  it('DEEP_SCROLL liefert headline und body', () => {
    const result = getBubbleCopy({ kind: 'DEEP_SCROLL', scrollPct: 85, readMs: 130_000 });
    expect(result.headline).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  it('RETURN_VISIT substituiert lastSection korrekt', () => {
    const lastSection = 'Best Practices';
    const result = getBubbleCopy({ kind: 'RETURN_VISIT', daysSinceLastVisit: 4, lastSection });
    expect(result.body).toContain(lastSection);
    expect(result.headline).toBeTruthy();
  });
});

describe('getBubbleCopy — alle Texte sind nicht leer', () => {
  const events: TriggerEvent[] = [
    { kind: 'SECTION_DWELL', sectionId: 'x', dwellMs: 1 },
    { kind: 'CODE_BLOCK_VISIBLE', visibleMs: 1 },
    { kind: 'SEARCH_NO_RESULT', query: 'x' },
    { kind: 'INACTIVITY', idleMs: 1 },
    { kind: 'XP_MILESTONE', xp: 1, nextStep: 'y' },
    { kind: 'FIRST_AI_CHAT' },
    { kind: 'DEEP_SCROLL', scrollPct: 1, readMs: 1 },
    { kind: 'RETURN_VISIT', daysSinceLastVisit: 1, lastSection: 'x' },
  ];

  for (const event of events) {
    it(`${event.kind} hat non-empty headline und body`, () => {
      const { headline, body } = getBubbleCopy(event);
      expect(headline.trim().length).toBeGreaterThan(0);
      expect(body.trim().length).toBeGreaterThan(0);
    });
  }
});
