// =============================================================================
// Tests: Complexity Classifier
// =============================================================================

import { describe, it, expect } from 'vitest';
import { analyzeComplexity, GENERATION_KEYWORDS } from '@/lib/ai/gate/complexity-classifier';

describe('analyzeComplexity', () => {
  // Short queries without keywords or entities → local candidates
  it('counts words correctly for short query', () => {
    const result = analyzeComplexity('Hallo wie geht es');
    expect(result.wordCount).toBe(4);
  });

  it('returns 0 wordCount for empty string', () => {
    const result = analyzeComplexity('');
    expect(result.wordCount).toBe(0);
  });

  it('detects no keyword in simple greeting', () => {
    const result = analyzeComplexity('Hallo');
    expect(result.hasGenerationKeyword).toBe(false);
  });

  it('detects no entities in all-lowercase query', () => {
    const result = analyzeComplexity('wo finde ich die settings');
    expect(result.hasEntities).toBe(false);
  });

  it('handles extra whitespace in word count', () => {
    const result = analyzeComplexity('  Hallo   Welt  ');
    expect(result.wordCount).toBe(2);
  });

  // Generation keywords
  it('detects "erkläre" keyword', () => {
    const result = analyzeComplexity('Erkläre mir TypeScript');
    expect(result.hasGenerationKeyword).toBe(true);
  });

  it('detects "generiere" keyword', () => {
    const result = analyzeComplexity('Generiere ein Beispiel');
    expect(result.hasGenerationKeyword).toBe(true);
  });

  it('detects "was ist" keyword', () => {
    const result = analyzeComplexity('Was ist ein Hook in React');
    expect(result.hasGenerationKeyword).toBe(true);
  });

  // Entity detection
  it('detects two capitalised consecutive words as entity', () => {
    const result = analyzeComplexity('Frage zu Berlin Schmidt');
    expect(result.hasEntities).toBe(true);
  });

  it('does not flag single capitalised word at sentence start as entity', () => {
    const result = analyzeComplexity('TypeScript ist toll');
    expect(result.hasEntities).toBe(false);
  });

  // Performance: < 5ms
  it('runs in under 5ms', () => {
    const start = performance.now();
    analyzeComplexity('test query with some words in it');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });
});

describe('GENERATION_KEYWORDS', () => {
  it('exports a non-empty array', () => {
    expect(GENERATION_KEYWORDS.length).toBeGreaterThan(0);
  });
});
