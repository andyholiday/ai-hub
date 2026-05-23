// =============================================================================
// Integration Tests: Best Practices API
// GET  /api/best-practices        — Liste mit Pagination + Filter
// POST /api/best-practices        — Create (Auth + Validation)
// GET  /api/best-practices/[id]   — Detail
// PATCH /api/best-practices/[id]  — Update (Owner-only / Admin)
// DELETE /api/best-practices/[id] — Delete (Owner / Admin)
//
// Supabase-Layer und Auth werden gemockt — kein Netzwerk-Roundtrip.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — vor den Importen der Routes (Vitest hoisted vi.mock)
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/gamification/xp", () => ({
  awardCommunityXP: vi.fn().mockResolvedValue(null),
}));

import { requireAuth } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardCommunityXP } from "@/lib/gamification/xp";
import { GET as listGET, POST } from "@/app/api/best-practices/route";
import {
  GET as detailGET,
  PATCH,
  DELETE,
} from "@/app/api/best-practices/[id]/route";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOCK_USER = {
  userId: "user-123",
  role: "user" as const,
  supabase: {} as ReturnType<typeof import("@supabase/ssr").createServerClient>,
};

const MOCK_ADMIN = {
  userId: "admin-999",
  role: "admin" as const,
  supabase: {} as ReturnType<typeof import("@supabase/ssr").createServerClient>,
};

const MOCK_OTHER_USER = {
  userId: "user-456",
  role: "user" as const,
  supabase: {} as ReturnType<typeof import("@supabase/ssr").createServerClient>,
};

const MOCK_UNAUTH = {
  response: NextResponse.json(
    { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
    { status: 401 },
  ),
};

const SAMPLE_BP = {
  id: "bp-001",
  author_id: MOCK_USER.userId,
  title: "Prompt-Engineering Grundlagen",
  excerpt: "Kurze Beschreibung",
  content: "Ausführlicher Inhalt über Prompt Engineering",
  category: "prompt_engineering",
  tags: ["ai", "prompts"],
  status: "published",
  upvotes_count: 5,
  views_count: 42,
  comments_count: 3,
  created_at: "2026-01-01T00:00:00Z",
  author: {
    id: MOCK_USER.userId,
    full_name: "Test User",
    avatar_url: null,
    level: 2,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

function makeJsonRequest(
  url: string,
  method: string,
  body: unknown,
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Erstellt einen Supabase-Client-Mock mit Fluent-Interface */
function makeSupabaseMock(options: {
  selectData?: unknown;
  selectError?: { code?: string; message: string } | null;
  insertData?: unknown;
  insertError?: { message: string } | null;
  updateData?: unknown;
  updateError?: { message: string } | null;
  deleteError?: { message: string } | null;
  count?: number;
}) {
  const {
    selectData = null,
    selectError = null,
    insertData = null,
    insertError = null,
    updateData = null,
    updateError = null,
    deleteError = null,
    count = null,
  } = options;

  // Generischer Builder — gibt sich selbst zurueck fuer Chaining
  const builder: Record<string, unknown> = {};

  const chain = (finalResult: unknown) => {
    const obj: Record<string, () => unknown> = {
      select: () => obj,
      insert: () => obj,
      update: () => obj,
      delete: () => obj,
      eq: () => obj,
      ilike: () => obj,
      contains: () => obj,
      order: () => obj,
      range: () => obj,
      single: () => finalResult,
      maybeSingle: () => finalResult,
      then: (cb?: (v: unknown) => void) => {
        if (cb) cb(finalResult);
        return Promise.resolve(finalResult);
      },
    };
    return obj;
  };

  const selectChain: Record<string, () => unknown> = {
    select: () => selectChain,
    eq: () => selectChain,
    ilike: () => selectChain,
    contains: () => selectChain,
    order: () => selectChain,
    range: () =>
      Promise.resolve({ data: selectData, error: selectError, count }),
    single: () =>
      Promise.resolve({ data: selectData, error: selectError }),
    maybeSingle: () =>
      Promise.resolve({ data: selectData, error: selectError }),
    then: (cb?: (v: unknown) => void) => {
      const result = { data: selectData, error: selectError };
      if (cb) cb(result);
      return Promise.resolve(result);
    },
  };

  void builder;

  return {
    from: (table: string) => {
      void table;
      return {
        select: (_cols?: string, _opts?: unknown) => selectChain,
        insert: (_rows: unknown) => chain(Promise.resolve({ data: insertData, error: insertError })),
        update: (_data: unknown) => chain(Promise.resolve({ data: updateData, error: updateError })),
        delete: () => chain(Promise.resolve({ data: null, error: deleteError })),
      };
    },
  };
}

// ===========================================================================
// GET /api/best-practices — Liste
// ===========================================================================

describe("GET /api/best-practices — Liste", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);
  });

  it("gibt 200 mit Pagination-Meta zurueck", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({ selectData: [SAMPLE_BP], count: 1 }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await listGET(
      makeGetRequest("http://localhost/api/best-practices"),
    );

    expect(res.status).toBe(200);
    const json = await res.json() as { data: unknown[]; meta: { totalCount: number } };
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.meta).toBeDefined();
    expect(json.meta.totalCount).toBe(1);
  });

  it("gibt leere Liste ohne Fehler zurueck wenn keine Eintraege vorhanden", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({ selectData: [], count: 0 }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await listGET(
      makeGetRequest("http://localhost/api/best-practices"),
    );

    expect(res.status).toBe(200);
    const json = await res.json() as { data: unknown[]; meta: { totalCount: number } };
    expect(json.data).toHaveLength(0);
    expect(json.meta.totalCount).toBe(0);
  });

  it("gibt 400 bei ungueltigen Query-Params zurueck", async () => {
    const res = await listGET(
      makeGetRequest("http://localhost/api/best-practices?page=0"),
    );

    expect(res.status).toBe(400);
  });

  it("gibt 200 bei filter category=prompt_engineering zurueck", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({ selectData: [SAMPLE_BP], count: 1 }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await listGET(
      makeGetRequest(
        "http://localhost/api/best-practices?category=prompt_engineering",
      ),
    );

    expect(res.status).toBe(200);
  });

  it("gibt 200 bei filter mine=true zurueck", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({ selectData: [SAMPLE_BP], count: 1 }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await listGET(
      makeGetRequest("http://localhost/api/best-practices?mine=true"),
    );

    expect(res.status).toBe(200);
  });

  it("gibt 200 bei status-Filter zurueck", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({ selectData: [], count: 0 }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await listGET(
      makeGetRequest("http://localhost/api/best-practices?status=draft"),
    );

    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/best-practices — Create
// ===========================================================================

describe("POST /api/best-practices — Create", () => {
  it("gibt 401 zurueck wenn nicht authentifiziert", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_UNAUTH);

    const res = await POST(
      makeJsonRequest("http://localhost/api/best-practices", "POST", {
        title: "Titel mit mindestens 5 Zeichen",
        content: "Inhalt mit mindestens fuenfzig Zeichen, der valide ist fuer den Test.",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("gibt 400 bei zu kurzem Titel zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);

    const res = await POST(
      makeJsonRequest("http://localhost/api/best-practices", "POST", {
        title: "Hi",
        content: "Inhalt mit mindestens fuenfzig Zeichen, der valide ist fuer den Test.",
      }),
    );

    expect(res.status).toBe(400);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("gibt 400 bei zu kurzem Content zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);

    const res = await POST(
      makeJsonRequest("http://localhost/api/best-practices", "POST", {
        title: "Valider langer Titel hier",
        content: "Zu kurz",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("gibt 400 bei zu vielen Tags zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);

    const res = await POST(
      makeJsonRequest("http://localhost/api/best-practices", "POST", {
        title: "Valider langer Titel hier",
        content: "Inhalt mit mindestens fuenfzig Zeichen, der valide ist fuer den Test.",
        tags: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"],
      }),
    );

    expect(res.status).toBe(400);
  });

  it("gibt 201 bei validem Body zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        insertData: { ...SAMPLE_BP, status: "draft" },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await POST(
      makeJsonRequest("http://localhost/api/best-practices", "POST", {
        title: "Valider langer Titel hier",
        content: "Inhalt mit mindestens fuenfzig Zeichen, der valide ist fuer den Test.",
        status: "draft",
      }),
    );

    expect(res.status).toBe(201);
  });

  it("ruft awardCommunityXP auf wenn status=published", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        insertData: { ...SAMPLE_BP, status: "published" },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    await POST(
      makeJsonRequest("http://localhost/api/best-practices", "POST", {
        title: "Valider langer Titel hier",
        content: "Inhalt mit mindestens fuenfzig Zeichen, der valide ist fuer den Test.",
        status: "published",
      }),
    );

    expect(awardCommunityXP).toHaveBeenCalled();
  });

  it("ruft awardCommunityXP NICHT auf wenn status=draft", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);
    vi.mocked(awardCommunityXP).mockClear();
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        insertData: { ...SAMPLE_BP, status: "draft" },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    await POST(
      makeJsonRequest("http://localhost/api/best-practices", "POST", {
        title: "Valider langer Titel hier",
        content: "Inhalt mit mindestens fuenfzig Zeichen, der valide ist fuer den Test.",
        status: "draft",
      }),
    );

    expect(awardCommunityXP).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// GET /api/best-practices/[id] — Detail
// ===========================================================================

describe("GET /api/best-practices/[id] — Detail", () => {
  it("gibt 200 fuer published Eintrag (auch unauthentifiziert) zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_UNAUTH);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({ selectData: SAMPLE_BP }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await detailGET(
      makeGetRequest("http://localhost/api/best-practices/bp-001"),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(200);
  });

  it("gibt 404 zurueck wenn Eintrag nicht existiert", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        selectData: null,
        selectError: { code: "PGRST116", message: "Row not found" },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await detailGET(
      makeGetRequest("http://localhost/api/best-practices/nonexistent"),
      { params: { id: "nonexistent" } },
    );

    expect(res.status).toBe(404);
  });

  it("gibt 404 zurueck wenn draft-Eintrag von Nicht-Owner abgerufen wird", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_OTHER_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        selectData: { ...SAMPLE_BP, status: "draft" },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await detailGET(
      makeGetRequest("http://localhost/api/best-practices/bp-001"),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(404);
  });

  it("gibt 200 fuer eigenen draft-Eintrag zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        selectData: { ...SAMPLE_BP, status: "draft", author_id: MOCK_USER.userId },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await detailGET(
      makeGetRequest("http://localhost/api/best-practices/bp-001"),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// PATCH /api/best-practices/[id] — Update
// ===========================================================================

describe("PATCH /api/best-practices/[id] — Update (Owner-only / Admin)", () => {
  it("gibt 401 zurueck wenn nicht authentifiziert", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_UNAUTH);

    const res = await PATCH(
      makeJsonRequest("http://localhost/api/best-practices/bp-001", "PATCH", {
        title: "Neuer valider langer Titel",
      }),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(401);
  });

  it("gibt 403 zurueck wenn Nicht-Owner versucht zu aendern", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_OTHER_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        selectData: { author_id: MOCK_USER.userId },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(
      makeJsonRequest("http://localhost/api/best-practices/bp-001", "PATCH", {
        title: "Neuer valider langer Titel",
      }),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(403);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("gibt 200 zurueck wenn Owner aendert", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);

    // Erster Aufruf: .select().eq().single() — gibt owner-check-Ergebnis
    // Zweiter Aufruf: .update().eq().select().single() — gibt updated item
    let callCount = 0;
    const supabaseMock = {
      from: () => ({
        select: (_cols?: string) => ({
          eq: () => ({
            single: () => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ data: { author_id: MOCK_USER.userId }, error: null });
              }
              return Promise.resolve({ data: SAMPLE_BP, error: null });
            },
          }),
        }),
        update: (_data: unknown) => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: SAMPLE_BP, error: null }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(
      supabaseMock as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(
      makeJsonRequest("http://localhost/api/best-practices/bp-001", "PATCH", {
        title: "Neuer valider langer Titel",
      }),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(200);
  });

  it("gibt 200 zurueck wenn Admin fremden Eintrag aendert", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_ADMIN);

    const supabaseMock = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { author_id: MOCK_USER.userId }, error: null }),
          }),
        }),
        update: (_data: unknown) => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: SAMPLE_BP, error: null }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(
      supabaseMock as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(
      makeJsonRequest("http://localhost/api/best-practices/bp-001", "PATCH", {
        title: "Neuer valider langer Titel",
      }),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(200);
  });

  it("gibt 400 bei ungueltigem Body zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        selectData: { author_id: MOCK_USER.userId },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(
      makeJsonRequest("http://localhost/api/best-practices/bp-001", "PATCH", {
        title: "X", // zu kurz
      }),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(400);
  });

  // F05: archived status is Admin-only
  it("PATCH status=archived as owner returns 403", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER); // role: "user"
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        selectData: { author_id: MOCK_USER.userId },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(
      makeJsonRequest("http://localhost/api/best-practices/bp-001", "PATCH", {
        status: "archived",
      }),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(403);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("PATCH status=published on archived entry as owner returns 403", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER); // role: "user"

    // Two sequential select calls: first returns owner check, second returns existing status
    let selectCallCount = 0;
    const supabaseMock = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => {
              selectCallCount++;
              if (selectCallCount === 1) {
                // owner check
                return Promise.resolve({ data: { author_id: MOCK_USER.userId }, error: null });
              }
              // existing status check
              return Promise.resolve({ data: { status: "archived" }, error: null });
            },
          }),
        }),
        update: (_data: unknown) => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: SAMPLE_BP, error: null }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(
      supabaseMock as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(
      makeJsonRequest("http://localhost/api/best-practices/bp-001", "PATCH", {
        status: "published",
      }),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(403);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

// ===========================================================================
// DELETE /api/best-practices/[id] — Delete
// ===========================================================================

describe("DELETE /api/best-practices/[id] — Delete (Owner / Admin)", () => {
  it("gibt 401 zurueck wenn nicht authentifiziert", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_UNAUTH);

    const res = await DELETE(
      makeGetRequest("http://localhost/api/best-practices/bp-001"),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(401);
  });

  it("gibt 403 zurueck wenn Nicht-Owner versucht zu loeschen", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_OTHER_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        selectData: { author_id: MOCK_USER.userId },
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await DELETE(
      makeGetRequest("http://localhost/api/best-practices/bp-001"),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(403);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("gibt 200 bei erfolgreichem Loeschen durch Owner zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);

    const supabaseMock = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { author_id: MOCK_USER.userId }, error: null }),
          }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(
      supabaseMock as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await DELETE(
      makeGetRequest("http://localhost/api/best-practices/bp-001"),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(200);
    const json = await res.json() as { data: { deleted: boolean } };
    expect(json.data.deleted).toBe(true);
  });

  it("gibt 200 bei erfolgreichem Loeschen durch Admin zurueck", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_ADMIN);

    const supabaseMock = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { author_id: MOCK_USER.userId }, error: null }),
          }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(
      supabaseMock as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await DELETE(
      makeGetRequest("http://localhost/api/best-practices/bp-001"),
      { params: { id: "bp-001" } },
    );

    expect(res.status).toBe(200);
  });

  it("gibt 404 zurueck wenn Eintrag nicht existiert", async () => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_USER);
    vi.mocked(createAdminClient).mockReturnValue(
      makeSupabaseMock({
        selectData: null,
        selectError: null,
      }) as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await DELETE(
      makeGetRequest("http://localhost/api/best-practices/nonexistent"),
      { params: { id: "nonexistent" } },
    );

    expect(res.status).toBe(404);
  });
});
