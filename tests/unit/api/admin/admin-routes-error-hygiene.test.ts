// =============================================================================
// Tests: M-10 — Error-hygiene in admin routes (content, features, costs,
//               gamification, prompts, providers)
// Verifies that raw Supabase error messages are NOT leaked to the client.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/admin-auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-id", role: "admin" }),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: 0 }),
}));

vi.mock("@/lib/ai/provider-keys", () => ({
  invalidateProviderKeyCache: vi.fn(),
}));

const INTERNAL_MSG = "duplicate key value violates unique constraint \"internal_table_pkey\"";

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function dbError() {
  return { data: null, error: { message: INTERNAL_MSG, code: "23505" } };
}

// ---------------------------------------------------------------------------
// content/route.ts
// ---------------------------------------------------------------------------

describe("GET /api/admin/content — error hygiene", () => {
  beforeEach(() => vi.resetModules());

  it("does not leak bpError.message to client", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(dbError()),
    });

    const { GET } = await import("@/app/api/admin/content/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/content"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });

  it("does not leak postError.message to client", async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        // First call (best_practices) succeeds, second (community_posts) fails
        limit: vi.fn().mockResolvedValue(
          callCount === 1 ? { data: [], error: null } : dbError()
        ),
      };
    });

    const { GET } = await import("@/app/api/admin/content/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/content"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });
});

// ---------------------------------------------------------------------------
// features/route.ts
// ---------------------------------------------------------------------------

describe("GET /api/admin/features — error hygiene", () => {
  beforeEach(() => vi.resetModules());

  it("does not leak DB error message on list failure", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(dbError()),
    });

    const { GET } = await import("@/app/api/admin/features/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/features"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });
});

describe("PUT /api/admin/features — error hygiene", () => {
  beforeEach(() => vi.resetModules());

  it("does not leak DB error message on update failure", async () => {
    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(dbError()),
    });

    const { PUT } = await import("@/app/api/admin/features/route");
    const res = await PUT(
      makeReq("PUT", "http://localhost/api/admin/features", {
        id: "550e8400-e29b-41d4-a716-446655440000",
        enabled: true,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });
});

// ---------------------------------------------------------------------------
// costs/route.ts
// ---------------------------------------------------------------------------

describe("GET /api/admin/costs — error hygiene", () => {
  beforeEach(() => vi.resetModules());

  it("does not leak costError.message to client", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue(dbError()),
    });

    const { GET } = await import("@/app/api/admin/costs/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/costs?period=month"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });
});

// ---------------------------------------------------------------------------
// gamification/route.ts
// ---------------------------------------------------------------------------

describe("GET /api/admin/gamification — error hygiene", () => {
  beforeEach(() => vi.resetModules());

  it("does not leak courses error.message to client", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue(dbError()),
    });

    const { GET } = await import("@/app/api/admin/gamification/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/gamification"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });

  it("does not leak badges error.message to client", async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      return {
        select: vi.fn().mockResolvedValue(
          callCount === 1 ? { data: [], error: null } : dbError()
        ),
      };
    });

    const { GET } = await import("@/app/api/admin/gamification/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/gamification"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });

  it("does not leak challenges error.message to client", async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      return {
        select: vi.fn().mockResolvedValue(
          callCount <= 2 ? { data: [], error: null } : dbError()
        ),
      };
    });

    const { GET } = await import("@/app/api/admin/gamification/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/gamification"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });
});

// ---------------------------------------------------------------------------
// prompts/route.ts
// ---------------------------------------------------------------------------

describe("GET /api/admin/prompts — error hygiene", () => {
  beforeEach(() => vi.resetModules());

  it("does not leak DB error message on list failure", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      // chained second order call
      // Vitest: last mockReturnThis in chain resolves the promise
    });
    // Override: make the final resolved value an error
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValueOnce({
        order: vi.fn().mockResolvedValue(dbError()),
      }),
    });

    const { GET } = await import("@/app/api/admin/prompts/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/prompts"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });
});

describe("PUT /api/admin/prompts — error hygiene", () => {
  beforeEach(() => vi.resetModules());

  it("does not leak insert error message to client", async () => {
    // existing version lookup succeeds with empty
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // select version
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      // insert new version
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(dbError()),
      };
    });

    const { PUT } = await import("@/app/api/admin/prompts/route");
    const res = await PUT(
      makeReq("PUT", "http://localhost/api/admin/prompts", {
        prompt_key: "mentor_system",
        prompt_text: "You are a helpful mentor.",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });
});

// ---------------------------------------------------------------------------
// providers/route.ts
// ---------------------------------------------------------------------------

describe("GET /api/admin/providers — error hygiene", () => {
  beforeEach(() => vi.resetModules());

  it("does not leak DB error message on list failure", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValueOnce({
        order: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValue(dbError()),
        }),
      }),
    });

    const { GET } = await import("@/app/api/admin/providers/route");
    const res = await GET(makeReq("GET", "http://localhost/api/admin/providers"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain(INTERNAL_MSG);
  });
});
