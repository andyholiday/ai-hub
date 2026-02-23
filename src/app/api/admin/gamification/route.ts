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

        // 1. Fetch courses
        const { data: courses, error: err1 } = await supabase
            .from("courses")
            .select("id, title, category, difficulty, xp_reward, is_published");

        if (err1) return apiInternalError(err1.message);

        // 2. Fetch badges
        const { data: badges, error: err2 } = await supabase
            .from("badges")
            .select("id, name, description, category, xp_threshold");

        if (err2) return apiInternalError(err2.message);

        // 3. Fetch challenges
        const { data: challenges, error: err3 } = await supabase
            .from("challenges")
            .select("id, title, description, xp_reward, end_date");

        if (err3) return apiInternalError(err3.message);

        return apiSuccess({
            courses: courses || [],
            badges: badges || [],
            challenges: challenges || [],
        });
    } catch {
        return apiInternalError();
    }
}
