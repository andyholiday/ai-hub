// =============================================================================
// Feature Registry — Types
// Single Source of Truth fuer alle Feature-Toggle-Typen (Pattern P2.1)
// =============================================================================

/**
 * Alle bekannten Feature-IDs der App.
 * Erweiterbar: neue ID hier eintragen + Eintrag in FEATURE_REGISTRY ergaenzen.
 */
export type FeatureId =
  | 'forum'
  | 'leaderboard'
  | 'ai-mentor'
  | 'living-orb'
  | 'proactive-orb-bubble'
  | 'innovation-radar'
  | 'learn-hub'
  | 'privacy-mode'
  | 'community-posts'
  | 'best-practices'
  | 'gamification'
  | 'hybrid-search';

/**
 * Strategie beim Deaktivieren eines Features.
 * cascade-off   — Abhaengige Features werden mitdeaktiviert.
 * warn-and-allow — Warning, aber User kann trotzdem deaktivieren.
 * block          — Toggle gesperrt, solange ein abhaengiges Feature aktiv ist.
 */
export type ToggleStrategy = 'cascade-off' | 'warn-and-allow' | 'block';

/** Vollstaendige Konfiguration eines Feature-Toggles. */
export interface FeatureConfig {
  /** Eindeutige, stabile ID — entspricht dem DB-Flag-Key. */
  readonly id: FeatureId;
  /** Kurzbezeichnung fuer die Settings-UI. */
  readonly label: string;
  /** Ein-Satz-Beschreibung fuer die Settings-UI. */
  readonly description: string;
  /** Standardmaessig aktiv (vor user/org-Override). */
  readonly defaultEnabled: boolean;
  /** Ob einzelne User das Feature selbst umschalten koennen. */
  readonly userToggleable: boolean;
  /** Ob Org-Admins das Feature organisationsweit umschalten koennen. */
  readonly orgToggleable: boolean;
  /** Features, auf die dieses Feature angewiesen ist. */
  readonly deps: readonly FeatureId[];
  /** Verhalten beim Deaktivieren (Pattern P2.3 Dependency-Graph). */
  readonly toggleStrategy: ToggleStrategy;
}
