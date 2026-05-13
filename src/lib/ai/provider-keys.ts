// =============================================================================
// Provider API Keys from Database
// Reads decrypted API keys from Supabase Vault via the
// get_active_provider_keys() RPC (SECURITY DEFINER, see migration 00014).
// Results are cached in-memory for 60 seconds to minimise DB round-trips.
// =============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database as GeneratedDatabase } from "@/lib/supabase/types.generated";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Maps provider_key (e.g. "gemini", "openai") to its API key string. */
export type ProviderKeyMap = Record<string, string>;

// ---------------------------------------------------------------------------
// In-Memory Cache (60s TTL)
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: ProviderKeyMap;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

let cache: CacheEntry | null = null;

/**
 * Invalidate the cached provider keys.
 * Useful after an admin updates a key via the dashboard.
 */
export function invalidateProviderKeyCache(): void {
  cache = null;
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Fetch all active API keys from Supabase Vault via the
 * `get_active_provider_keys` RPC function.
 *
 * Returns a `Record<string, string>` where the key is `provider_key`
 * (e.g. "gemini", "claude", "openai") and the value is the decrypted API key.
 *
 * The RPC function performs a JOIN on vault.decrypted_secrets server-side
 * using SECURITY DEFINER, so the service-role client is sufficient.
 * The raw vault UUID in ai_providers.api_key_encrypted is never returned.
 *
 * The admin client is typed against types.ts; types.generated.ts includes the
 * get_active_provider_keys RPC added in migration 00014. We re-type the client
 * via `unknown` at the narrowest scope to use the generated types without
 * losing type safety on the returned rows.
 */
export async function getProviderApiKeysFromDB(): Promise<ProviderKeyMap> {
  // Return cached data if still valid
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const supabase = createAdminClient();

  // Cast the client to the generated Database type so the RPC call is fully
  // typed. The cast is scoped to this variable — no `any` escapes this block.
  const typedSupabase = supabase as unknown as import("@supabase/supabase-js").SupabaseClient<GeneratedDatabase>;
  const { data: rows, error } = await typedSupabase.rpc("get_active_provider_keys");

  if (error) {
    console.error("[provider-keys] Failed to fetch API keys from Vault");
    // On error, return stale cache if available, otherwise empty map
    return cache?.data ?? {};
  }

  const keyMap: ProviderKeyMap = {};

  for (const row of rows ?? []) {
    // Defensive mapping: legacy DB rows may still carry "chatgpt" as provider_key.
    // Normalise to "openai" so the router resolves correctly during rollout.
    // The DB-level migration (00025+) is intentionally skipped — DB state is unknown.
    // TODO(audit-task-1): remove after migration 0xxxx normalizes legacy chatgpt rows. See docs/AUDIT-FOLLOWUP-2026-05-12.md
    const providerKey =
      row.provider_key === "chatgpt" ? "openai" : row.provider_key;
    if (providerKey && row.api_key) {
      keyMap[providerKey] = row.api_key;
    }
  }

  // Update cache
  cache = {
    data: keyMap,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return keyMap;
}
