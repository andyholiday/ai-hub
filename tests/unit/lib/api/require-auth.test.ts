// =============================================================================
// Tests: requireAuth helper (src/lib/api/require-auth.ts)
// Covers: M-11 Mismatch-Guard, 401 paths, DB-fallback behaviour
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mock @supabase/ssr before importing the module under test
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// Import after mock is registered
import { requireAuth } from "@/lib/api/require-auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    headers: { cookie: "sb-token=dummy" },
  });
}

/** Builds a minimal Supabase user object */
function makeUser(id: string, jwtRole?: string) {
  return {
    id,
    app_metadata: jwtRole ? { role: jwtRole } : {},
  };
}

/** Chains .select().eq().maybeSingle() and resolves with given data/error */
function mockProfileQuery(data: { role: string } | null, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth — missing Supabase env vars on Vercel", () => {
  it("returns 503 when NEXT_PUBLIC_SUPABASE_URL is not set and VERCEL is set", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const originalVercel = process.env.VERCEL;

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.VERCEL = "1"; // simulate Vercel deployment environment

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await requireAuth(makeRequest());

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(503);
      const body = await result.response.json();
      expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    }

    errorSpy.mockRestore();
    if (originalUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (originalKey !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (originalVercel !== undefined) process.env.VERCEL = originalVercel;
    else delete process.env.VERCEL;
  });
});

describe("requireAuth", () => {
  // -------------------------------------------------------------------------
  // 401 paths
  // -------------------------------------------------------------------------

  it("returns 401 when getUser returns an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("invalid jwt"),
    });

    const result = await requireAuth(makeRequest());

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns 401 when user is null (anonymous / no session)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await requireAuth(makeRequest());

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
    }
  });

  // -------------------------------------------------------------------------
  // Happy path: JWT and DB agree
  // -------------------------------------------------------------------------

  it("returns userId and role=user when DB and JWT both say user", async () => {
    const user = makeUser("user-123", "user");
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    mockProfileQuery({ role: "user" });

    const result = await requireAuth(makeRequest());

    expect("response" in result).toBe(false);
    if (!("response" in result)) {
      expect(result.userId).toBe("user-123");
      expect(result.role).toBe("user");
    }
  });

  // -------------------------------------------------------------------------
  // M-11: Mismatch-Guard — DB wins over stale JWT
  // -------------------------------------------------------------------------

  it("returns DB role when DB=admin but JWT=user (mismatch), logs warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const user = makeUser("user-456", "user");
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    mockProfileQuery({ role: "admin" });

    const result = await requireAuth(makeRequest());

    expect("response" in result).toBe(false);
    if (!("response" in result)) {
      expect(result.role).toBe("admin");
    }
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Role mismatch"),
    );
    warnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // DB error fallback — must not throw / return 500
  // -------------------------------------------------------------------------

  it("falls back to JWT role when DB read throws, logs warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const user = makeUser("user-789", "moderator");
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    // Simulate DB failure: maybeSingle() rejects
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockRejectedValue(new Error("connection timeout")),
    };
    mockFrom.mockReturnValue(chain);

    const result = await requireAuth(makeRequest());

    expect("response" in result).toBe(false);
    if (!("response" in result)) {
      expect(result.role).toBe("moderator");
    }
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("DB role lookup failed"),
      expect.any(String),
    );
    warnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // JWT role absent — default to "user"
  // -------------------------------------------------------------------------

  it("defaults to role=user when JWT has no role and DB returns null profile", async () => {
    const user = makeUser("user-000"); // no jwtRole → app_metadata: {}
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    mockProfileQuery(null); // profile row doesn't exist

    const result = await requireAuth(makeRequest());

    expect("response" in result).toBe(false);
    if (!("response" in result)) {
      expect(result.role).toBe("user");
    }
  });

  // -------------------------------------------------------------------------
  // Supabase client is returned in result
  // -------------------------------------------------------------------------

  it("returns a supabase client in the success result", async () => {
    const user = makeUser("user-abc", "user");
    mockGetUser.mockResolvedValue({ data: { user }, error: null });
    mockProfileQuery({ role: "user" });

    const result = await requireAuth(makeRequest());

    expect("response" in result).toBe(false);
    if (!("response" in result)) {
      expect(result.supabase).toBeDefined();
    }
  });
});
