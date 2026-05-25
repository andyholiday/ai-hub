// =============================================================================
// System Prompts API
// GET /api/admin/prompts - List all active system prompts (latest version each)
// PUT /api/admin/prompts - Update a prompt (creates a new version)
// =============================================================================

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePromptSchema } from "@/lib/validators/admin";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET - List all active prompts (latest version per key)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const rl = await rateLimit(req, "admin", auth.userId);
    if (!rl.success) {
      return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
    }

    const supabase = createAdminClient();

    // Fetch all prompts, sorted by key and version descending.
    // We then pick the latest active version per key on the server side.
    const { data: allPrompts, error } = await supabase
      .from("system_prompts")
      .select("*")
      .order("prompt_key", { ascending: true })
      .order("version", { ascending: false });

    if (error) {
      console.error("[admin/prompts] fetch system_prompts:", error);
      return apiInternalError("Interner Fehler");
    }

    // Group by prompt_key and pick the latest active version
    const latestByKey = new Map<string, (typeof allPrompts)[number]>();

    for (const prompt of allPrompts ?? []) {
      if (!latestByKey.has(prompt.prompt_key)) {
        // First occurrence per key (highest version due to sort order)
        latestByKey.set(prompt.prompt_key, prompt);
      }
    }

    // Also provide the version history count per key
    const versionCounts = new Map<string, number>();
    for (const prompt of allPrompts ?? []) {
      versionCounts.set(
        prompt.prompt_key,
        (versionCounts.get(prompt.prompt_key) ?? 0) + 1,
      );
    }

    const prompts = Array.from(latestByKey.values()).map((p) => ({
      ...p,
      total_versions: versionCounts.get(p.prompt_key) ?? 1,
    }));

    return apiSuccess(prompts);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// PUT - Create new version of a prompt
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const rl = await rateLimit(req, "admin", auth.userId);
    if (!rl.success) {
      return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
    }

    const body: unknown = await req.json();
    const parsed = updatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { prompt_key, prompt_text } = parsed.data;
    const supabase = createAdminClient();

    // --- Find the current highest version for this key ---
    const { data: existing } = await supabase
      .from("system_prompts")
      .select("version")
      .eq("prompt_key", prompt_key)
      .order("version", { ascending: false })
      .limit(1);

    const currentVersion = existing?.[0]?.version;
    const nextVersion = typeof currentVersion === "number" ? currentVersion + 1 : 1;

    // --- Insert the new version FIRST to avoid inconsistent state ---
    // If this fails, previous versions remain active (safe fallback).
    const { data: newPrompt, error } = await supabase
      .from("system_prompts")
      .insert({
        prompt_key,
        prompt_text,
        version: nextVersion,
        is_active: true,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("[admin/prompts] insert system_prompts:", error);
      return apiInternalError("Interner Fehler");
    }

    // --- Deactivate all previous versions (new version is already persisted) ---
    const { error: deactivateError } = await supabase
      .from("system_prompts")
      .update({ is_active: false })
      .eq("prompt_key", prompt_key)
      .neq("id", newPrompt.id);

    if (deactivateError) {
      // The new version is active; old versions may still be active too.
      // This is a non-critical inconsistency that resolves on the next update
      // because the GET handler always picks the highest version.
      console.error(
        `[prompts] Failed to deactivate old versions for "${prompt_key}":`,
        deactivateError.message,
      );
    }

    return apiSuccess(newPrompt, 201);
  } catch {
    return apiInternalError();
  }
}
