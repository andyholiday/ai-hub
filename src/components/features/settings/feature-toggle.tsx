'use client';

// =============================================================================
// FeatureToggle — Client Component (Pattern P2.2)
// Renders a single toggleable feature with useOptimistic for instant UI.
// =============================================================================

import { useOptimistic, useTransition } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { toggleFeaturePref } from '@/app/actions/feature-prefs';
import type { FeatureConfig } from '@/lib/features/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeatureToggleProps {
  feature: FeatureConfig;
  initialEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeatureToggle({ feature, initialEnabled }: FeatureToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticEnabled, setOptimisticEnabled] = useOptimistic(initialEnabled);

  function handleChange(nextEnabled: boolean) {
    startTransition(async () => {
      setOptimisticEnabled(nextEnabled);
      await toggleFeaturePref(feature.id, nextEnabled);
    });
  }

  const defaultBadge = feature.defaultEnabled ? 'Standard: an' : 'Standard: aus';

  return (
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
  );
}
