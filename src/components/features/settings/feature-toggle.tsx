'use client';

// =============================================================================
// FeatureToggle — Client Component (Pattern P2.2 + P2.3)
// Renders a single toggleable feature with useOptimistic for instant UI.
// P2.3: resolveToggle pre-check + DependencyWarningSheet vor Server-Action-Call.
//
// Pattern P2.2 — User-Settings-UX
// useOptimistic kommt aus React 18.3 ('react'-Subpath, nicht 'react/experimental').
// Stabil ab React 19. Bei Phase-6-Upgrade auf React 19 verifizieren — kein API-Change erwartet.
// =============================================================================

import { useOptimistic, useTransition, useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { toggleFeaturePref } from '@/app/actions/feature-prefs';
import type { FeatureConfig, FeatureId } from '@/lib/features/types';
import { resolveToggle } from '@/lib/features/dependency-resolver';
import type { ToggleAction } from '@/lib/features/dependency-types';
import { DependencyWarningSheet } from './dependency-warning-sheet';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeatureToggleProps {
  feature: FeatureConfig;
  initialEnabled: boolean;
  /** Alle aktuellen Toggle-States (benoetigt fuer Dependency-Graph-Check P2.3). */
  allPrefs: Record<FeatureId, boolean>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeatureToggle({ feature, initialEnabled, allPrefs }: FeatureToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticEnabled, setOptimisticEnabled] = useOptimistic(initialEnabled);
  // P2.3: pendingAction haelt die ToggleAction falls ein Sheet gezeigt werden soll
  const [pendingAction, setPendingAction] = useState<
    Exclude<ToggleAction, { kind: 'allow' }> | null
  >(null);
  // P2.3: nextEnabled speichert den gewuenschten Zielzustand waehrend Sheet offen ist
  const [pendingNext, setPendingNext] = useState<boolean>(false);

  function handleChange(nextEnabled: boolean) {
    // P2.3 Pre-Check: Dependency-Graph konsultieren
    const action = resolveToggle({
      featureId: feature.id,
      desired: nextEnabled,
      currentPrefs: { ...allPrefs, [feature.id]: optimisticEnabled },
    });

    if (action.kind === 'allow') {
      // Direkter Path (existing behavior)
      startTransition(async () => {
        setOptimisticEnabled(nextEnabled);
        await toggleFeaturePref(feature.id, nextEnabled);
      });
      return;
    }

    // Sheet anzeigen
    setPendingNext(nextEnabled);
    setPendingAction(action);
  }

  function handleConfirm() {
    setPendingAction(null);

    startTransition(async () => {
      setOptimisticEnabled(pendingNext);

      // Bei cascade-off: Dependents zuerst deaktivieren, dann Hauptfeature
      if (pendingAction?.kind === 'cascade-off') {
        for (const depId of pendingAction.cascadeIds) {
          await toggleFeaturePref(depId, false);
        }
      }

      await toggleFeaturePref(feature.id, pendingNext);
    });
  }

  function handleCancel() {
    setPendingAction(null);
  }

  const defaultBadge = feature.defaultEnabled ? 'Standard: an' : 'Standard: aus';

  return (
    <>
      <div className="flex items-start justify-between gap-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body font-medium text-surface-900">
              {feature.label}
            </span>
            <span className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-caption text-surface-500">
              {defaultBadge}
            </span>
          </div>
          <p className="mt-0.5 text-body-sm text-surface-500">
            {feature.description}
          </p>
        </div>
        <Toggle
          checked={optimisticEnabled}
          onChange={handleChange}
          disabled={isPending}
          aria-label={`${feature.label} ${optimisticEnabled ? 'deaktivieren' : 'aktivieren'}`}
        />
      </div>

      {/* P2.3: DependencyWarningSheet — nur sichtbar wenn action pending */}
      {pendingAction !== null && (
        <DependencyWarningSheet
          action={pendingAction}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
