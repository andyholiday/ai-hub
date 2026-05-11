'use server';

// =============================================================================
// Server Action: toggleFeaturePref (Pattern P2.2)
// Validates auth, delegates to user-prefs module, revalidates settings path.
// =============================================================================

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { setUserFeaturePref } from '@/lib/features/user-prefs';
import type { FeatureId } from '@/lib/features/types';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type ToggleResult =
  | { success: true }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

/**
 * Toggles a user feature preference.
 * Called from FeatureToggle client component via startTransition.
 */
export async function toggleFeaturePref(
  featureId: FeatureId,
  enabled: boolean,
): Promise<ToggleResult> {
  // Auth check via getUser() — validates JWT server-side
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await setUserFeaturePref(user.id, featureId, enabled);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}
