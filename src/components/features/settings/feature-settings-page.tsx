// =============================================================================
// FeatureSettingsPage — Server Component (Pattern P2.2)
// Loads user prefs, renders FeatureToggle for each user-toggleable feature.
// =============================================================================

import { FEATURE_REGISTRY } from '@/lib/features/feature-registry';
import { getUserFeaturePrefs } from '@/lib/features/user-prefs';
import { FeatureToggle } from './feature-toggle';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeatureSettingsPageProps {
  userId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function FeatureSettingsPage({ userId }: FeatureSettingsPageProps) {
  const prefs = await getUserFeaturePrefs(userId);

  const toggleableFeatures = FEATURE_REGISTRY.filter(
    (f) => f.userToggleable,
  );

  return (
    <section aria-labelledby="feature-settings-heading">
      <h2
        id="feature-settings-heading"
        className="font-heading text-body-lg font-semibold text-surface-900"
      >
        Features
      </h2>
      <p className="mt-1 text-body-sm text-surface-500">
        Aktiviere oder deaktiviere Features fuer deinen Account.
      </p>

      {toggleableFeatures.length === 0 ? (
        <p className="mt-4 text-body-sm text-surface-400">
          Keine konfigurierbaren Features verfuegbar.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-surface-100">
          {toggleableFeatures.map((feature) => (
            <FeatureToggle
              key={feature.id}
              feature={feature}
              initialEnabled={prefs[feature.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
