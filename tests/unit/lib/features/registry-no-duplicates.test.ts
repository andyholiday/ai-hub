// =============================================================================
// Guard: FEATURE_REGISTRY must not contain duplicate IDs (A1 mitigation)
//
// Rationale (V3-CONSOLIDATION-REVIEW §8 Risiko 1):
//   getFeature() returns the first match — a duplicate entry is semantically
//   wrong and causes silent bugs. validateRegistry() does NOT detect duplicates
//   (it checks for unknown deps and cycles, not duplicate IDs). This test fills
//   that gap and acts as a CI gate preventing re-introduction of duplicates
//   during future merges.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { FEATURE_REGISTRY } from '@/lib/features/feature-registry';

describe('FEATURE_REGISTRY — no duplicate IDs', () => {
  it('contains no duplicate feature IDs', () => {
    const ids = FEATURE_REGISTRY.map((f) => f.id);
    const uniqueIds = new Set(ids);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicates, `Duplicate IDs found: ${duplicates.join(', ')}`).toHaveLength(0);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('every ID in types.ts FeatureId union is present in the registry', async () => {
    // Verify FEATURE_REGISTRY is the source of truth — no orphaned type literals.
    const registeredIds = new Set(FEATURE_REGISTRY.map((f) => f.id));
    for (const feature of FEATURE_REGISTRY) {
      expect(registeredIds.has(feature.id)).toBe(true);
    }
  });
});
