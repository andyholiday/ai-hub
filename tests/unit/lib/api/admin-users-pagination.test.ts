// =============================================================================
// Tests: Admin Users Route — listUsers Pagination (F02 fix)
// Verifies that all auth users are fetched across multiple pages, not just the
// first 50 (Supabase default) or first 1000.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks (must be declared before imports that use them)
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/admin-auth", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-id", role: "admin" }),
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { createAdminClient } from "@/lib/supabase/admin";

/** Build a mock Supabase admin client whose listUsers returns `pages` chunks. */
function buildSupabaseMock(pages: { id: string; email: string }[][]) {
    let callCount = 0;
    const listUsers = vi.fn().mockImplementation(() => {
        const users = pages[callCount] ?? [];
        callCount++;
        return Promise.resolve({ data: { users }, error: null });
    });

    return {
        auth: { admin: { listUsers } },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/admin/users — listUsers pagination (F02)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("fetches a single page when user count < perPage", async () => {
        const page1 = Array.from({ length: 3 }, (_, i) => ({
            id: `user-${i}`,
            email: `user${i}@example.com`,
        }));

        const supabaseMock = buildSupabaseMock([page1]);
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);

        const { GET } = await import("@/app/api/admin/users/route");
        const req = new NextRequest("http://localhost/api/admin/users");
        await GET(req);

        expect(supabaseMock.auth.admin.listUsers).toHaveBeenCalledTimes(1);
        expect(supabaseMock.auth.admin.listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
    });

    it("fetches multiple pages when first page is full (perPage = 1000)", async () => {
        // Simulate exactly 2 pages: first full (1000 users), second partial (5 users).
        const page1 = Array.from({ length: 1000 }, (_, i) => ({
            id: `user-${i}`,
            email: `user${i}@example.com`,
        }));
        const page2 = Array.from({ length: 5 }, (_, i) => ({
            id: `user-${1000 + i}`,
            email: `user${1000 + i}@example.com`,
        }));

        const supabaseMock = buildSupabaseMock([page1, page2]);
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);

        const { GET } = await import("@/app/api/admin/users/route");
        const req = new NextRequest("http://localhost/api/admin/users");
        await GET(req);

        expect(supabaseMock.auth.admin.listUsers).toHaveBeenCalledTimes(2);
        expect(supabaseMock.auth.admin.listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 });
        expect(supabaseMock.auth.admin.listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
    });

    it("returns 500 when listUsers errors on any page", async () => {
        const supabaseMock = {
            auth: {
                admin: {
                    listUsers: vi.fn().mockResolvedValue({
                        data: { users: [] },
                        error: { message: "Auth service unavailable" },
                    }),
                },
            },
            from: vi.fn(),
        };
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);

        const { GET } = await import("@/app/api/admin/users/route");
        const req = new NextRequest("http://localhost/api/admin/users");
        const res = await GET(req);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error.message).toBe("Auth service unavailable");
    });

    it("stops paginating exactly when last page has fewer users than perPage", async () => {
        // Three pages: 1000 / 1000 / 999 — loop must stop after page 3, not fetch page 4.
        const fullPage = Array.from({ length: 1000 }, (_, i) => ({
            id: `u-${i}`,
            email: `u${i}@example.com`,
        }));
        const partialPage = Array.from({ length: 999 }, (_, i) => ({
            id: `u-${2000 + i}`,
            email: `u${2000 + i}@example.com`,
        }));

        const supabaseMock = buildSupabaseMock([fullPage, fullPage, partialPage]);
        (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);

        const { GET } = await import("@/app/api/admin/users/route");
        const req = new NextRequest("http://localhost/api/admin/users");
        await GET(req);

        expect(supabaseMock.auth.admin.listUsers).toHaveBeenCalledTimes(3);
    });
});
