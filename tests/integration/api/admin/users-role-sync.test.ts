// =============================================================================
// Tests: Task 7 — Admin Role Mismatch-Guard (ADR-016)
//
// Tests requireAdmin() behaviour for the four relevant role combinations:
//   1. DB=user, JWT=user         → 403 FORBIDDEN
//   2. DB=admin, JWT=admin       → success
//   3. DB=user, JWT=admin        → 403 FORBIDDEN (DB non-admin blocks before mismatch check)
//   4. DB=admin, JWT=user        → 403 ROLE_SYNC_REQUIRED (upgrade not yet in JWT)
//
// F01 Fix: PATCH /api/admin/users validates body via PatchUserSchema:
//   - role="" → 400 (Zod rejects non-enum value, no X-Role-Changed header)
//   - missing id → 400
//   - valid role change → X-Role-Changed: true only when role differs from DB
//   - same role → no X-Role-Changed header
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoist mock state so factory closures can reference them
// ---------------------------------------------------------------------------

const { mockGetUser, mockFrom, mockRequireAdmin, mockAdminClientFactory } =
  vi.hoisted(() => {
    const mockGetUser = vi.fn();
    const mockFrom = vi.fn();
    const mockRequireAdmin = vi.fn();
    const mockAdminClientFactory = vi.fn();
    return { mockGetUser, mockFrom, mockRequireAdmin, mockAdminClientFactory };
  });

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/api/admin-auth", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockAdminClientFactory,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url = "http://localhost/api/admin/users"): NextRequest {
  return new NextRequest(url);
}

function setupUser(jwtRole: string | undefined, userId = "user-123") {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        app_metadata: jwtRole !== undefined ? { role: jwtRole } : {},
      },
    },
    error: null,
  });
}

function setupProfile(dbRole: string | null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: dbRole !== null ? { role: dbRole } : null,
      error: null,
    }),
  });
}

// ---------------------------------------------------------------------------
// requireAdmin — Mismatch-Guard tests
// ---------------------------------------------------------------------------

describe("requireAdmin — Mismatch-Guard (ADR-016)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user is authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "no session" } });

    const { requireAdmin: realRequireAdmin } = await vi.importActual<typeof import("@/lib/api/admin-auth")>("@/lib/api/admin-auth");
    const result = await realRequireAdmin(makeRequest());

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns 403 FORBIDDEN when DB role is user and JWT role is user", async () => {
    setupUser("user");
    setupProfile("user");

    const { requireAdmin: realRequireAdmin } = await vi.importActual<typeof import("@/lib/api/admin-auth")>("@/lib/api/admin-auth");
    const result = await realRequireAdmin(makeRequest());

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns success when DB role is admin and JWT role is admin", async () => {
    setupUser("admin");
    setupProfile("admin");

    const { requireAdmin: realRequireAdmin } = await vi.importActual<typeof import("@/lib/api/admin-auth")>("@/lib/api/admin-auth");
    const result = await realRequireAdmin(makeRequest());

    expect("response" in result).toBe(false);
    if (!("response" in result)) {
      expect(result.userId).toBe("user-123");
      expect(result.role).toBe("admin");
    }
  });

  it("returns success when DB role is super_admin and JWT role is super_admin", async () => {
    setupUser("super_admin");
    setupProfile("super_admin");

    const { requireAdmin: realRequireAdmin } = await vi.importActual<typeof import("@/lib/api/admin-auth")>("@/lib/api/admin-auth");
    const result = await realRequireAdmin(makeRequest());

    expect("response" in result).toBe(false);
    if (!("response" in result)) {
      expect(result.role).toBe("super_admin");
    }
  });

  it("returns 403 FORBIDDEN when DB=user but JWT=admin (downgrade: non-admin DB blocks first)", async () => {
    setupUser("admin");
    setupProfile("user");

    const { requireAdmin: realRequireAdmin } = await vi.importActual<typeof import("@/lib/api/admin-auth")>("@/lib/api/admin-auth");
    const result = await realRequireAdmin(makeRequest());

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns 403 ROLE_SYNC_REQUIRED when DB=admin but JWT=user (upgrade not yet in JWT)", async () => {
    setupUser("user");
    setupProfile("admin");

    const { requireAdmin: realRequireAdmin } = await vi.importActual<typeof import("@/lib/api/admin-auth")>("@/lib/api/admin-auth");
    const result = await realRequireAdmin(makeRequest());

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.error.code).toBe("ROLE_SYNC_REQUIRED");
    }
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/users — F01 Fix: Zod body validation + X-Role-Changed header
// ---------------------------------------------------------------------------

describe("PATCH /api/admin/users — Zod validation + X-Role-Changed header (F01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("returns 400 when role is invalid string (e.g. empty string)", async () => {
    const { PATCH } = await import("@/app/api/admin/users/route");
    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ id: "u1", role: "" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    // X-Role-Changed must NOT be set on invalid input
    expect(res.headers.get("X-Role-Changed")).toBeNull();
  });

  it("returns 400 when id is missing", async () => {
    const { PATCH } = await import("@/app/api/admin/users/route");
    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ role: "admin" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("sets X-Role-Changed: true when role changes from previous DB value", async () => {
    mockAdminClientFactory.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: { role: "user" }, error: null })
          .mockResolvedValueOnce({ data: { id: "u1", role: "admin" }, error: null }),
      })),
    });

    const { PATCH } = await import("@/app/api/admin/users/route");
    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ id: "u1", role: "admin" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req);
    expect(res.headers.get("X-Role-Changed")).toBe("true");
  });

  it("does NOT set X-Role-Changed when role field is absent", async () => {
    mockAdminClientFactory.mockReturnValue({
      from: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "u1", is_approved: true }, error: null }),
      })),
    });

    const { PATCH } = await import("@/app/api/admin/users/route");
    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ id: "u1", is_approved: true }),
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req);
    expect(res.headers.get("X-Role-Changed")).toBeNull();
  });

  it("does NOT set X-Role-Changed when role is same as current DB value", async () => {
    mockAdminClientFactory.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
          .mockResolvedValueOnce({ data: { id: "u1", role: "admin" }, error: null }),
      })),
    });

    const { PATCH } = await import("@/app/api/admin/users/route");
    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ id: "u1", role: "admin" }),
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req);
    expect(res.headers.get("X-Role-Changed")).toBeNull();
  });
});
