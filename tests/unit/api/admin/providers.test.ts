// =============================================================================
// Tests: PUT /api/admin/providers — auth guards (F01 audit)
// Verifies 401 without auth, 403 for non-admin, 200 with masked response for admin.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks (declared before imports that use the mocked modules)
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/ai/provider-keys", () => ({
  invalidateProviderKeyCache: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { requireAdmin } from "@/lib/api/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PUT } from "@/app/api/admin/providers/route";

const mockRequireAdmin = vi.mocked(requireAdmin);
const mockCreateAdminClient = vi.mocked(createAdminClient);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/admin/providers", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PUT /api/admin/providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      response: NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      ),
    });

    const req = buildRequest({ id: VALID_UUID });
    const res = await PUT(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when authenticated but not admin", async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      response: NextResponse.json(
        { data: null, error: { code: "FORBIDDEN", message: "Admin privileges required" } },
        { status: 403 },
      ),
    });

    const req = buildRequest({ id: VALID_UUID });
    const res = await PUT(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 with masked api_key_encrypted for valid admin request", async () => {
    // Admin auth succeeds
    mockRequireAdmin.mockResolvedValueOnce({ userId: "admin-123", role: "admin" });

    // Supabase update chain returns a provider row
    const mockProvider = {
      id: VALID_UUID,
      provider_key: "openai",
      display_name: "OpenAI",
      api_key_encrypted: "abcdefghij_plaintext_uuid",
      model: "gpt-4o",
      temperature: 0.7,
      is_active: true,
      is_primary: false,
    };

    const mockFrom = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProvider, error: null }),
    };

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(mockFrom),
    } as unknown as ReturnType<typeof createAdminClient>);

    const req = buildRequest({ id: VALID_UUID, temperature: 0.8 });
    const res = await PUT(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toBeNull();
    // api_key_encrypted must be masked — never the raw value
    expect(body.data.api_key_encrypted).not.toBe("abcdefghij_plaintext_uuid");
    // Must follow the masked format: 4 chars + "..." + stars
    expect(body.data.api_key_encrypted).toMatch(/^.{4}\.\.\.\*{8}$/);
  });
});
