// =============================================================================
// Rule Engine Tests — 16 Cases (8 Trigger × canShow true|false)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { decideBubble } from '@/lib/orb-rules/rule-engine';
import type { TriggerEvent } from '@/lib/orb-rules/trigger-types';

const TRIGGERS: TriggerEvent[] = [
  { kind: 'SECTION_DWELL', sectionId: 'intro', dwellMs: 30_000 },
  { kind: 'CODE_BLOCK_VISIBLE', visibleMs: 10_000 },
  { kind: 'SEARCH_NO_RESULT', query: 'react hooks' },
  { kind: 'INACTIVITY', idleMs: 90_000 },
  { kind: 'XP_MILESTONE', xp: 500, nextStep: 'Level 6' },
  { kind: 'FIRST_AI_CHAT' },
  { kind: 'DEEP_SCROLL', scrollPct: 85, readMs: 130_000 },
  { kind: 'RETURN_VISIT', daysSinceLastVisit: 5, lastSection: 'Best Practices' },
];

describe('decideBubble — canShow: false', () => {
  for (const event of TRIGGERS) {
    it(`returns null for ${event.kind} when canShow=false`, () => {
      const result = decideBubble(event, { canShow: false });
      expect(result).toBeNull();
    });
  }
});

describe('decideBubble — canShow: true', () => {
  for (const event of TRIGGERS) {
    it(`returns BubblePayload for ${event.kind} when canShow=true`, () => {
      const result = decideBubble(event, { canShow: true });
      expect(result).not.toBeNull();
      expect(result?.triggerKind).toBe(event.kind);
      expect(typeof result?.headline).toBe('string');
      expect(result!.headline.length).toBeGreaterThan(0);
      expect(typeof result?.body).toBe('string');
      expect(result!.body.length).toBeGreaterThan(0);
    });
  }
});
