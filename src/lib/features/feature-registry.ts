// =============================================================================
// Feature Registry — Single Source of Truth (Pattern P2.1)
// Alle Feature-Toggle-Konfigurationen der App.
//
// Discovery-Quellen:
//   src/components/features/        — ai-orb, ai-mentor, gamification,
//                                     innovation-radar, learn-hub, leaderboard
//   src/app/(dashboard)/            — best-practices, community, leaderboard,
//                                     learn-hub, innovation-radar
//   supabase/migrations/00002_feature_flags.sql — ai-mentor, ai-orb, gamification
//
// Erweiterung: neue FeatureId in types.ts + neuen Eintrag hier.
// =============================================================================

import type { FeatureConfig, FeatureId } from './types';

export const FEATURE_REGISTRY: readonly FeatureConfig[] = [
  {
    id: 'gamification',
    label: 'Gamification',
    description: 'XP-System, Levels und Badges fuer Community-Aktivitaeten.',
    defaultEnabled: true,
    userToggleable: false,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'cascade-off',
  },
  {
    id: 'forum',
    label: 'Forum / Community-Posts',
    description: 'Diskussionsforum und Community-Beitraege.',
    defaultEnabled: true,
    userToggleable: false,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'block',
  },
  {
    id: 'community-posts',
    label: 'Community-Posts (Ideen)',
    description: 'Ideeneinreichung und Kommentare im Community-Bereich.',
    defaultEnabled: true,
    userToggleable: false,
    orgToggleable: true,
    deps: ['forum'],
    toggleStrategy: 'cascade-off',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    description: 'Rangliste der aktivsten Mitglieder nach XP.',
    defaultEnabled: true,
    userToggleable: true,
    orgToggleable: true,
    deps: ['gamification'],
    toggleStrategy: 'cascade-off',
  },
  {
    id: 'ai-mentor',
    label: 'AI Mentor',
    description: 'KI-Chat-Assistent fuer alle Nutzer.',
    defaultEnabled: true,
    userToggleable: true,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'block',
  },
  {
    id: 'living-orb',
    label: 'Living Orb (Floating Assistant)',
    description: 'Persistenter KI-Begleiter auf allen Seiten.',
    defaultEnabled: true,
    userToggleable: true,
    orgToggleable: true,
    deps: ['ai-mentor'],
    toggleStrategy: 'warn-and-allow',
  },
  {
    id: 'innovation-radar',
    label: 'Innovation Radar',
    description: 'Trending-Themen und Technologie-Radar fuer die Community.',
    defaultEnabled: true,
    userToggleable: false,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'block',
  },
  {
    id: 'learn-hub',
    label: 'Learn Hub',
    description: 'Lernpfade und Kurse fuer die Community.',
    defaultEnabled: true,
    userToggleable: true,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'block',
  },
  {
    id: 'best-practices',
    label: 'Best Practices',
    description: 'Kuratierte Best-Practice-Artikel mit semantischer Suche.',
    defaultEnabled: true,
    userToggleable: false,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'block',
  },
  {
    id: 'proactive-orb-bubble',
    label: 'Proaktive Orb-Bubble',
    description: 'Regelbasierte Bubble-Hinweise im Living Orb (max 1/Session)',
    defaultEnabled: false,
    userToggleable: true,
    orgToggleable: true,
    deps: ['living-orb'],
    toggleStrategy: 'cascade-off',
  },
  {
    id: 'privacy-mode',
    label: 'Privacy Mode',
    description: 'Lokale Embeddings + EU-Bedrock statt Cloud-LLM (DSGVO-by-default).',
    defaultEnabled: false,
    userToggleable: true,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'warn-and-allow',
  },
  {
    id: 'hybrid-search',
    label: 'Hybrid Search (Postgres-Native)',
    description: 'BM25 + Vektor-Suche fusioniert in Supabase Postgres (ADR-014)',
    defaultEnabled: false,
    userToggleable: true,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'block',
  },
] as const;

// ---------------------------------------------------------------------------
// Helper: getFeature
// ---------------------------------------------------------------------------

/**
 * Gibt die FeatureConfig fuer eine bekannte ID zurueck.
 * Wirft einen Error wenn die ID nicht in der Registry existiert — fail-fast.
 */
export function getFeature(id: FeatureId): FeatureConfig {
  const feature = FEATURE_REGISTRY.find((f) => f.id === id);
  if (!feature) {
    throw new Error(`[feature-registry] Unknown feature ID: "${id}"`);
  }
  return feature;
}

// ---------------------------------------------------------------------------
// Helper: validateRegistry (DAG-Validierung via Kahn's Algorithm)
// ---------------------------------------------------------------------------

/**
 * Validiert eine Registry auf:
 *  1. Keine unbekannten Dep-IDs
 *  2. Keine Zyklen im Dependency-Graph (topological sort via Kahn)
 *
 * Wirft bei jedem Fehler — wird beim Modul-Import fail-fast aufgerufen.
 * Akzeptiert die Registry als Parameter, damit Tests Mock-Registries uebergeben koennen.
 */
export function validateRegistry(registry: readonly FeatureConfig[]): void {
  const knownIds = new Set(registry.map((f) => f.id));

  // 1. Alle Dep-IDs muessen bekannte Feature-IDs sein
  for (const feature of registry) {
    for (const dep of feature.deps) {
      if (!knownIds.has(dep)) {
        throw new Error(
          `[feature-registry] Feature "${feature.id}" has unknown dependency: "${dep}"`
        );
      }
    }
  }

  // 2. Kahn's topological sort — wirft bei Zyklus
  // Alle Knoten vorab initialisieren, um ?? -Fallbacks (und nicht testbare
  // implizite V8-Branches) zu vermeiden.
  const inDegree = new Map<string, number>(registry.map((f) => [f.id, 0]));
  const adjacency = new Map<string, string[]>(registry.map((f) => [f.id, []]));

  for (const feature of registry) {
    for (const dep of feature.deps) {
      // Kante: dep → feature (feature haengt von dep ab)
      // Fuer topological sort: Kante zeigt von dep zu feature
      (adjacency.get(dep) as string[]).push(feature.id);
      inDegree.set(feature.id, (inDegree.get(feature.id) as number) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  let processed = 0;
  while (queue.length > 0) {
    const current = queue.shift() as string;
    processed++;
    for (const neighbor of adjacency.get(current) as string[]) {
      const newDegree = (inDegree.get(neighbor) as number) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (processed !== registry.length) {
    throw new Error(
      '[feature-registry] Cycle detected in feature dependency graph'
    );
  }
}

// ---------------------------------------------------------------------------
// Fail-fast beim Modul-Import
// ---------------------------------------------------------------------------
validateRegistry(FEATURE_REGISTRY);
