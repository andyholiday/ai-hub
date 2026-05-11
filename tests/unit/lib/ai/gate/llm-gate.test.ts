// =============================================================================
// Tests: LLM Gate — 20-Fixture Decision Matrix
// Simple (10) → erwartet route:'local'
// Complex (10) → erwartet route:'llm'
// 5%-Cap: max 1 false positive in 20 Samples
// =============================================================================

import { describe, it, expect } from 'vitest';
import { decideGate } from '@/lib/ai/gate/llm-gate';

// ---------------------------------------------------------------------------
// Fixture sets
// ---------------------------------------------------------------------------

const simpleQueries = [
  'Hallo',
  'Nicht verstanden',
  'Hilfe',
  'Wo finde ich Settings',
  'Danke',
  'OK',
  'Bitte',
  'Nein',
  'Ja bitte',
  'Stopp',
];

const complexQueries = [
  'Erkläre mir TypeScript-Types ausführlich mit Beispielen',
  'Generiere ein Beispiel für useReducer in React',
  'Wie funktioniert die OAuth-Flow im AI Hub',
  'Was ist der Unterschied zwischen Promises und async await in JavaScript',
  'Erstelle eine Zusammenfassung der wichtigsten React 18 Features',
  'Warum schlägt mein TypeScript Build mit dem Fehler noImplicitAny fehl',
  'Schreibe einen Unit-Test für die decideGate Funktion',
  'Erkläre das Konzept von Row Level Security in Supabase',
  'Wie funktioniert das Embedding-Modell in der Hybrid-Search Implementierung',
  'Generiere eine Migration für eine neue Tabelle mit UUID Primary Key',
];

// ---------------------------------------------------------------------------
// Simple queries → route: 'local'
// ---------------------------------------------------------------------------

describe('decideGate — simple queries (local route)', () => {
  for (const query of simpleQueries) {
    it(`routes "${query}" to local`, async () => {
      const { decision } = await decideGate({ query });
      expect(decision.route).toBe('local');
    });
  }
});

// ---------------------------------------------------------------------------
// Complex queries → route: 'llm'
// ---------------------------------------------------------------------------

describe('decideGate — complex queries (llm route)', () => {
  for (const query of complexQueries) {
    it(`routes "${query.slice(0, 50)}..." to llm`, async () => {
      const { decision } = await decideGate({ query });
      expect(decision.route).toBe('llm');
    });
  }
});

// ---------------------------------------------------------------------------
// 5%-Cap: max 1 false positive across all 20 samples
// ---------------------------------------------------------------------------

describe('decideGate — 5% false-positive cap on 20 samples', () => {
  it('classifies at least 19 out of 20 fixtures correctly', async () => {
    let correct = 0;

    for (const q of simpleQueries) {
      const { decision } = await decideGate({ query: q });
      if (decision.route === 'local') correct++;
    }
    for (const q of complexQueries) {
      const { decision } = await decideGate({ query: q });
      if (decision.route === 'llm') correct++;
    }

    // max 1 false positive = min 19 correct
    expect(correct).toBeGreaterThanOrEqual(19);
  });
});

// ---------------------------------------------------------------------------
// Premium bypass
// ---------------------------------------------------------------------------

describe('decideGate — premium bypass', () => {
  it('always routes to llm for premium tier regardless of query', async () => {
    const { decision } = await decideGate({ query: 'Hallo', userTier: 'premium' });
    expect(decision.route).toBe('llm');
    expect(decision.reason).toBe('premium-bypass');
  });

  it('routes even trivially short premium queries to llm', async () => {
    const { decision } = await decideGate({ query: 'OK', userTier: 'premium' });
    expect(decision.route).toBe('llm');
  });
});

// ---------------------------------------------------------------------------
// Cache hit
// ---------------------------------------------------------------------------

describe('decideGate — cache hit', () => {
  it('routes to local when cache returns true', async () => {
    const { decision } = await decideGate({
      query: 'Erkläre mir alles über TypeScript',
      cacheLookup: async () => true,
    });
    expect(decision.route).toBe('local');
    expect(decision.reason).toBe('cache-hit');
  });

  it('does not bypass premium with cache hit', async () => {
    // Premium check happens before cache check
    const { decision } = await decideGate({
      query: 'Hallo',
      userTier: 'premium',
      cacheLookup: async () => true,
    });
    expect(decision.route).toBe('llm');
    expect(decision.reason).toBe('premium-bypass');
  });
});

// ---------------------------------------------------------------------------
// Branch coverage: has-entities (short, no keyword, has entities)
// ---------------------------------------------------------------------------

describe('decideGate — entity branch', () => {
  it('routes to llm with reason has-entities for short query with entity', async () => {
    // "Berlin Schmidt" = two consecutive capitalised words → entity detected
    // 3 words → short, no generation keyword
    const { decision } = await decideGate({ query: 'frage Berlin Schmidt' });
    expect(decision.route).toBe('llm');
    expect(decision.reason).toBe('has-entities');
  });
});

// ---------------------------------------------------------------------------
// Branch coverage: long query (≥15 words, no keyword, no entity)
// ---------------------------------------------------------------------------

describe('decideGate — long query branch', () => {
  it('routes to llm with reason long for a 15-word lowercase query without keywords', async () => {
    const query = 'ein zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn vierzehn fünfzehn';
    const { decision } = await decideGate({ query });
    expect(decision.route).toBe('llm');
    expect(decision.reason).toBe('long');
  });
});

// ---------------------------------------------------------------------------
// Performance: decision < 50ms
// ---------------------------------------------------------------------------

describe('decideGate — performance', () => {
  it('resolves in under 50ms', async () => {
    const start = performance.now();
    await decideGate({ query: 'Erkläre mir TypeScript-Types ausführlich' });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('returns durationMs in complexity score', async () => {
    const { complexity } = await decideGate({ query: 'test query' });
    expect(complexity.durationMs).toBeGreaterThanOrEqual(0);
    expect(complexity.durationMs).toBeLessThan(50);
  });
});
