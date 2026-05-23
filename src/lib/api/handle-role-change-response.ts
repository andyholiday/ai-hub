// =============================================================================
// Handle X-Role-Changed Response Header (ADR-016)
// Inspects an admin-API response for the X-Role-Changed header.
// If set to "true", refreshes the Supabase session so the JWT picks up
// the updated role claim.
// =============================================================================

// Narrower than SupabaseClient<Database, ...> — avoids generic-cascade
// incompatibility when callers pass a project-typed SupabaseClient<Database>.
interface SessionRefresher {
  auth: {
    refreshSession: () => Promise<{ error: { message: string } | null }>;
  };
}

export async function handleRoleChangeResponse(
  response: Response,
  supabase: SessionRefresher,
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
