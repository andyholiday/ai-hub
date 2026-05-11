// =============================================================================
// Dependency Graph — Types (Pattern P2.3)
// ToggleAction-Discriminated-Union + ResolveInput fuer den dependency-resolver.
// =============================================================================

import type { FeatureId } from './types';

/**
 * Ergebnis der Resolver-Berechnung fuer einen Toggle-Versuch.
 * Die vier Varianten entsprechen den drei Toggle-Strategien plus dem
 * einfachen "kein Eingriff notwendig"-Fall.
 */
export type ToggleAction =
  | { kind: 'allow' }
  | { kind: 'cascade-off'; cascadeIds: FeatureId[] }
  | { kind: 'warn'; warnIds: FeatureId[] }
  | { kind: 'blocked'; blockerIds: FeatureId[] };

/** Input fuer resolveToggle. */
export type ResolveInput = {
  featureId: FeatureId;
  /** Gewuenschter neuer Zustand (true = aktivieren, false = deaktivieren). */
  desired: boolean;
  /** Aktuelle Toggle-States aller Features. */
  currentPrefs: Record<FeatureId, boolean>;
};
