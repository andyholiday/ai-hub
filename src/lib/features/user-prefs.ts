// =============================================================================
// User Feature Preferences — Server-side Read/Write (Pattern P2.2)
// Loads and persists per-user feature toggle overrides from user_feature_prefs.
// DB table created in supabase/migrations/00023_user_feature_prefs.sql
//
// Uses the admin client (createClient from @supabase/supabase-js) because:
//  - This module is server-only and only called after auth is verified.
//  - @supabase/ssr v0.5.2 has a type-inference issue with large Database types.
//  - userId is always validated by the calling Server Action before reaching here.
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin';
import { FEATURE_REGISTRY, getFeature } from './feature-registry';
import type { FeatureId } from './types';

// ---------------------------------------------------------------------------
// getUserFeaturePrefs
// ---------------------------------------------------------------------------

/**
 * Returns the effective enabled-state for every feature.
 * DB row wins over defaultEnabled from the registry.
 * Unknown feature IDs from the DB are silently skipped.
 */
export async function getUserFeaturePrefs(
  userId: string,
): Promise<Record<FeatureId, boolean>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('user_feature_prefs')
    .select('feature_id, is_enabled')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`[user-prefs] Failed to load prefs: ${error.message}`);
  }

  // Start from registry defaults
  const result = Object.fromEntries(
    FEATURE_REGISTRY.map((f) => [f.id, f.defaultEnabled]),
  ) as Record<FeatureId, boolean>;

  // Overlay DB rows
  for (const row of data ?? []) {
    const featureId = row.feature_id as FeatureId;
    if (featureId in result) {
      result[featureId] = row.is_enabled;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// setUserFeaturePref
// ---------------------------------------------------------------------------

/**
 * Upserts a single user feature preference.
 * Throws for unknown featureId or non-user-toggleable feature.
 */
export async function setUserFeaturePref(
  userId: string,
  featureId: FeatureId,
  enabled: boolean,
): Promise<void> {
  const feature = getFeature(featureId);

  if (!feature.userToggleable) {
    throw new Error(
      `[user-prefs] Feature "${featureId}" is not user-toggleable`,
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('user_feature_prefs')
    .upsert(
      {
        user_id: userId,
        feature_id: featureId,
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,feature_id' },
    );

  if (error) {
    throw new Error(`[user-prefs] Failed to upsert pref: ${error.message}`);
  }
}
