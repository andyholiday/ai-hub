import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-auth";
import { apiSuccess, apiInternalError, apiBadRequest, apiValidationError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserSchema } from "@/lib/validators/admin";

// ---------------------------------------------------------------------------
// F01 Fix: Zod-Schema fuer PATCH-Body — verhindert role="" Header-Trigger
// ---------------------------------------------------------------------------

const PatchUserSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "admin", "super_admin"]).optional(),
  is_approved: z.boolean().optional(),
  full_name: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("response" in auth) return auth.response;

        const rl = await rateLimit(req, "admin", auth.userId);
        if (!rl.success) {
            return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
        }

        const supabase = createAdminClient();

        // Fetch all auth users via paginated loop (default listUsers() returns only 50).
        // Pagination ensures the email map is complete even for > 1 000 users.
        // Fallback: if batched fetch fails (e.g. corrupted metadata in one record),
        // re-page with perPage=1 and skip individual broken users rather than failing entirely.
        const PER_PAGE = 1000;
        let page = 1;
        const allAuthUsers: { id: string; email?: string }[] = [];
        let usedFallback = false;
        let fallbackSkipCount = 0;

        batchLoop: while (true) {
            const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
            if (authError) {
                if (!usedFallback) {
                    // Switch to per-user pagination to survive one broken record.
                    usedFallback = true;
                    console.warn("[/api/admin/users] fell back to per-user pagination after batched-fetch failed");
                    // Re-fetch all pages with perPage=1, skipping broken offsets.
                    let fallbackPage = 1;
                    while (true) {
                        const { data: singleData, error: singleError } = await supabase.auth.admin.listUsers({ page: fallbackPage, perPage: 1 });
                        if (singleError) {
                            // Skip this offset — one bad user record should not abort the list.
                            console.warn(`[/api/admin/users] failed to fetch user metadata at offset ${fallbackPage} — skipping`);
                            fallbackSkipCount++;
                            fallbackPage++;
                            // Safety valve: stop after too many consecutive errors to avoid infinite loops.
                            if (fallbackSkipCount > 100) break;
                            continue;
                        }
                        if (!singleData.users || singleData.users.length === 0) break;
                        allAuthUsers.push(...singleData.users);
                        fallbackPage++;
                    }
                    break batchLoop;
                }
                console.error("[admin/users] GET auth pagination fallback failed:", authError);
                return apiInternalError("Benutzerliste konnte nicht geladen werden");
            }
            allAuthUsers.push(...(authData.users ?? []));
            if ((authData.users ?? []).length < PER_PAGE) break;
            page++;
        }

        // Build a lookup map: auth user id → email
        const emailMap = new Map<string, string>(
            allAuthUsers.map(u => [u.id, u.email ?? ""])
        );

        // Fetch profile data to enrich with app-level fields
        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role, created_at, last_login_at, xp, level, department, position, is_approved")
            .order("created_at", { ascending: false });

        if (profileError) {
            console.error("[admin/users] GET profiles query failed:", profileError);
            return apiInternalError("Benutzerliste konnte nicht geladen werden");
        }

        const users = (profileData || []).map(p => ({
            id: p.id,
            email: emailMap.get(p.id) ?? "",
            full_name: p.full_name || 'User',
            role: p.role || 'user',
            created_at: p.created_at,
            last_sign_in_at: p.last_login_at || p.created_at,
            xp: p.xp || 0,
            level: p.level || 1,
            department: p.department || '',
            position: p.position || '',
            is_approved: p.is_approved
        }));

        return apiSuccess(users);
    } catch {
        return apiInternalError();
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("response" in auth) return auth.response;

        const rl = await rateLimit(req, "admin", auth.userId);
        if (!rl.success) {
            return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
        }

        const rawBody: unknown = await req.json();
        const parsed = PatchUserSchema.safeParse(rawBody);
        if (!parsed.success) {
            return apiBadRequest("INVALID_BODY");
        }

        const { id, is_approved, role, full_name, department, position } = parsed.data;

        const updateData: Record<string, unknown> = {};
        if (typeof is_approved === "boolean") updateData.is_approved = is_approved;
        if (role !== undefined) updateData.role = role;
        if (typeof full_name === "string") updateData.full_name = full_name;
        if (typeof department === "string") updateData.department = department;
        if (typeof position === "string") updateData.position = position;

        const supabase = createAdminClient();

        // Fetch current role to determine if role actually changed (ADR-016)
        let previousRole: string | undefined;
        if (role !== undefined) {
            const { data: current } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", id)
                .single();
            previousRole = current?.role;
        }

        const { data, error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("[admin/users] PATCH profiles update failed:", error);
            return apiInternalError("Benutzer konnte nicht aktualisiert werden");
        }

        // Signal to client that a role change happened (ADR-016).
        // Client should call supabase.auth.refreshSession() to sync JWT.
        // Only set header when role is explicitly in body AND differs from DB value.
        const roleChanged = role !== undefined && role !== previousRole;
        const res = apiSuccess(data);
        if (roleChanged) {
            res.headers.set("X-Role-Changed", "true");
        }
        return res;
    } catch (err) {
        console.error("[admin/users] PATCH unexpected error:", err);
        return apiInternalError("Benutzer konnte nicht aktualisiert werden");
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("response" in auth) return auth.response;

        const rl = await rateLimit(req, "admin", auth.userId);
        if (!rl.success) {
            return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
        }

        const rawBody: unknown = await req.json();
        const parsed = createUserSchema.safeParse(rawBody);
        if (!parsed.success) {
            return apiValidationError(parsed.error);
        }

        const { email, password, full_name, is_approved, role } = parsed.data;

        const supabase = createAdminClient();

        // Ensure email isn't fake if it needs to be verified, but auto-verify it anyway
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
            }
        });

        if (createError) {
            console.error("[admin/users] POST createUser failed:", createError);
            return apiInternalError("Benutzer konnte nicht erstellt werden");
        }

        // Update the profile manually via trigger or explicitly to set is_approved and role
        if (userData.user && (is_approved || role)) {
            await supabase
                .from("profiles")
                .update({
                    is_approved: is_approved ?? true,
                    role: role || 'user'
                })
                .eq("id", userData.user.id);
        }

        return apiSuccess(userData.user);
    } catch (err) {
        console.error("[admin/users] POST unexpected error:", err);
        return apiInternalError("Benutzer konnte nicht erstellt werden");
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("response" in auth) return auth.response;

        const rl = await rateLimit(req, "admin", auth.userId);
        if (!rl.success) {
            return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
        }

        const body = await req.json();
        const { id } = body;

        if (!id) return apiBadRequest("Missing user id");

        const supabase = createAdminClient();

        // GDPR Art. 30: write erasure audit entry BEFORE deleting the user.
        const { data: erasureRow, error: insertError } = await supabase
            .from("gdpr_erasure_log")
            .insert({ user_id: id })
            .select("id")
            .single();

        if (insertError || !erasureRow) {
            return apiInternalError("Audit-Log konnte nicht geschrieben werden.");
        }

        // 1. Delete from Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(id);

        if (authError) {
            // Audit record stays with deleted_at = NULL as a failed-attempt marker.
            console.error("[admin/users] DELETE auth.deleteUser failed:", authError);
            return apiInternalError("Benutzer konnte nicht gelöscht werden");
        }

        // Mark erasure as complete in the audit log.
        const { error: updateError } = await supabase
            .from("gdpr_erasure_log")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", erasureRow.id);

        if (updateError) {
            console.error(
                JSON.stringify({
                    event: "erasure_log_update_failed",
                    user_id: id,
                    erasure_log_id: erasureRow.id,
                    error: updateError.message,
                }),
            );
        }

        // 2. Delete profile row (may already be cascaded, but ensure cleanup)
        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", id);

        if (profileError) {
            console.error("[admin/users] DELETE profile cleanup failed:", profileError);
            return apiInternalError("Benutzer konnte nicht vollständig gelöscht werden");
        }

        return apiSuccess({ deleted: true });
    } catch (err) {
        console.error("[admin/users] DELETE unexpected error:", err);
        return apiInternalError("Benutzer konnte nicht gelöscht werden");
    }
}
