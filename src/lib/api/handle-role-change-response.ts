// =============================================================================
// Handle X-Role-Changed Response Header (ADR-016)
// Inspects an admin-API response for the X-Role-Changed header.
// If set to "true", refreshes the Supabase session so the JWT picks up
// the updated role claim.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

export async function handleRoleChangeResponse(
  response: Response,
  supabase: SupabaseClient,
  onRefreshed?: () => void
): Promise<void> {
  if (response.headers.get("X-Role-Changed") !== "true") return;
  const { error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn("[role-change] refreshSession failed", error);
    return;
  }
  onRefreshed?.();
}
