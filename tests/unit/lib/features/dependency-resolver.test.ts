// =============================================================================
// Dependency Resolver — Unit Tests (Pattern P2.3)
// Coverage-Ziel: 100 % Branch auf src/lib/features/dependency-resolver.ts
// =============================================================================

import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock-Registry: alle Strategien + rekursive Abhaengigkeiten abgedeckt
//
// Struktur:
//   root-a  (cascade-off, keine deps)
//     ├─ child-b  (cascade-off, deps: [root-a])
//     │    └─ grandchild-e  (cascade-off, deps: [child-b])
//     ├─ child-c  (warn-and-allow, deps: [root-a])
//     └─ child-d  (block, deps: [root-a])
//
//   parent-w  (warn-and-allow, keine deps)
//     └─ dep-on-w  (cascade-off, deps: [parent-w])
//
//   parent-blk  (block, keine deps)
//     └─ dep-on-blk  (cascade-off, deps: [parent-blk])
// ---------------------------------------------------------------------------

vi.mock('@/lib/features/feature-registry', () => {
  const registry = [
    { id: 'root-a',      label: 'Root A',       description: '', defaultEnabled: true,  userToggleable: true, orgToggleable: true, deps: [],          toggleStrategy: 'cascade-off'   },
    { id: 'child-b',     label: 'Child B',      description: '', defaultEnabled: true,  userToggleable: true, orgToggleable: true, deps: ['root-a'],   toggleStrategy: 'cascade-off'   },
    { id: 'child-c',     label: 'Child C',      description: '', defaultEnabled: true,  userToggleable: true, orgToggleable: true, deps: ['root-a'],   toggleStrategy: 'warn-and-allow' },
    { id: 'child-d',     label: 'Child D',      description: '', defaultEnabled: true,  userToggleable: true, orgToggleable: true, deps: ['root-a'],   toggleStrategy: 'block'         },
    { id: 'grandchild-e',label: 'Grandchild E', description: '', defaultEnabled: true,  userToggleable: true, orgToggleable: true, deps: ['child-b'],  toggleStrategy: 'cascade-off'   },
    { id: 'parent-w',    label: 'Parent W',     description: '', defaultEnabled: true,  userToggleable: true, orgToggleable: true, deps: [],          toggleStrategy: 'warn-and-allow' },
    { id: 'dep-on-w',    label: 'Dep on W',     description: '', defaultEnabled: true,  userToggleable: true, orgToggleable: true, deps: ['parent-w'], toggleStrategy: 'cascade-off'   },
    { id: 'parent-blk',  label: 'Parent Blk',   description: '', defaultEnabled: false, userToggleable: true, orgToggleable: true, deps: [],          toggleStrategy: 'block'         },
    { id: 'dep-on-blk',  label: 'Dep on Blk',   description: '', defaultEnabled: false, userToggleable: true, orgToggleable: true, deps: ['parent-blk'], toggleStrategy: 'cascade-off' },
  ] as const;

  return {
    FEATURE_REGISTRY: registry,
    getFeature: (id: string) => {
      const f = (registry as readonly { id: string }[]).find((r) => r.id === id);
      if (!f) throw new Error(`Unknown feature: ${id}`);
      return f;
    },
  };
});

import { resolveToggle, findDependents } from '@/lib/features/dependency-resolver';
import type { FeatureId } from '@/lib/features/types';

// ---------------------------------------------------------------------------
// Helper: baut einen vollstaendigen Prefs-Record
// ---------------------------------------------------------------------------

const ALL_IDS = ['root-a', 'child-b', 'child-c', 'child-d', 'grandchild-e', 'parent-w', 'dep-on-w', 'parent-blk', 'dep-on-blk'] as const;

function makePrefs(active: string[]): Record<FeatureId, boolean> {
  return Object.fromEntries(
    ALL_IDS.map((id) => [id, active.includes(id)])
  ) as Record<FeatureId, boolean>;
}

// ---------------------------------------------------------------------------
// findDependents
// ---------------------------------------------------------------------------

describe('findDependents', () => {
  it('returns empty array when nothing depends on target', () => {
    const result = findDependents('root-a' as FeatureId, makePrefs([]));
    expect(result).toEqual([]);
  });

  it('returns direct active dependents', () => {
    const result = findDependents('root-a' as FeatureId, makePrefs(['child-b']));
    expect(result).toContain('child-b');
    expect(result).not.toContain('child-c');
  });

  it('returns multiple direct active dependents', () => {
    const result = findDependents('root-a' as FeatureId, makePrefs(['child-b', 'child-c', 'child-d']));
    expect(result).toContain('child-b');
    expect(result).toContain('child-c');
    expect(result).toContain('child-d');
  });

  it('returns indirect active dependents recursively (root-a -> child-b -> grandchild-e)', () => {
    const result = findDependents('root-a' as FeatureId, makePrefs(['child-b', 'grandchild-e']));
    expect(result).toContain('child-b');
    expect(result).toContain('grandchild-e');
  });

  it('traverses through inactive intermediate nodes to find active children', () => {
    // child-b inactive, grandchild-e active (dep chain: grandchild-e -> child-b -> root-a)
    const result = findDependents('root-a' as FeatureId, makePrefs(['grandchild-e']));
    expect(result).toContain('grandchild-e');
    expect(result).not.toContain('child-b');
  });

  it('returns empty when all dependents are inactive', () => {
    const result = findDependents('root-a' as FeatureId, makePrefs([]));
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// resolveToggle — Aktivieren (desired === true)
// ---------------------------------------------------------------------------

describe('resolveToggle — activate', () => {
  it('allow: feature has no deps', () => {
    const action = resolveToggle({
      featureId: 'root-a' as FeatureId,
      desired: true,
      currentPrefs: makePrefs([]),
    });
    expect(action.kind).toBe('allow');
  });

  it('allow: all deps are active', () => {
    const action = resolveToggle({
      featureId: 'child-b' as FeatureId,
      desired: true,
      currentPrefs: makePrefs(['root-a']),
    });
    expect(action.kind).toBe('allow');
  });

  it('blocked: dep is inactive', () => {
    const action = resolveToggle({
      featureId: 'child-b' as FeatureId,
      desired: true,
      currentPrefs: makePrefs([]),
    });
    expect(action.kind).toBe('blocked');
    if (action.kind === 'blocked') {
      expect(action.blockerIds).toContain('root-a');
    }
  });

  it('blocked: includes only the missing dep (not satisfied ones)', () => {
    // dep-on-blk needs parent-blk; parent-blk inactive
    const action = resolveToggle({
      featureId: 'dep-on-blk' as FeatureId,
      desired: true,
      currentPrefs: makePrefs([]),
    });
    expect(action.kind).toBe('blocked');
    if (action.kind === 'blocked') {
      expect(action.blockerIds).toContain('parent-blk');
      expect(action.blockerIds).not.toContain('dep-on-blk');
    }
  });
});

// ---------------------------------------------------------------------------
// resolveToggle — Deaktivieren (desired === false)
// ---------------------------------------------------------------------------

describe('resolveToggle — deactivate: allow (no active dependents)', () => {
  it('allow: no features depend on target', () => {
    const action = resolveToggle({
      featureId: 'child-d' as FeatureId,
      desired: false,
      currentPrefs: makePrefs([]),
    });
    expect(action.kind).toBe('allow');
  });

  it('allow: dependents exist but are all inactive', () => {
    const action = resolveToggle({
      featureId: 'root-a' as FeatureId,
      desired: false,
      currentPrefs: makePrefs([]),
    });
    expect(action.kind).toBe('allow');
  });
});

describe('resolveToggle — deactivate: cascade-off strategy', () => {
  it('cascade-off: returns cascade-off with active dependents', () => {
    const action = resolveToggle({
      featureId: 'root-a' as FeatureId,
      desired: false,
      currentPrefs: makePrefs(['child-b']),
    });
    expect(action.kind).toBe('cascade-off');
    if (action.kind === 'cascade-off') {
      expect(action.cascadeIds).toContain('child-b');
    }
  });

  it('cascade-off: includes all active direct dependents', () => {
    const action = resolveToggle({
      featureId: 'root-a' as FeatureId,
      desired: false,
      currentPrefs: makePrefs(['child-b', 'child-c', 'child-d']),
    });
    expect(action.kind).toBe('cascade-off');
    if (action.kind === 'cascade-off') {
      expect(action.cascadeIds).toContain('child-b');
      expect(action.cascadeIds).toContain('child-c');
      expect(action.cascadeIds).toContain('child-d');
    }
  });

  it('cascade-off: recursive — A -> B -> E all included', () => {
    const action = resolveToggle({
      featureId: 'root-a' as FeatureId,
      desired: false,
      currentPrefs: makePrefs(['child-b', 'grandchild-e']),
    });
    expect(action.kind).toBe('cascade-off');
    if (action.kind === 'cascade-off') {
      expect(action.cascadeIds).toContain('child-b');
      expect(action.cascadeIds).toContain('grandchild-e');
    }
  });

  it('cascade-off: recursive mixed — inactive intermediate, active grandchild', () => {
    // child-b inactive, grandchild-e active
    const action = resolveToggle({
      featureId: 'root-a' as FeatureId,
      desired: false,
      currentPrefs: makePrefs(['grandchild-e']),
    });
    expect(action.kind).toBe('cascade-off');
    if (action.kind === 'cascade-off') {
      expect(action.cascadeIds).toContain('grandchild-e');
      expect(action.cascadeIds).not.toContain('child-b');
    }
  });
});

describe('resolveToggle — deactivate: warn-and-allow strategy', () => {
  it('warn: returns warn with active dependents (parent-w strategy = warn-and-allow)', () => {
    const action = resolveToggle({
      featureId: 'parent-w' as FeatureId,
      desired: false,
      currentPrefs: makePrefs(['dep-on-w']),
    });
    expect(action.kind).toBe('warn');
    if (action.kind === 'warn') {
      expect(action.warnIds).toContain('dep-on-w');
    }
  });

  it('warn: allow when no active dependents (warn-and-allow feature with 0 dependents)', () => {
    const action = resolveToggle({
      featureId: 'parent-w' as FeatureId,
      desired: false,
      currentPrefs: makePrefs([]),
    });
    expect(action.kind).toBe('allow');
  });
});

describe('resolveToggle — deactivate: block strategy', () => {
  it('blocked: returns blocked with active dependents (parent-blk strategy = block)', () => {
    const action = resolveToggle({
      featureId: 'parent-blk' as FeatureId,
      desired: false,
      currentPrefs: makePrefs(['dep-on-blk']),
    });
    expect(action.kind).toBe('blocked');
    if (action.kind === 'blocked') {
      expect(action.blockerIds).toContain('dep-on-blk');
    }
  });

  it('blocked: allow when no active dependents (block feature with 0 active dependents)', () => {
    const action = resolveToggle({
      featureId: 'parent-blk' as FeatureId,
      desired: false,
      currentPrefs: makePrefs([]),
    });
    expect(action.kind).toBe('allow');
  });
});

// ---------------------------------------------------------------------------
// Mixed-Strategy Szenario: A (cascade-off) -> B (cascade-off) + F (block)
// Wenn A deaktiviert wird (cascade-off) und B+F aktiv sind:
// => cascade-off (Strategie von A entscheidet, nicht B oder F)
// ---------------------------------------------------------------------------

describe('resolveToggle — mixed-strategy scenario', () => {
  it('strategy of the TOGGLED feature governs, not dependents strategies', () => {
    // root-a (cascade-off) has active dependents child-b (cascade-off) AND child-d (block)
    // => cascade-off wins because root-a has cascade-off
    const action = resolveToggle({
      featureId: 'root-a' as FeatureId,
      desired: false,
      currentPrefs: makePrefs(['child-b', 'child-d']),
    });
    expect(action.kind).toBe('cascade-off');
  });

  it('warn-strategy feature with mixed active dependents still returns warn', () => {
    // parent-w (warn-and-allow) with dep-on-w active => warn
    const action = resolveToggle({
      featureId: 'parent-w' as FeatureId,
      desired: false,
      currentPrefs: makePrefs(['dep-on-w']),
    });
    expect(action.kind).toBe('warn');
  });
});
