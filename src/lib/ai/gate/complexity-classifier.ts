// =============================================================================
// LLM Gate — Complexity Classifier (Pattern P1.2)
// Pure Regex-Heuristik, kein Modell-Load, keine externen Abhaengigkeiten.
// Ziel-Performance: < 1ms
// =============================================================================

import type { ComplexityScore } from './types';

// ---------------------------------------------------------------------------
// Generation-Keywords
// ---------------------------------------------------------------------------

/** Exportiert fuer Tests und Tweaking. Reihenfolge irrelevant (alternation). */
export const GENERATION_KEYWORDS: readonly string[] = [
  'generiere',
  'erklaere',
  'erkläre',
  'schreibe',
  'erstelle',
  'warum',
  'wie funktioniert',
  'was ist',
  'zusammenfass',
  'formuliere',
  // Englische Varianten
  'explain',
  'generate',
  'write',
  'create',
  'why',
  'how does',
  'what is',
  'summarize',
  'summarise',
];

const GENERATION_KEYWORD_REGEX = new RegExp(
  `\\b(${GENERATION_KEYWORDS.map((k) => k.replace(/\s+/g, '\\s+')).join('|')})\\b`,
  'i',
);

// Zwei aufeinanderfolgende Grossbuchstaben-Woerter, nicht am Satzanfang
// Faengt "Berlin Schmidt", "Apple Pie", "OpenAI API" etc.
const ENTITY_REGEX = /(?<![.!?]\s|^\s*)\b[A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+/g;

// ---------------------------------------------------------------------------
// Pure Analyse-Funktion
// ---------------------------------------------------------------------------

/**
 * Analysiert eine Query auf Komplexitaets-Indikatoren.
 * Gibt wordCount, hasGenerationKeyword und hasEntities zurueck.
 * cacheHit und durationMs werden in llm-gate.ts ergaenzt.
 */
export function analyzeComplexity(
  query: string,
): Omit<ComplexityScore, 'cacheHit' | 'durationMs'> {
  const trimmed = query.trim();

  const wordCount = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const hasGenerationKeyword = GENERATION_KEYWORD_REGEX.test(trimmed);

  // Reset lastIndex zwischen Aufrufen (global flag)
  ENTITY_REGEX.lastIndex = 0;
  const hasEntities = ENTITY_REGEX.test(trimmed);

  return { wordCount, hasGenerationKeyword, hasEntities };
}
