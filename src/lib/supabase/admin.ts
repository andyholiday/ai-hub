// =============================================================================
// Supabase Admin Client
// CAUTION: This client bypasses RLS. Only use in trusted server contexts.
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export class AdminClientConfigError extends Error {
  constructor(missing: string) {
    super(
      `[admin-client] ${missing} is not set. ` +
        "Configure it in Vercel Dashboard → Settings → Environment Variables.",
    );
    this.name = "AdminClientConfigError";
  }
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new AdminClientConfigError("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new AdminClientConfigError("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
