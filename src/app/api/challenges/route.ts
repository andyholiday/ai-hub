// =============================================================================
// Challenges API
// GET /api/challenges - List challenges with status filter
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { listChallengesQuerySchema } from "@/lib/validators/challenges";

// ---------------------------------------------------------------------------
// GET - List challenges
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const queryRaw = {
      status: searchParams.get("status") ?? undefined,
    };

    const parsed = listChallengesQuerySchema.safeParse(queryRaw);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { status } = parsed.data;
    const supabase = createAdminClient();

    // ----- Fetch challenges based on status filter -----
    let challengeQuery = supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (status === "active") {
      challengeQuery = challengeQuery
        .eq("is_active", true)
        .gt("ends_at", new Date().toISOString());
    }

    const { data: challenges, error: challengesError } = await challengeQuery;

    if (challengesError) {
      return apiInternalError(challengesError.message);
    }

    if (!challenges || challenges.length === 0) {
      return apiSuccess([]);
    }

    const challengeIds = challenges.map((c) => c.id);

    // ----- Fetch participant counts for each challenge -----
    const { data: participantCounts } = await supabase
      .from("user_challenges")
      .select("challenge_id")
      .in("challenge_id", challengeIds);

    const countMap = new Map<string, number>();
    for (const row of participantCounts ?? []) {
      countMap.set(row.challenge_id, (countMap.get(row.challenge_id) ?? 0) + 1);
    }

    // ----- Fetch current user's challenge entries -----
    const { data: userEntries } = await supabase
      .from("user_challenges")
      .select("challenge_id, progress, completed_at, joined_at")
      .eq("user_id", auth.userId)
      .in("challenge_id", challengeIds);

    const userMap = new Map(
      (userEntries ?? []).map((entry) => [entry.challenge_id, entry])
    );

    // ----- Fetch a sample of participants per challenge for avatars -----
    const { data: participantRows } = await supabase
      .from("user_challenges")
      .select("challenge_id, user_id")
      .in("challenge_id", challengeIds);

    // Collect unique user IDs for profile lookup
    const allUserIds = [
      ...new Set((participantRows ?? []).map((r) => r.user_id)),
    ];

    // Fetch profiles for these users
    const profileMap = new Map<
      string,
      { full_name: string | null; avatar_url: string | null }
    >();
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", allUserIds);

      for (const p of profiles ?? []) {
        profileMap.set(p.id, {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        });
      }
    }

    // Group participants per challenge (up to 4 for avatar display)
    const participantsMap = new Map<
      string,
      { name: string; avatarUrl?: string }[]
    >();
    for (const row of participantRows ?? []) {
      const existing = participantsMap.get(row.challenge_id) ?? [];
      if (existing.length < 4) {
        const profile = profileMap.get(row.user_id);
        existing.push({
          name: profile?.full_name ?? "Unbekannt",
          avatarUrl: profile?.avatar_url ?? undefined,
        });
        participantsMap.set(row.challenge_id, existing);
      }
    }

    // ----- Filter for "completed" status -----
    let filteredChallenges = challenges;
    if (status === "completed") {
      const completedIds = new Set(
        (userEntries ?? [])
          .filter((e) => e.completed_at !== null)
          .map((e) => e.challenge_id)
      );
      filteredChallenges = challenges.filter((c) => completedIds.has(c.id));
    }

    // ----- Enrich challenges with computed fields -----
    const enrichedChallenges = filteredChallenges.map((challenge) => {
      const userEntry = userMap.get(challenge.id);
      const endsAt = new Date(challenge.ends_at);
      const startsAt = new Date(challenge.starts_at);
      const now = new Date();
      const daysRemaining = Math.max(
        0,
        Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      const totalDays = Math.max(
        1,
        Math.ceil(
          (endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      // Map challenge_type to German frequency labels
      const frequencyMap: Record<string, "wochentlich" | "monatlich"> = {
        daily: "wochentlich",
        weekly: "wochentlich",
        special: "monatlich",
      };

      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        challengeType: challenge.challenge_type,
        difficulty: challenge.difficulty,
        xpReward: challenge.xp_reward,
        badgeReward: challenge.badge_reward,
        startsAt: challenge.starts_at,
        endsAt: challenge.ends_at,
        maxParticipants: challenge.max_participants,
        isActive: challenge.is_active,
        daysRemaining,
        totalDays,
        frequency: frequencyMap[challenge.challenge_type] ?? "wochentlich",
        participantCount: countMap.get(challenge.id) ?? 0,
        participants: participantsMap.get(challenge.id) ?? [],
        userProgress: userEntry?.progress ?? null,
        userJoined: !!userEntry,
        userCompletedAt: userEntry?.completed_at ?? null,
        isCompleted: userEntry?.completed_at !== null && !!userEntry,
      };
    });

    return apiSuccess(enrichedChallenges);
  } catch {
    return apiInternalError();
  }
}
