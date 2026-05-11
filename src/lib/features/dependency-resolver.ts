// =============================================================================
// Dependency Resolver (Pattern P2.3)
// Berechnet fuer jeden Toggle-Versuch die ToggleAction basierend auf dem
// Feature-Registry-Graph und der toggleStrategy des betroffenen Features.
//
// DAG-Garantie: validateRegistry() prueft Zyklen beim Import von
// feature-registry.ts — rekursive Traversierung ist daher sicher.
// =============================================================================

import { FEATURE_REGISTRY, getFeature } from './feature-registry';
import type { FeatureId } from './types';
import type { ResolveInput, ToggleAction } from './dependency-types';

// ---------------------------------------------------------------------------
// findDependents — alle direkten und indirekten Abhaengigen
// ---------------------------------------------------------------------------

/**
 * Gibt alle Features zurueck, die direkt ODER indirekt von `featureId`
 * abhaengen UND in `prefs` als aktiv markiert sind.
 *
 * Traversierung: BFS ueber den umgekehrten Dependency-Graph.
 * DAG-Garantie durch validateRegistry() bei Modul-Load — kein Zyklus-Schutz noetig.
 */
export function findDependents(
  featureId: FeatureId,
  prefs: Record<FeatureId, boolean>,
): FeatureId[] {
  const active: FeatureId[] = [];
  const visited = new Set<FeatureId>();
  const queue: FeatureId[] = [featureId];

  while (queue.length > 0) {
    const current = queue.shift() as FeatureId;

    for (const feature of FEATURE_REGISTRY) {
      if (visited.has(feature.id)) continue;
      if (!feature.deps.includes(current)) continue;

      visited.add(feature.id);

      if (prefs[feature.id]) {
        active.push(feature.id);
      }

      // Auch inaktive Knoten weitertraversieren (ihre Children koennen aktiv sein)
      queue.push(feature.id);
    }
  }

  return active;
}

// ---------------------------------------------------------------------------
// resolveToggle — Haupt-Resolver
// ---------------------------------------------------------------------------

/**
 * Berechnet die ToggleAction fuer einen gewuenschten Toggle-Zustandswechsel.
 *
 * Aktivieren (desired === true):
 *   - Alle direkten Deps aktiv? → allow
 *   - Sonst → blocked (fehlende Deps als blockerIds)
 *
 * Deaktivieren (desired === false):
 *   - Keine aktiven Dependents? → allow
 *   - Sonst: toggleStrategy des Features entscheidet:
 *     - cascade-off    → cascade-off mit allen aktiven Dependents (rekursiv)
 *     - warn-and-allow → warn mit allen aktiven Dependents
 *     - block          → blocked mit aktiven Dependents als blockerIds
 */
export function resolveToggle(input: ResolveInput): ToggleAction {
  const { featureId, desired, currentPrefs } = input;
  const feature = getFeature(featureId);

  if (desired) {
    // Aktivieren: pruefen ob alle direkten Deps aktiv sind
    const missingDeps = feature.deps.filter((dep) => !currentPrefs[dep]);

    if (missingDeps.length === 0) {
      return { kind: 'allow' };
    }

    return { kind: 'blocked', blockerIds: missingDeps };
  }

  // Deaktivieren: aktive Dependents ermitteln
  const activeDependents = findDependents(featureId, currentPrefs);

  if (activeDependents.length === 0) {
    return { kind: 'allow' };
  }

  const strategy = feature.toggleStrategy;

  if (strategy === 'cascade-off') {
    return { kind: 'cascade-off', cascadeIds: activeDependents };
  }

  if (strategy === 'warn-and-allow') {
    return { kind: 'warn', warnIds: activeDependents };
  }

  // strategy === 'block'
  return { kind: 'blocked', blockerIds: activeDependents };
}
