'use client';

// =============================================================================
// usePrivacyMode — Reads the privacy-mode feature flag for the current user.
// Pattern P4.1 | ADR-010
//
// Uses the Supabase browser client to query user_feature_prefs.
// Falls back to the registry default (false) while loading or on error.
// =============================================================================

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Returns whether privacy-mode is currently active for the authenticated user.
 * Safe to call in any Client Component; returns false until the flag is loaded.
 */
export function usePrivacyMode(): boolean {
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // user_feature_prefs is not yet in generated types — use type cast.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types yet
      const { data } = await (supabase as any)
        .from('user_feature_prefs')
        .select('is_enabled')
        .eq('user_id', user.id)
        .eq('feature_id', 'privacy-mode')
        .maybeSingle() as { data: { is_enabled: boolean } | null };

      if (!cancelled) {
        // If no row exists, the feature uses its registry default (false).
        setPrivacyMode(data?.is_enabled ?? false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return privacyMode;
}
