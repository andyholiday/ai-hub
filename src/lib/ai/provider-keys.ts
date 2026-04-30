// =============================================================================
// Provider API Keys from Database
// Reads decrypted API keys from Supabase Vault via the
// get_active_provider_keys() RPC (SECURITY DEFINER, see migration 00014).
// Results are cached in-memory for 60 seconds to minimise DB round-trips.
// =============================================================================

import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Maps provider_key (e.g. "gemini", "openai") to its API key string. */
export type ProviderKeyMap = Record<string, string>;

interface ProviderKeyRow {
  provider_key: string;
  api_key: string;
}

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
 * Note: The generated Database type does not include the new RPC functions
 * from migration 00014 yet (requires `supabase gen types` after db push).
 * We cast through `unknown` to work around the missing entry in the type map.
 */
export async function getProviderApiKeysFromDB(): Promise<ProviderKeyMap> {
  // Return cached data if still valid
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC not yet in generated types (run `supabase gen types` after migration 00014)
  const { data: rows, error } = await (supabase.rpc as any)(
    "get_active_provider_keys",
  ) as { data: ProviderKeyRow[] | null; error: { message: string } | null };

  if (error) {
    console.error(
      "[provider-keys] Failed to fetch API keys from Vault:",
      error.message,
    );
    // On error, return stale cache if available, otherwise empty map
    return cache?.data ?? {};
  }

  const keyMap: ProviderKeyMap = {};

  for (const row of rows ?? []) {
    if (row.provider_key && row.api_key) {
      keyMap[row.provider_key] = row.api_key;
    }
  }

  // Update cache
  cache = {
    data: keyMap,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return keyMap;
}
