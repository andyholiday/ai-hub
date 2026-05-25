import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import { apiSuccess, apiInternalError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

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

        // 1. Fetch courses
        const { data: courses, error: err1 } = await supabase
            .from("courses")
            .select("id, title, category, difficulty, xp_reward, is_published");

        if (err1) {
            console.error("[admin/gamification] fetch courses:", err1);
            return apiInternalError("Interner Fehler");
        }

        // 2. Fetch badges
        const { data: badges, error: err2 } = await supabase
            .from("badges")
            .select("id, name, description, category, xp_threshold");

        if (err2) {
            console.error("[admin/gamification] fetch badges:", err2);
            return apiInternalError("Interner Fehler");
        }

        // 3. Fetch challenges
        const { data: challenges, error: err3 } = await supabase
            .from("challenges")
            .select("id, title, description, xp_reward, end_date");

        if (err3) {
            console.error("[admin/gamification] fetch challenges:", err3);
            return apiInternalError("Interner Fehler");
        }

        return apiSuccess({
            courses: courses || [],
            badges: badges || [],
            challenges: challenges || [],
        });
    } catch {
        return apiInternalError();
    }
}
