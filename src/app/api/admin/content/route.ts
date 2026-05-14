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

        // Fetch best practices 
        const { data: practices, error: bpError } = await supabase
            .from("best_practices")
            .select("id, title, status, views_count, upvotes_count, category, is_featured, created_at, profiles(full_name)")
            .order("created_at", { ascending: false })
            .limit(20);

        if (bpError) {
            console.error("[admin/content] fetch best_practices:", bpError);
            return apiInternalError("Interner Fehler");
        }

        // Fetch community posts
        const { data: posts, error: postError } = await supabase
            .from("community_posts")
            .select("id, title, type, category, views_count, upvotes_count, created_at, profiles(full_name)")
            .order("created_at", { ascending: false })
            .limit(20);

        if (postError) {
            console.error("[admin/content] fetch community_posts:", postError);
            return apiInternalError("Interner Fehler");
        }

        return apiSuccess({
            bestPractices: practices,
            communityPosts: posts
        });
    } catch {
        return apiInternalError();
    }
}
