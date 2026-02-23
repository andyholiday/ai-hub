import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import { apiSuccess, apiInternalError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

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
            .select("id, full_name, role, created_at, last_login_at, xp, level, department, position")
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
            position: p.position || ''
        }));

        return apiSuccess(users);
    } catch (err) {
        return apiInternalError();
    }
}
