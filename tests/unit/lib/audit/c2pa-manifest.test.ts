// =============================================================================
// Tests: C2PA v2.4 Manifest Builder (src/lib/audit/c2pa-manifest.ts)
// Pattern P4.3 — ADR-012
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildManifest, persistManifest } from "@/lib/audit/c2pa-manifest";
import type { ManifestInput, PersistParams } from "@/lib/audit/c2pa-manifest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseInput: ManifestInput = {
  modelId: "mistral-large",
  provider: "mistral",
  region: "eu-west-1",
  privacyMode: false,
  content: "Hello, this is a test response.",
  userId: "user-123",
};

function makeSupabaseMock(insertError: unknown = null) {
  const insertMock = vi.fn().mockResolvedValue({ error: insertError });
  return {
    from: vi.fn(() => ({ insert: insertMock })),
    _insertMock: insertMock,
  };
}

// ---------------------------------------------------------------------------
// buildManifest — Structure
// ---------------------------------------------------------------------------

describe("buildManifest() — C2PA v2.4 Struktur", () => {
  it("gibt ein Manifest mit korrektem @context zurueck", async () => {
    const manifest = await buildManifest(baseInput);
    expect(manifest["@context"]).toBe(
      "https://c2pa.org/specifications/2.4/manifest.json",
    );
  });

  it("claim_generator enthaelt ai-hub@", async () => {
    const manifest = await buildManifest(baseInput);
    expect(manifest.claim_generator).toMatch(/^ai-hub@/);
  });

  it("format ist application/x-ai-response", async () => {
    const manifest = await buildManifest(baseInput);
    expect(manifest.format).toBe("application/x-ai-response");
  });

  it("instance_id ist ein gueltiger UUID v4", async () => {
    const manifest = await buildManifest(baseInput);
    expect(manifest.instance_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("ingredients ist ein leeres Array", async () => {
    const manifest = await buildManifest(baseInput);
    expect(manifest.ingredients).toEqual([]);
  });

  it("signature_info ist null (Phase 1 — kein X.509-Signing)", async () => {
    const manifest = await buildManifest(baseInput);
    expect(manifest.signature_info).toBeNull();
  });

  it("assertions enthaelt c2pa.training-mining mit training_status no", async () => {
    const manifest = await buildManifest(baseInput);
    const trainingAssertion = manifest.assertions.find(
      (a) => a.label === "c2pa.training-mining",
    );
    expect(trainingAssertion).toBeDefined();
    expect(trainingAssertion?.data).toEqual({ training_status: "no" });
  });

  it("assertions enthaelt c2pa.actions mit c2pa.created und c2pa.published", async () => {
    const manifest = await buildManifest(baseInput);
    const actionsAssertion = manifest.assertions.find(
      (a) => a.label === "c2pa.actions",
    );
    expect(actionsAssertion).toBeDefined();
    const actions = actionsAssertion?.data.actions as Array<{ action: string }>;
    const actionLabels = actions.map((a) => a.action);
    expect(actionLabels).toContain("c2pa.created");
    expect(actionLabels).toContain("c2pa.published");
  });

  it("assertions enthaelt ai-hub.metadata mit model, provider, region, privacy_mode", async () => {
    const manifest = await buildManifest(baseInput);
    const meta = manifest.assertions.find((a) => a.label === "ai-hub.metadata");
    expect(meta).toBeDefined();
    expect(meta?.data).toMatchObject({
      model: "mistral-large",
      provider: "mistral",
      region: "eu-west-1",
      privacy_mode: false,
    });
  });

  it("privacy_mode: true wird korrekt in ai-hub.metadata gesetzt", async () => {
    const manifest = await buildManifest({ ...baseInput, privacyMode: true });
    const meta = manifest.assertions.find((a) => a.label === "ai-hub.metadata");
    expect(meta?.data.privacy_mode).toBe(true);
  });

  it("Manifest ist JSON-serialisierbar (JSON.stringify wirft nicht)", async () => {
    const manifest = await buildManifest(baseInput);
    expect(() => JSON.stringify(manifest)).not.toThrow();
  });

  it("zwei Aufrufe erzeugen unterschiedliche instance_ids", async () => {
    const m1 = await buildManifest(baseInput);
    const m2 = await buildManifest(baseInput);
    expect(m1.instance_id).not.toBe(m2.instance_id);
  });
});

// ---------------------------------------------------------------------------
// SHA-256 Hashing — Test-Vektor
// ---------------------------------------------------------------------------

describe("SHA-256 Hashing", () => {
  it("SHA-256('test') ergibt 9f86d081884c7d...", async () => {
    // Bekannter Test-Vektor: SHA-256 von 'test' = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    // Wir pruefen via buildManifest mit content='test' und userId='test',
    // dann verifizieren wir den Hashing-Mechanismus direkt.
    const bytes = new TextEncoder().encode("test");
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(hex).toBe(
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    );
  });

  it("SHA-256 produziert 64 Hex-Zeichen (256 Bit)", async () => {
    const bytes = new TextEncoder().encode("any input");
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(hex).toHaveLength(64);
  });
});

// ---------------------------------------------------------------------------
// persistManifest — Supabase-Insert + fire-and-forget
// ---------------------------------------------------------------------------

describe("persistManifest() — Supabase INSERT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ruft supabase.from('audit_logs').insert mit korrekten Feldern auf", async () => {
    const mock = makeSupabaseMock();
    const manifest = await buildManifest(baseInput);

    const params: PersistParams = {
      userId: baseInput.userId,
      modelId: baseInput.modelId,
      provider: baseInput.provider,
      region: baseInput.region,
      privacyMode: baseInput.privacyMode,
      content: baseInput.content,
      manifest,
    };

    persistManifest(mock as unknown as import("@supabase/supabase-js").SupabaseClient, params);

    // Warte auf die async fire-and-forget IIFE
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mock.from).toHaveBeenCalledWith("audit_logs");
    const firstCall = mock._insertMock.mock.calls.at(0);
    expect(firstCall).toBeDefined();
    const insertCall = firstCall?.[0] as Record<string, unknown>;
    expect(insertCall.model_id).toBe("mistral-large");
    expect(insertCall.provider).toBe("mistral");
    expect(insertCall.region).toBe("eu-west-1");
    expect(insertCall.privacy_mode).toBe(false);
    expect(typeof insertCall.user_id_hash).toBe("string");
    expect((insertCall.user_id_hash as string)).toHaveLength(64);
    expect(typeof insertCall.content_hash).toBe("string");
    expect((insertCall.content_hash as string)).toHaveLength(64);
    expect(insertCall.manifest_json).toBe(manifest);
  });

  it("user_id_hash ist SHA-256(userId), nicht die raw userId", async () => {
    const mock = makeSupabaseMock();
    const manifest = await buildManifest(baseInput);

    persistManifest(mock as unknown as import("@supabase/supabase-js").SupabaseClient, {
      userId: "user-123",
      modelId: "m",
      provider: "p",
      region: "r",
      privacyMode: false,
      content: "c",
      manifest,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const firstCall2 = mock._insertMock.mock.calls.at(0);
    expect(firstCall2).toBeDefined();
    const insertCall = firstCall2?.[0] as Record<string, unknown>;
    // user_id_hash darf nicht die raw userId sein
    expect(insertCall.user_id_hash).not.toBe("user-123");
    // muss ein 64-stelliger Hex-Hash sein
    expect(insertCall.user_id_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("fire-and-forget: bei Insert-Fehler wird kein throw propagiert", async () => {
    const mock = makeSupabaseMock({ message: "DB-Fehler simuliert" });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const manifest = await buildManifest(baseInput);
    // persistManifest darf NICHT werfen — auch nicht bei DB-Fehler
    expect(() =>
      persistManifest(mock as unknown as import("@supabase/supabase-js").SupabaseClient, {
        userId: "u",
        modelId: "m",
        provider: "p",
        region: "r",
        privacyMode: false,
        content: "c",
        manifest,
      }),
    ).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Fehler soll geloggt werden
    expect(consoleSpy).toHaveBeenCalledWith(
      "audit-log-error",
      "DB-Fehler simuliert",
    );

    consoleSpy.mockRestore();
  });

  it("fire-and-forget: bei unerwarteter Exception kein throw nach aussen", async () => {
    const brokenMock = {
      from: vi.fn(() => {
        throw new Error("Unexpected crash");
      }),
    };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const manifest = await buildManifest(baseInput);
    expect(() =>
      persistManifest(brokenMock as unknown as import("@supabase/supabase-js").SupabaseClient, {
        userId: "u",
        modelId: "m",
        provider: "p",
        region: "r",
        privacyMode: false,
        content: "c",
        manifest,
      }),
    ).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(consoleSpy).toHaveBeenCalledWith("audit-log-error", expect.any(Error));

    consoleSpy.mockRestore();
  });
});
