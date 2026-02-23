// =============================================================================
// Leaderboard API
// GET /api/leaderboard?period=week|month|all&limit=20
// Returns ranked users ordered by XP, with optional current-user highlighting.
//
// OPTIMIZED:
// - Single database function call (get_leaderboard_optimized) replaces
//   2-4 sequential queries.
// - Cache-Control header: leaderboard data is cached for 60 seconds.
//   This prevents redundant fetches when multiple users load the dashboard.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { apiInternalError, apiValidationError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { leaderboardQuerySchema } from "@/lib/validators/leaderboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardResponse {
  entries: Array<{
    rank: number;
    id: string;
    name: string;
    avatarUrl: string | null;
    department: string | null;
    level: number;
    xp: number;
    isCurrentUser: boolean;
  }>;
  totalActiveUsers: number;
  currentUserRank: number | null;
  currentUserXp: number | null;
  currentUserLevel: number | null;
  period: "week" | "month" | "all";
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    // --- Parse and validate query params ---
    const { searchParams } = new URL(req.url);
    const queryRaw = {
      period: searchParams.get("period") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const parsed = leaderboardQuerySchema.safeParse(queryRaw);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { period, limit } = parsed.data;

    // --- Optional auth (don't fail if unauthenticated) ---
    const auth = await requireAuth(req);
    const currentUserId = !("response" in auth) ? auth.userId : null;

    const supabase = createAdminClient();
    const cappedLimit = Math.min(limit, 50);

    // --- Try optimized RPC first (requires migration 00009) ---
    const { data: rawData, error: rpcError } = await supabase.rpc("get_leaderboard_optimized", {
      current_user_id: currentUserId,
      limit_count: cappedLimit,
    });

    let result: LeaderboardResponse;

    if (!rpcError) {
      // RPC succeeded - use optimized result
      const data = rawData as unknown as {
        entries: LeaderboardResponse["entries"];
        totalActiveUsers: number;
        currentUserRank: number | null;
        currentUserXp: number | null;
        currentUserLevel: number | null;
      } | null;

      result = {
        entries: data?.entries ?? [],
        totalActiveUsers: data?.totalActiveUsers ?? 0,
        currentUserRank: data?.currentUserRank ?? null,
        currentUserXp: data?.currentUserXp ?? null,
        currentUserLevel: data?.currentUserLevel ?? null,
        period,
      };
    } else {
      // -----------------------------------------------------------------
      // FALLBACK: RPC function not available (migration 00009 not applied)
      // Try direct table queries, but gracefully handle permission errors.
      // -----------------------------------------------------------------

      // 1. Fetch top profiles ordered by XP
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, department, level, xp")
        .order("xp", { ascending: false })
        .limit(cappedLimit);

      if (profilesError) {
        // Table GRANTs missing - return empty leaderboard gracefully
        console.warn(
          "[Leaderboard API] Table access denied, returning empty result:",
          profilesError.message,
        );
        result = {
          entries: [],
          totalActiveUsers: 0,
          currentUserRank: null,
          currentUserXp: null,
          currentUserLevel: null,
          period,
        };
      } else {
        const entries: LeaderboardResponse["entries"] = (profiles ?? []).map(
          (p: Record<string, unknown>, index: number) => ({
            rank: index + 1,
            id: p.id as string,
            name: (p.full_name as string) ?? "Unbekannt",
            avatarUrl: (p.avatar_url as string) ?? null,
            department: (p.department as string) ?? null,
            level: (p.level as number) ?? 1,
            xp: (p.xp as number) ?? 0,
            isCurrentUser: currentUserId !== null && p.id === currentUserId,
          }),
        );

        // 2. Total active users
        const { count: totalCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gt("xp", 0);

        // 3. Current user rank
        let currentUserRank: number | null = null;
        let currentUserXp: number | null = null;
        let currentUserLevel: number | null = null;

        if (currentUserId) {
          const { data: currentUser } = await supabase
            .from("profiles")
            .select("xp, level")
            .eq("id", currentUserId)
            .single();

          if (currentUser) {
            currentUserXp = (currentUser.xp as number) ?? 0;
            currentUserLevel = (currentUser.level as number) ?? 1;

            const { count: higherCount } = await supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .gt("xp", currentUserXp);

            currentUserRank = (higherCount ?? 0) + 1;
          }
        }

        result = {
          entries,
          totalActiveUsers: totalCount ?? 0,
          currentUserRank,
          currentUserXp,
          currentUserLevel,
          period,
        };
      }
    }

    // Return with Cache-Control: leaderboard data is valid for 60 seconds.
    const response = NextResponse.json(
      { data: result, error: null },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      },
    );

    return response;
  } catch {
    return apiInternalError();
  }
}
