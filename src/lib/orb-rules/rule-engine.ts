// =============================================================================
// Orb Bubble — Rule Engine (Pattern P3.2)
// Pure function: TriggerEvent + ctx -> BubblePayload | null
// Kein LLM-Call, keine Side-Effects, kein localStorage-Read.
// =============================================================================

import { match } from 'ts-pattern';
import { getBubbleCopy } from './bubble-copy';
import type { BubblePayload, TriggerEvent } from './trigger-types';

export interface RuleContext {
  /** false = Cooldown oder Frequency-Cap aktiv — kein Bubble zeigen */
  canShow: boolean;
}

/**
 * Entscheidet, ob und welche Bubble fuer ein TriggerEvent angezeigt wird.
 * Gibt null zurueck, wenn canShow=false oder kein Match.
 *
 * Pure function — keine Side-Effects.
 */
export function decideBubble(
  event: TriggerEvent,
  ctx: RuleContext
): BubblePayload | null {
  if (!ctx.canShow) return null;

  return match(event)
    .with({ kind: 'SECTION_DWELL' }, (e) => ({
      ...getBubbleCopy(e),
      triggerKind: e.kind as TriggerEvent['kind'],
    }))
    .with({ kind: 'CODE_BLOCK_VISIBLE' }, (e) => ({
      ...getBubbleCopy(e),
      triggerKind: e.kind as TriggerEvent['kind'],
    }))
    .with({ kind: 'SEARCH_NO_RESULT' }, (e) => ({
      ...getBubbleCopy(e),
      triggerKind: e.kind as TriggerEvent['kind'],
    }))
    .with({ kind: 'INACTIVITY' }, (e) => ({
      ...getBubbleCopy(e),
      triggerKind: e.kind as TriggerEvent['kind'],
    }))
    .with({ kind: 'XP_MILESTONE' }, (e) => ({
      ...getBubbleCopy(e),
      triggerKind: e.kind as TriggerEvent['kind'],
    }))
    .with({ kind: 'FIRST_AI_CHAT' }, (e) => ({
      ...getBubbleCopy(e),
      triggerKind: e.kind as TriggerEvent['kind'],
    }))
    .with({ kind: 'DEEP_SCROLL' }, (e) => ({
      ...getBubbleCopy(e),
      triggerKind: e.kind as TriggerEvent['kind'],
    }))
    .with({ kind: 'RETURN_VISIT' }, (e) => ({
      ...getBubbleCopy(e),
      triggerKind: e.kind as TriggerEvent['kind'],
    }))
    .exhaustive();
}
