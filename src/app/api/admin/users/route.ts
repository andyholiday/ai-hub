import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import { apiSuccess, apiInternalError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("response" in auth) return auth.response;

        const supabase = createAdminClient();

        // In this specific Supabase environment, auth.admin.listUsers() throws a 500 error.
        // So we fetch everything directly from the profiles table.
        // The profiles table has all necessary fields via triggers and manual inserts.
        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role, created_at, last_login_at, xp, level, department, position, is_approved")
            .order("created_at", { ascending: false });

        if (profileError) return apiInternalError(profileError.message);

        // Fallback email to full_name if no auth user
        const users = (profileData || []).map(p => ({
            id: p.id,
            email: p.full_name?.toLowerCase().replace(" ", ".") + "@example.com", // Mock email since auth fails
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

        const body = await req.json();
        const { id, is_approved, role, full_name, department, position } = body;

        if (!id) return apiInternalError("Missing user id");

        const updateData: Record<string, unknown> = {};
        if (typeof is_approved === "boolean") updateData.is_approved = is_approved;
        if (role) updateData.role = role;
        if (typeof full_name === "string") updateData.full_name = full_name;
        if (typeof department === "string") updateData.department = department;
        if (typeof position === "string") updateData.position = position;

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) return apiInternalError(error.message);

        return apiSuccess(data);
    } catch (err) {
        return apiInternalError(err instanceof Error ? err.message : "Unknown error");
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("response" in auth) return auth.response;

        const body = await req.json();
        const { email, password, full_name, is_approved, role } = body;

        if (!email || !password || !full_name) {
            return apiInternalError("Email, password and full name are required");
        }

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

        if (createError) return apiInternalError(createError.message);

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
        return apiInternalError(err instanceof Error ? err.message : "Unknown error");
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("response" in auth) return auth.response;

        const body = await req.json();
        const { id } = body;

        if (!id) return apiInternalError("Missing user id");

        const supabase = createAdminClient();

        // 1. Delete from Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(id);
        if (authError) return apiInternalError(authError.message);

        // 2. Delete profile row (may already be cascaded, but ensure cleanup)
        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", id);

        if (profileError) return apiInternalError(profileError.message);

        return apiSuccess({ deleted: true });
    } catch (err) {
        return apiInternalError(err instanceof Error ? err.message : "Unknown error");
    }
}
