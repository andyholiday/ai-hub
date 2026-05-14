// =============================================================================
// Provider Management API
// GET  /api/admin/providers  - List all AI providers
// PUT  /api/admin/providers  - Update a provider's configuration
// =============================================================================

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
  apiNotFound,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProviderSchema } from "@/lib/validators/admin";
import { invalidateProviderKeyCache } from "@/lib/ai/provider-keys";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely mask an API key – never reveal more than the first 4 chars. */
function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length < 8) return "********";
  return `${key.slice(0, 4)}...${"*".repeat(8)}`;
}

// ---------------------------------------------------------------------------
// GET - List all providers
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const supabase = createAdminClient();

    const { data: providers, error } = await supabase
      .from("ai_providers")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[admin/providers] fetch ai_providers:", error);
      return apiInternalError("Interner Fehler");
    }

    // Mask api_key_encrypted for the response - never send raw keys to the client
    const safeProviders = (providers ?? []).map((p) => ({
      ...p,
      api_key_encrypted: maskApiKey(p.api_key_encrypted),
    }));

    return apiSuccess(safeProviders);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// PUT - Update provider configuration
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const body: unknown = await req.json();
    const parsed = updateProviderSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { id, api_key_encrypted: incomingApiKey, ...updates } = parsed.data;
    const supabase = createAdminClient();

    // If a new API key is provided, store it in Vault and write the UUID back
    if (incomingApiKey) {
      // Fetch the provider_key so the Vault secret can be named correctly
      const { data: existing, error: fetchError } = await supabase
        .from("ai_providers")
        .select("provider_key")
        .eq("id", id)
        .single();

      if (fetchError || !existing) {
        return apiNotFound("Provider not found");
      }

      const { data: vaultUuid, error: vaultError } = await supabase.rpc(
        "upsert_provider_vault_key",
        {
          p_provider_key: existing.provider_key,
          p_api_key: incomingApiKey,
        },
      );

      if (vaultError || !vaultUuid) {
        console.error("[admin/providers] upsert_provider_vault_key:", vaultError);
        return apiInternalError("Interner Fehler");
      }

      // Write the vault UUID into the column (never the plaintext key)
      (updates as Record<string, unknown>).api_key_encrypted =
        vaultUuid as string;

      // Invalidate the in-memory key cache so the new key is picked up immediately
      invalidateProviderKeyCache();
    }

    // If setting as primary, unset any existing primary provider first
    if (updates.is_primary === true) {
      await supabase
        .from("ai_providers")
        .update({ is_primary: false })
        .eq("is_primary", true)
        .neq("id", id);
    }

    const { data: provider, error } = await supabase
      .from("ai_providers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return apiNotFound("Provider not found");
      }
      console.error("[admin/providers] update ai_providers:", error);
      return apiInternalError("Interner Fehler");
    }

    // Mask the key before returning
    return apiSuccess({
      ...provider,
      api_key_encrypted: maskApiKey(provider.api_key_encrypted),
    });
  } catch {
    return apiInternalError();
  }
}
