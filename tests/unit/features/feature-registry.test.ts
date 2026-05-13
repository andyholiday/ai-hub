// =============================================================================
// Feature Registry — Unit Tests
// Tests fuer: src/lib/features/feature-registry.ts
// Coverage-Ziel: >= 90 % auf src/lib/features/
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  FEATURE_REGISTRY,
  getFeature,
  validateRegistry,
} from '@/lib/features/feature-registry';
import type { FeatureConfig, FeatureId } from '@/lib/features/types';

// ---------------------------------------------------------------------------
// 1. validateRegistry() auf der echten Registry
// ---------------------------------------------------------------------------
describe('validateRegistry — echte Registry', () => {
  it('laeuft ohne Fehler', () => {
    expect(() => validateRegistry(FEATURE_REGISTRY)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. getFeature — Happy Path
// ---------------------------------------------------------------------------
describe('getFeature — Happy Path', () => {
  it('gibt FeatureConfig fuer existierende ID zurueck', () => {
    const feature = getFeature('forum');
    expect(feature.id).toBe('forum');
    expect(typeof feature.label).toBe('string');
    expect(feature.label.length).toBeGreaterThan(0);
    expect(typeof feature.description).toBe('string');
    expect(typeof feature.defaultEnabled).toBe('boolean');
    expect(typeof feature.userToggleable).toBe('boolean');
    expect(typeof feature.orgToggleable).toBe('boolean');
    expect(Array.isArray(feature.deps)).toBe(true);
    expect(['cascade-off', 'warn-and-allow', 'block']).toContain(
      feature.toggleStrategy
    );
  });
});

// ---------------------------------------------------------------------------
// 3. getFeature — unbekannte ID wirft Error
// ---------------------------------------------------------------------------
describe('getFeature — unbekannte ID', () => {
  it('wirft bei unbekannter ID', () => {
    expect(() =>
      // @ts-expect-error — absichtlich ungueltige ID testen
      getFeature('nonexistent')
    ).toThrow();
  });

  it('Error-Message enthaelt die unbekannte ID', () => {
    expect(() =>
      // @ts-expect-error
      getFeature('totally-unknown-feature')
    ).toThrow('totally-unknown-feature');
  });
});

// ---------------------------------------------------------------------------
// 4. Zyklus-Detection in validateRegistry
// ---------------------------------------------------------------------------
describe('validateRegistry — Zyklus-Detection', () => {
  it('wirft bei direktem Zyklus A → B → A', () => {
    const mockRegistry: FeatureConfig[] = [
      {
        id: 'feature-a' as FeatureId,
        label: 'Feature A',
        description: 'Test A',
        defaultEnabled: true,
        userToggleable: true,
        orgToggleable: true,
        deps: ['feature-b' as FeatureId],
        toggleStrategy: 'block',
      },
      {
        id: 'feature-b' as FeatureId,
        label: 'Feature B',
        description: 'Test B',
        defaultEnabled: true,
        userToggleable: true,
        orgToggleable: true,
        deps: ['feature-a' as FeatureId],
        toggleStrategy: 'block',
      },
    ];

    expect(() => validateRegistry(mockRegistry)).toThrow(/cycle/i);
  });

  it('wirft bei indirektem Zyklus A → B → C → A', () => {
    const mockRegistry: FeatureConfig[] = [
      {
        id: 'fa' as FeatureId,
        label: 'A',
        description: '',
        defaultEnabled: true,
        userToggleable: false,
        orgToggleable: false,
        deps: ['fb' as FeatureId],
        toggleStrategy: 'cascade-off',
      },
      {
        id: 'fb' as FeatureId,
        label: 'B',
        description: '',
        defaultEnabled: true,
        userToggleable: false,
        orgToggleable: false,
        deps: ['fc' as FeatureId],
        toggleStrategy: 'cascade-off',
      },
      {
        id: 'fc' as FeatureId,
        label: 'C',
        description: '',
        defaultEnabled: true,
        userToggleable: false,
        orgToggleable: false,
        deps: ['fa' as FeatureId],
        toggleStrategy: 'cascade-off',
      },
    ];

    expect(() => validateRegistry(mockRegistry)).toThrow(/cycle/i);
  });
});

// ---------------------------------------------------------------------------
// 5. Unbekannte Dep-ID in validateRegistry
// ---------------------------------------------------------------------------
describe('validateRegistry — unbekannte Dep-ID', () => {
  it('wirft wenn ein Feature eine nicht-existierende Dep-ID hat', () => {
    const mockRegistry: FeatureConfig[] = [
      {
        id: 'feature-x' as FeatureId,
        label: 'X',
        description: '',
        defaultEnabled: false,
        userToggleable: true,
        orgToggleable: true,
        deps: ['does-not-exist' as FeatureId],
        toggleStrategy: 'warn-and-allow',
      },
    ];

    expect(() => validateRegistry(mockRegistry)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 5b. validateRegistry — valide Registry mit Abhaengigkeiten (Branch-Coverage)
// ---------------------------------------------------------------------------
describe('validateRegistry — valide Registry mit Abhaengigkeiten', () => {
  it('akzeptiert einen validen DAG mit mehrfach genutzter Dep (deckt inDegree > 0 nach Dekrement ab)', () => {
    // Diamond-Graph: shared-base ← dep-a, shared-base ← dep-b, dep-a ← top, dep-b ← top
    // Wenn top verarbeitet wird, dekrementiert dep-a und dep-b — aber beide haben
    // noch inDegree 1 (von shared-base abhaengig), also bleibt newDegree > 0 nach
    // erstem Dekrement. Das deckt den if(newDegree === 0) false-Zweig ab.
    const mockRegistry: FeatureConfig[] = [
      {
        id: 'shared-base' as FeatureId,
        label: 'Shared Base',
        description: '',
        defaultEnabled: true,
        userToggleable: false,
        orgToggleable: false,
        deps: [],
        toggleStrategy: 'block',
      },
      {
        id: 'dep-a' as FeatureId,
        label: 'Dep A',
        description: '',
        defaultEnabled: true,
        userToggleable: false,
        orgToggleable: false,
        deps: ['shared-base' as FeatureId],
        toggleStrategy: 'cascade-off',
      },
      {
        id: 'dep-b' as FeatureId,
        label: 'Dep B',
        description: '',
        defaultEnabled: true,
        userToggleable: false,
        orgToggleable: false,
        deps: ['shared-base' as FeatureId],
        toggleStrategy: 'cascade-off',
      },
      // top haengt von BEIDEN dep-a und dep-b ab — inDegree 2
      // Beim Verarbeiten von dep-a: newDegree = 1 (noch nicht bereit)
      // Beim Verarbeiten von dep-b: newDegree = 0 (jetzt bereit)
      {
        id: 'top' as FeatureId,
        label: 'Top',
        description: '',
        defaultEnabled: false,
        userToggleable: true,
        orgToggleable: false,
        deps: ['dep-a' as FeatureId, 'dep-b' as FeatureId],
        toggleStrategy: 'warn-and-allow',
      },
    ];

    expect(() => validateRegistry(mockRegistry)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 6. Alle Features haben unique IDs
// ---------------------------------------------------------------------------
describe('FEATURE_REGISTRY — Invarianten', () => {
  it('alle Feature-IDs sind eindeutig', () => {
    const ids = FEATURE_REGISTRY.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // ---------------------------------------------------------------------------
  // 7. Boolean-Felder sind tatsaechlich booleans
  // ---------------------------------------------------------------------------
  it('defaultEnabled, userToggleable, orgToggleable sind alle boolean', () => {
    for (const feature of FEATURE_REGISTRY) {
      expect(typeof feature.defaultEnabled).toBe('boolean');
      expect(typeof feature.userToggleable).toBe('boolean');
      expect(typeof feature.orgToggleable).toBe('boolean');
    }
  });

  it('alle toggleStrategy-Werte sind valide', () => {
    const validStrategies = ['cascade-off', 'warn-and-allow', 'block'];
    for (const feature of FEATURE_REGISTRY) {
      expect(validStrategies).toContain(feature.toggleStrategy);
    }
  });

  it('alle dep-IDs referenzieren existierende Features', () => {
    const knownIds = new Set(FEATURE_REGISTRY.map((f) => f.id));
    for (const feature of FEATURE_REGISTRY) {
      for (const dep of feature.deps) {
        expect(knownIds.has(dep)).toBe(true);
      }
    }
  });
});
