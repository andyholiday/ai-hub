// =============================================================================
// Challenge Detail API
// GET  /api/challenges/[challengeId] - Get single challenge with details
// POST /api/challenges/[challengeId] - Join a challenge
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiNotFound,
  apiBadRequest,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Route context type
// ---------------------------------------------------------------------------

type RouteContext = {
  params: Promise<{ challengeId: string }>;
};

// ---------------------------------------------------------------------------
// GET - Get single challenge with participants and user progress
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { challengeId } = await context.params;
    const supabase = createAdminClient();

    // Fetch the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return apiNotFound("Challenge nicht gefunden");
    }

    // Fetch all participants
    const { data: participantRows } = await supabase
      .from("user_challenges")
      .select("user_id, progress, completed_at, joined_at")
      .eq("challenge_id", challengeId);

    // Fetch profiles for participants
    const participantUserIds = (participantRows ?? []).map((r) => r.user_id);
    const profileMap = new Map<
      string,
      { full_name: string | null; avatar_url: string | null }
    >();

    if (participantUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", participantUserIds);

      for (const p of profiles ?? []) {
        profileMap.set(p.id, {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        });
      }
    }

    const participants = (participantRows ?? []).map((row) => {
      const profile = profileMap.get(row.user_id);
      return {
        userId: row.user_id,
        name: profile?.full_name ?? "Unbekannt",
        avatarUrl: profile?.avatar_url ?? null,
        progress: row.progress,
        completedAt: row.completed_at,
        joinedAt: row.joined_at,
      };
    });

    // Check current user's participation
    const userEntry = participants.find((p) => p.userId === auth.userId);

    // Calculate time fields
    const endsAt = new Date(challenge.end_date);
    const startsAt = new Date(challenge.start_date);
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

    const frequencyMap: Record<string, "wochentlich" | "monatlich"> = {
      daily: "wochentlich",
      weekly: "wochentlich",
      special: "monatlich",
    };

    const enrichedChallenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      challengeType: challenge.type,
      difficulty: "beginner", // fallback since it's missing in type
      xpReward: challenge.xp_reward,
      badgeReward: null, // fallback
      startsAt: challenge.start_date,
      endsAt: challenge.end_date,
      maxParticipants: challenge.max_participants,
      isActive: challenge.is_active,
      daysRemaining,
      totalDays,
      frequency: frequencyMap[challenge.type] ?? "wochentlich",
      participantCount: participants.length,
      participants: participants.map((p) => ({
        userId: p.userId,
        name: p.name,
        avatarUrl: p.avatarUrl,
        progress: p.progress,
        completedAt: p.completedAt,
      })),
      userProgress: userEntry?.progress ?? null,
      userJoined: !!userEntry,
      userCompletedAt: userEntry?.completedAt ?? null,
      isCompleted: !!userEntry && userEntry.completedAt !== null,
    };

    return apiSuccess(enrichedChallenge);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// POST - Join a challenge
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { challengeId } = await context.params;
    const supabase = createAdminClient();

    // Check if challenge exists and is active
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id, is_active, end_date, max_participants")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return apiNotFound("Challenge nicht gefunden");
    }

    if (!challenge.is_active) {
      return apiBadRequest("Diese Challenge ist nicht mehr aktiv");
    }

    const now = new Date();
    if (new Date(challenge.end_date) <= now) {
      return apiBadRequest("Diese Challenge ist bereits beendet");
    }

    // Check if user already joined
    const { data: existingEntry } = await supabase
      .from("user_challenges")
      .select("user_id")
      .eq("user_id", auth.userId)
      .eq("challenge_id", challengeId)
      .single();

    if (existingEntry) {
      return apiBadRequest("Du nimmst bereits an dieser Challenge teil");
    }

    // Check max participants
    if (challenge.max_participants !== null) {
      const { count } = await supabase
        .from("user_challenges")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId);

      if (count !== null && count >= challenge.max_participants) {
        return apiBadRequest(
          "Die maximale Teilnehmerzahl fuer diese Challenge ist erreicht"
        );
      }
    }

    // Join the challenge
    const { error: insertError } = await supabase
      .from("user_challenges")
      .insert({
        user_id: auth.userId,
        challenge_id: challengeId,
        progress: 0,
      });

    if (insertError) {
      return apiInternalError(insertError.message);
    }

    return apiSuccess(
      { message: "Erfolgreich an der Challenge teilgenommen" },
      201
    );
  } catch {
    return apiInternalError();
  }
}
