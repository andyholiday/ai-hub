// =============================================================================
// Tests: GET /api/admin/users — Fallback-Logik bei kaputtem listUsers-Batch
// Szenario: batched-fetch (perPage=1000) schlaegt fehl, Fallback auf perPage=1.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks (vor Imports deklarieren)
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/admin-auth", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-id", role: "admin" }),
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUsers = [
    { id: "user-a", email: "a@example.com" },
    { id: "user-b", email: "b@example.com" },
    { id: "user-c", email: "c@example.com" },
];

const mockProfiles = [
    {
        id: "user-a",
        full_name: "User A",
        role: "user",
        created_at: "2026-01-01T00:00:00Z",
        last_login_at: null,
        xp: 0,
        level: 1,
        department: "",
        position: "",
        is_approved: true,
    },
];

/** Baut einen Supabase-Mock der je nach listUsers-Call Error oder User zurueckgibt. */
function buildMockWithFallback(options: {
    /** Ob der erste batched-Call (perPage=1000) einen Error wirft. */
    batchedFails: boolean;
    /** Users die per perPage=1-Fallback zurueckgegeben werden. */
    perUserPages: Array<{ id: string; email: string } | null>;
}) {
    let batchCallCount = 0;
    let fallbackCallCount = 0;

    const listUsers = vi.fn().mockImplementation(
        (args?: { page?: number; perPage?: number }) => {
            const perPage = args?.perPage ?? 50;

            if (perPage === 1000) {
                batchCallCount++;
                if (options.batchedFails) {
                    return Promise.resolve({
                        data: { users: [] },
                        error: { message: "Database error finding users", status: 500 },
                    });
                }
                // Batched-Call erfolgreich: gib alle Users auf einmal zurueck.
                return Promise.resolve({
                    data: { users: mockUsers.slice(0, 3) },
                    error: null,
                });
            }

            // perPage=1 Fallback-Aufruf
            const idx = fallbackCallCount;
            fallbackCallCount++;
            const entry = options.perUserPages[idx];
            if (entry === null) {
                // Diesen Offset ueberspringen (kaputte Metadaten)
                return Promise.resolve({
                    data: { users: [] },
                    error: { message: "Database error loading user", status: 500 },
                });
            }
            if (entry === undefined) {
                // Keine weiteren User — Ende der Pagination
                return Promise.resolve({ data: { users: [] }, error: null });
            }
            return Promise.resolve({ data: { users: [entry] }, error: null });
        }
    );

    const supabaseMock = {
        auth: { admin: { listUsers } },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        }),
    };

    return supabaseMock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/admin/users — Fallback-Logik", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("liefert 200 mit allen erreichbaren Usern wenn Batch-Fetch fehlschlaegt und Fallback greift", async () => {
        // Batch schlaegt fehl; Fallback liefert 2 OK-User, 1 kaputten (null) und dann Ende.
        const mock = buildMockWithFallback({
            batchedFails: true,
            perUserPages: [
                { id: "user-a", email: "a@example.com" },
                null, // defekter Datensatz — wird uebersprungen
                { id: "user-c", email: "c@example.com" },
                // undefined implizit => Ende
            ],
        });
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

        const { GET } = await import("@/app/api/admin/users/route");
        const req = new NextRequest("http://localhost/api/admin/users");
        const res = await GET(req);

        // Route darf nicht mit 500 abbrechen
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.error).toBeNull();
        // Profil-Daten muessen weiterhin zurueckkommen
        expect(Array.isArray(body.data)).toBe(true);
    });

    it("liefert 200 mit vollstaendiger Userliste wenn Batch-Fetch erfolgreich ist", async () => {
        const mock = buildMockWithFallback({
            batchedFails: false,
            perUserPages: [], // wird nicht benutzt
        });
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

        const { GET } = await import("@/app/api/admin/users/route");
        const req = new NextRequest("http://localhost/api/admin/users");
        const res = await GET(req);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.error).toBeNull();
        expect(Array.isArray(body.data)).toBe(true);

        // Kein Fallback genutzt: listUsers wurde genau einmal mit perPage=1000 aufgerufen
        const listUsersCalls = mock.auth.admin.listUsers.mock.calls;
        const batchedCalls = listUsersCalls.filter(
            (args) => args[0]?.perPage === 1000
        );
        expect(batchedCalls.length).toBe(1);

        // Kein perPage=1-Aufruf
        const fallbackCalls = listUsersCalls.filter(
            (args) => args[0]?.perPage === 1
        );
        expect(fallbackCalls.length).toBe(0);
    });

    it("aktiviert den Fallback-Pfad genau einmal pro Fehler (nicht erneut fuer folgende Batch-Pages)", async () => {
        const mock = buildMockWithFallback({
            batchedFails: true,
            perUserPages: [
                { id: "user-a", email: "a@example.com" },
                { id: "user-b", email: "b@example.com" },
                // Ende
            ],
        });
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

        const { GET } = await import("@/app/api/admin/users/route");
        const req = new NextRequest("http://localhost/api/admin/users");
        const res = await GET(req);

        expect(res.status).toBe(200);

        // Batch wurde genau 1x versucht (ist fehlgeschlagen)
        const allCalls = mock.auth.admin.listUsers.mock.calls;
        const batchedCalls = allCalls.filter((a) => a[0]?.perPage === 1000);
        expect(batchedCalls.length).toBe(1);

        // Fallback perPage=1 wurde genutzt
        const fallbackCalls = allCalls.filter((a) => a[0]?.perPage === 1);
        expect(fallbackCalls.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// POST /api/admin/users — createUserSchema Validierung (F06)
// ---------------------------------------------------------------------------

function buildPostMock(createUserResult: { data: { user: { id: string } | null }; error: { message: string } | null }) {
    return {
        auth: {
            admin: {
                createUser: vi.fn().mockResolvedValue(createUserResult),
                listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
            },
        },
        from: vi.fn().mockReturnValue({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
    };
}

function makePostRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/admin/users — role enum Validierung", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("lehnt unbekannte role ab (z.B. god_mode) mit 400", async () => {
        const mock = buildPostMock({ data: { user: { id: "new-user" } }, error: null });
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

        const { POST } = await import("@/app/api/admin/users/route");
        const res = await POST(makePostRequest({
            email: "test@example.com",
            password: "secret123",
            full_name: "Test User",
            role: "god_mode",
        }));

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).not.toBeNull();
        expect(mock.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it("akzeptiert alle erlaubten role-Werte", async () => {
        const allowedRoles = ["user", "moderator", "admin", "super_admin"] as const;

        for (const role of allowedRoles) {
            vi.clearAllMocks();
            vi.resetModules();

            const mock = buildPostMock({ data: { user: { id: "new-user" } }, error: null });
            (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

            const { POST } = await import("@/app/api/admin/users/route");
            const res = await POST(makePostRequest({
                email: "test@example.com",
                password: "secret123",
                full_name: "Test User",
                role,
            }));

            expect(res.status, `role '${role}' sollte akzeptiert werden`).toBe(200);
        }
    });

    it("akzeptiert gueltigen Body ohne role-Feld", async () => {
        const mock = buildPostMock({ data: { user: { id: "new-user" } }, error: null });
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

        const { POST } = await import("@/app/api/admin/users/route");
        const res = await POST(makePostRequest({
            email: "test@example.com",
            password: "secret123",
            full_name: "Test User",
        }));

        expect(res.status).toBe(200);
    });

    it("lehnt fehlende Pflichtfelder (email) mit 400 ab", async () => {
        const mock = buildPostMock({ data: { user: { id: "new-user" } }, error: null });
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

        const { POST } = await import("@/app/api/admin/users/route");
        const res = await POST(makePostRequest({
            password: "secret123",
            full_name: "Test User",
        }));

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).not.toBeNull();
        expect(mock.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it("lehnt ungueltige Email-Adresse mit 400 ab", async () => {
        const mock = buildPostMock({ data: { user: { id: "new-user" } }, error: null });
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

        const { POST } = await import("@/app/api/admin/users/route");
        const res = await POST(makePostRequest({
            email: "not-an-email",
            password: "secret123",
            full_name: "Test User",
        }));

        expect(res.status).toBe(400);
        expect(mock.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it("lehnt zu kurzes Passwort (< 8 Zeichen) mit 400 ab", async () => {
        const mock = buildPostMock({ data: { user: { id: "new-user" } }, error: null });
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

        const { POST } = await import("@/app/api/admin/users/route");
        const res = await POST(makePostRequest({
            email: "test@example.com",
            password: "short",
            full_name: "Test User",
        }));

        expect(res.status).toBe(400);
        expect(mock.auth.admin.createUser).not.toHaveBeenCalled();
    });
});
