// =============================================================================
// C2PA v2.4 Manifest Builder — Pattern P4.3 (ADR-012)
// AI Act Art. 50 Transparenz-Aufzeichnung
// Phase 1: Manifest-Schema only. X.509-Signing ist Phase-2-Erweiterung.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

const CLAIM_GENERATOR = "ai-hub@0.1.0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ManifestInput {
  modelId: string;
  provider: string;
  region: string;
  privacyMode: boolean;
  content: string;
  userId: string;
}

export interface C2PAManifest {
  "@context": string;
  claim_generator: string;
  format: string;
  instance_id: string;
  ingredients: unknown[];
  assertions: Array<{
    label: string;
    data: Record<string, unknown>;
  }>;
  /** Phase 2: X.509-Signing. null in Phase 1. */
  signature_info: null;
}

export interface PersistParams {
  userId: string;
  modelId: string;
  provider: string;
  region: string;
  privacyMode: boolean;
  content: string;
  manifest: C2PAManifest;
}

// ---------------------------------------------------------------------------
// SHA-256 helper (Web Crypto API — Edge + Node 20+)
// ---------------------------------------------------------------------------

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// buildManifest
// ---------------------------------------------------------------------------

export async function buildManifest(input: ManifestInput): Promise<C2PAManifest> {
  const instanceId = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    "@context": "https://c2pa.org/specifications/2.4/manifest.json",
    claim_generator: CLAIM_GENERATOR,
    format: "application/x-ai-response",
    instance_id: instanceId,
    ingredients: [],
    assertions: [
      {
        label: "c2pa.training-mining",
        data: { training_status: "no" },
      },
      {
        label: "c2pa.actions",
        data: {
          actions: [
            { action: "c2pa.created", softwareAgent: CLAIM_GENERATOR },
            {
              action: "c2pa.published",
              when: now,
              digitalSourceType: "trainedAlgorithmicMedia",
            },
          ],
        },
      },
      {
        label: "ai-hub.metadata",
        data: {
          model: input.modelId,
          provider: input.provider,
          region: input.region,
          privacy_mode: input.privacyMode,
        },
      },
    ],
    signature_info: null,
  };
}

// ---------------------------------------------------------------------------
// persistManifest — fire-and-forget, wirft niemals
// ---------------------------------------------------------------------------

export function persistManifest(
  supabase: SupabaseClient,
  params: PersistParams,
): void {
  // Fire-and-forget: Promise bewusst nicht awaited
  void (async () => {
    try {
      const [userIdHash, contentHash] = await Promise.all([
        sha256Hex(params.userId),
        sha256Hex(params.content),
      ]);

      const { error } = await supabase.from("audit_logs").insert({
        user_id_hash: userIdHash,
        model_id: params.modelId,
        provider: params.provider,
        region: params.region,
        privacy_mode: params.privacyMode,
        content_hash: contentHash,
        manifest_json: params.manifest,
      });

      if (error) {
        console.error("audit-log-error", error.message);
      }
    } catch (err) {
      console.error("audit-log-error", err);
    }
  })();
}
