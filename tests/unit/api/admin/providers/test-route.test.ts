// =============================================================================
// Tests: POST /api/admin/providers/test
// Verifies that providers without a key return a clear error instead of
// silently masking the "no key" state via fallback resolution.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks (must be declared before importing the module under test)
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/ai/router", () => ({
  getAIRouterWithDBKeys: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { requireAdmin } from "@/lib/api/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAIRouterWithDBKeys } from "@/lib/ai/router";
import { POST } from "@/app/api/admin/providers/test/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/providers/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function mockAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({ userId: "admin-123" } as ReturnType<typeof requireAdmin> extends Promise<infer T> ? T : never);
}

function mockSupabaseProvider(provider: Record<string, unknown> | null, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data: provider, error });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  vi.mocked(createAdminClient).mockReturnValue({ from } as unknown as ReturnType<typeof createAdminClient>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/admin/providers/test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available:false with 'Kein API-Key hinterlegt' when provider has no key", async () => {
    mockAdmin();
    mockSupabaseProvider({
      provider_key: "openai",
      display_name: "OpenAI",
      is_active: true,
    });

    // Router reports the provider is NOT available (no key registered)
    vi.mocked(getAIRouterWithDBKeys).mockResolvedValue({
      getAvailableProviders: vi.fn().mockResolvedValue(["claude"]), // openai missing
      resolveProvider: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof getAIRouterWithDBKeys>>);

    const req = makeRequest({ id: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.available).toBe(false);
    expect(json.data.error).toBe("Kein API-Key hinterlegt");
    expect(json.data.provider_key).toBe("openai");
  });

  it("returns available:true when provider is reachable", async () => {
    mockAdmin();
    mockSupabaseProvider({
      provider_key: "claude",
      display_name: "Claude",
      is_active: true,
    });

    const mockProvider = { provider: "claude" };
    vi.mocked(getAIRouterWithDBKeys).mockResolvedValue({
      getAvailableProviders: vi.fn().mockResolvedValue(["claude"]),
      resolveProvider: vi.fn().mockResolvedValue(mockProvider),
    } as unknown as Awaited<ReturnType<typeof getAIRouterWithDBKeys>>);

    const req = makeRequest({ id: "00000000-0000-0000-0000-000000000002" });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.available).toBe(true);
    expect(json.data.error).toBeNull();
  });

  it("returns 400 for invalid UUID", async () => {
    mockAdmin();

    const req = makeRequest({ id: "not-a-uuid" });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 404 when provider row is not found in DB", async () => {
    mockAdmin();
    mockSupabaseProvider(null, { message: "not found" });

    const req = makeRequest({ id: "00000000-0000-0000-0000-000000000003" });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });
});
