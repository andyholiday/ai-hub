// =============================================================================
// /dashboard/settings — Settings Page (Pattern P2.2)
// Multi-section settings page. Feature-Settings section added for Wave 3a.
// =============================================================================

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import { FeatureSettingsPage } from '@/components/features/settings/feature-settings-page';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-headline font-bold text-surface-900">
        Einstellungen
      </h1>

      {/* Feature-Settings Section — Pattern P2.2 */}
      <Card>
        <FeatureSettingsPage userId={user.id} />
      </Card>
    </div>
  );
}
