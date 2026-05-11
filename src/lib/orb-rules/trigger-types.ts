// ADR: docs/architecture/adr/ADR-008-proactive-bubble-rule-engine.md
// Pattern P3.2 — Proaktive Orb-Bubble (regelbasiert, kein LLM-Call)

// =============================================================================
// Orb Bubble — Trigger Event Types (Pattern P3.2)
// Discriminated Union der 8 Trigger-Events fuer die proaktive Orb-Bubble.
// =============================================================================

export type TriggerEvent =
  | { kind: 'SECTION_DWELL'; sectionId: string; dwellMs: number }
  | { kind: 'CODE_BLOCK_VISIBLE'; visibleMs: number }
  | { kind: 'SEARCH_NO_RESULT'; query: string }
  | { kind: 'INACTIVITY'; idleMs: number }
  | { kind: 'XP_MILESTONE'; xp: number; nextStep: string }
  | { kind: 'FIRST_AI_CHAT' }
  | { kind: 'DEEP_SCROLL'; scrollPct: number; readMs: number }
  | { kind: 'RETURN_VISIT'; daysSinceLastVisit: number; lastSection: string };

export type BubblePayload = {
  headline: string;
  body: string;
  triggerKind: TriggerEvent['kind'];
};
