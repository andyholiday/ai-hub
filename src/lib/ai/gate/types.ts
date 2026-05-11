// =============================================================================
// LLM Gate — Types (Pattern P1.2 Heuristic Cold-Start)
// =============================================================================

export type GateDecision =
  | { route: 'local'; reason: 'short' | 'no-entities' | 'cache-hit' }
  | { route: 'llm'; reason: 'long' | 'has-entities' | 'generation-keyword' | 'premium-bypass' }
  | { route: 'llm'; reason: 'fallback' };

export type ComplexityScore = {
  wordCount: number;
  hasGenerationKeyword: boolean;
  hasEntities: boolean;
  cacheHit: boolean;
  durationMs: number;
};

export type GateInput = {
  query: string;
  userTier?: 'free' | 'premium';
  /** Injizierbar fuer Tests — gibt true zurueck wenn Antwort im Cache liegt */
  cacheLookup?: (q: string) => Promise<boolean>;
};
