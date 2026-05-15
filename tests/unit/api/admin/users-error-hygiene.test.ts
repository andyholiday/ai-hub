// =============================================================================
// Tests: M-10 — Error-hygiene in /api/admin/users
// Verifies that raw Supabase error messages are NOT leaked to the client.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/admin-auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-id", role: "admin" }),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: 0 }),
}));

const mockSupabase = {
  auth: {
    admin: {
      listUsers: vi.fn(),
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/users", {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const SUPABASE_INTERNAL_MESSAGE = "duplicate key value violates unique constraint \"profiles_email_key\"";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/admin/users — error hygiene", () => {
  beforeEach(() => {
    vi.resetModules();
    // listUsers succeeds (empty)
    mockSupabase.auth.admin.listUsers.mockResolvedValue({
      data: { users: [] },
      error: null,
    });
  });

  it("does not leak Supabase profileError.message to client", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: SUPABASE_INTERNAL_MESSAGE, code: "42P01" },
      }),
    });

    const { GET } = await import("@/app/api/admin/users/route");
    const res = await GET(makeRequest("GET"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(SUPABASE_INTERNAL_MESSAGE);
    expect(json.error?.message).toBeDefined();
    expect(json.error.message).not.toContain("unique constraint");
  });
});

describe("POST /api/admin/users — error hygiene", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("does not leak createUser error message to client", async () => {
    mockSupabase.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Email rate limit exceeded — internal Supabase detail" },
    });

    const { POST } = await import("@/app/api/admin/users/route");
    const res = await POST(makeRequest("POST", {
      email: "test@example.com",
      password: "Password123!",
      full_name: "Test User",
    }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain("Email rate limit exceeded");
    expect(json.error?.message).toBeDefined();
  });
});

describe("PATCH /api/admin/users — error hygiene", () => {
  beforeEach(() => {
    vi.resetModules();
    // current role lookup
    const selectMock = vi.fn().mockReturnThis();
    mockSupabase.from.mockReturnValue({
      select: selectMock,
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "user" }, error: null }),
      update: vi.fn().mockReturnThis(),
    });
  });

  it("does not leak update error message to client", async () => {
    const updateResult = { data: null, error: { message: SUPABASE_INTERNAL_MESSAGE, code: "23505" } };
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "user" }, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(updateResult),
      }),
    });

    const { PATCH } = await import("@/app/api/admin/users/route");
    const res = await PATCH(makeRequest("PATCH", { id: "some-user-id", role: "admin" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(SUPABASE_INTERNAL_MESSAGE);
  });
});

describe("DELETE /api/admin/users — error hygiene", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSupabase.auth.admin.deleteUser.mockReset();
    // GDPR log insert succeeds
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "log-id" }, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    });
  });

  it("does not leak deleteUser error message to client", async () => {
    // Uses a valid UUID so F06 schema validation passes; error comes from deleteUser itself.
    mockSupabase.auth.admin.deleteUser.mockResolvedValue({
      error: { message: "User not found — internal Supabase auth detail" },
    });

    const { DELETE } = await import("@/app/api/admin/users/route");
    const res = await DELETE(makeRequest("DELETE", { id: "00000000-0000-0000-0000-000000000001" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain("User not found — internal Supabase auth detail");
  });

  it("non-UUID id → 400 (F06 schema validation)", async () => {
    // Verifies that the DeleteUserSchema introduced by F06 rejects non-UUID ids early.
    const { DELETE } = await import("@/app/api/admin/users/route");
    const res = await DELETE(makeRequest("DELETE", { id: "nonexistent-user-id" }));

    expect(res.status).toBe(400);
    expect(mockSupabase.auth.admin.deleteUser).not.toHaveBeenCalled();
  });
});
