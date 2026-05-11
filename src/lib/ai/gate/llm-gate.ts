// =============================================================================
// LLM Gate — Decision Engine (Pattern P1.2)
// 7-Regel-Entscheidungsmatrix. Konservativ: bei Unsicherheit → LLM (safe).
// DoD: Gate-Entscheidung < 50ms (typisch < 1ms bei pure Regex).
// =============================================================================

import { analyzeComplexity } from './complexity-classifier';
import type { GateDecision, GateInput, ComplexityScore } from './types';

/** Mindest-Wortanzahl ab der eine Anfrage als "lang" gilt. */
const LONG_QUERY_THRESHOLD = 15;

/**
 * Entscheidet ob eine Anfrage lokal beantwortet oder an einen LLM weitergeleitet wird.
 *
 * Entscheidungspfad (in Reihenfolge):
 * 1. Premium-User → immer LLM
 * 2. Cache-Hit → lokal
 * 3. Kurz + keine Keywords + keine Entities → lokal
 * 4. Wortanzahl >= Threshold → LLM
 * 5. Generation-Keyword → LLM
 * 6. Entities erkannt → LLM
 * 7. Fallback → LLM (safe default)
 */
export async function decideGate(
  input: GateInput,
): Promise<{ decision: GateDecision; complexity: ComplexityScore }> {
  const start = performance.now();

  const { query, userTier, cacheLookup } = input;

  // 1. Premium-Bypass — immer LLM
  if (userTier === 'premium') {
    const durationMs = performance.now() - start;
    return {
      decision: { route: 'llm', reason: 'premium-bypass' },
      complexity: { wordCount: 0, hasGenerationKeyword: false, hasEntities: false, cacheHit: false, durationMs },
    };
  }

  // Analyse vor Cache-Check um wordCount immer verfuegbar zu haben
  const partial = analyzeComplexity(query);

  // 2. Cache-Hit → lokal
  const cacheHit = cacheLookup ? await cacheLookup(query) : false;
  if (cacheHit) {
    const durationMs = performance.now() - start;
    return {
      decision: { route: 'local', reason: 'cache-hit' },
      complexity: { ...partial, cacheHit: true, durationMs },
    };
  }

  const complexity: ComplexityScore = { ...partial, cacheHit: false, durationMs: 0 };

  let decision: GateDecision;

  // 3. Kurz + keine Keywords + keine Entities → lokal
  if (
    complexity.wordCount < LONG_QUERY_THRESHOLD &&
    !complexity.hasGenerationKeyword &&
    !complexity.hasEntities
  ) {
    decision = { route: 'local', reason: 'short' };
  }
  // 4. Lang → LLM
  else if (complexity.wordCount >= LONG_QUERY_THRESHOLD) {
    decision = { route: 'llm', reason: 'long' };
  }
  // 5. Generation-Keyword → LLM
  else if (complexity.hasGenerationKeyword) {
    decision = { route: 'llm', reason: 'generation-keyword' };
  }
  // 6. Entities → LLM
  else if (complexity.hasEntities) {
    decision = { route: 'llm', reason: 'has-entities' };
  }
  // 7. Safe-Default → LLM
  // Defense-in-depth: Falls Rules 1-6 durch zukuenftige Erweiterungen einen
  // Edge-Case auslassen, landet die Decision konservativ auf LLM statt local.
  // Aktuell exhaustiv durch Rules 3-6 — dieser Pfad ist als Safety-Net erhalten.
  /* c8 ignore next 3 */
  else {
    decision = { route: 'llm', reason: 'fallback' };
  }

  complexity.durationMs = performance.now() - start;

  return { decision, complexity };
}
