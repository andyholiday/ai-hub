// =============================================================================
// Challenge Detail Page
// Full detail view with progress tracking, participants, and join functionality
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardBody,
  Button,
  Badge,
  Avatar,
  ProgressBar,
} from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ChallengeParticipant {
  userId: string;
  name: string;
  avatarUrl: string | null;
  progress: number;
  completedAt: string | null;
}

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  challengeType: "daily" | "weekly" | "special";
  difficulty: "beginner" | "intermediate" | "advanced";
  xpReward: number;
  badgeReward: string | null;
  startsAt: string;
  endsAt: string;
  maxParticipants: number | null;
  isActive: boolean;
  daysRemaining: number;
  totalDays: number;
  frequency: "wochentlich" | "monatlich";
  participantCount: number;
  participants: ChallengeParticipant[];
  userProgress: number | null;
  userJoined: boolean;
  userCompletedAt: string | null;
  isCompleted: boolean;
}

// -----------------------------------------------------------------------------
// Icon Components
// -----------------------------------------------------------------------------

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Difficulty badge helpers
// -----------------------------------------------------------------------------

const difficultyLabels: Record<string, string> = {
  beginner: "Einsteiger",
  intermediate: "Fortgeschritten",
  advanced: "Experte",
};

const difficultyVariants: Record<string, "green" | "gold" | "red"> = {
  beginner: "green",
  intermediate: "gold",
  advanced: "red",
};

const challengeTypeLabels: Record<string, string> = {
  daily: "Taeglich",
  weekly: "Woechentlich",
  special: "Spezial",
};

// -----------------------------------------------------------------------------
// Loading Skeleton
// -----------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
      <div className="h-6 w-32 rounded bg-surface-200" />
      <div className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6">
        <div className="h-8 w-2/3 rounded bg-surface-200" />
        <div className="h-4 w-full rounded bg-surface-100" />
        <div className="h-4 w-3/4 rounded bg-surface-100" />
        <div className="flex gap-3 mt-4">
          <div className="h-8 w-24 rounded-full bg-surface-200" />
          <div className="h-8 w-24 rounded-full bg-surface-200" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-surface-200 bg-white" />
        ))}
      </div>
      <div className="rounded-2xl border border-surface-200 bg-white p-6">
        <div className="h-5 w-40 rounded bg-surface-200 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="h-8 w-8 rounded-full bg-surface-200" />
            <div className="h-4 w-32 rounded bg-surface-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch challenge detail ----
  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}`);
      const json = await res.json();

      if (json.data) {
        setChallenge(json.data);
        setError(null);
      } else {
        setError(json.error?.message ?? "Challenge nicht gefunden");
      }
    } catch {
      setError("Fehler beim Laden der Challenge");
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  // ---- Join handler ----
  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchChallenge();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? "Fehler beim Beitreten");
      }
    } catch {
      setError("Fehler beim Beitreten");
    } finally {
      setJoining(false);
    }
  };

  // ---- Update progress handler (demo: increment by 25) ----
  const handleUpdateProgress = async () => {
    if (!challenge) return;
    setUpdatingProgress(true);

    const currentProgress = challenge.userProgress ?? 0;
    const newProgress = Math.min(100, currentProgress + 25);

    try {
      const res = await fetch(`/api/challenges/${challengeId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: newProgress }),
      });

      if (res.ok) {
        await fetchChallenge();
      } else {
        const json = await res.json();
        setError(json.error?.message ?? "Fehler beim Aktualisieren");
      }
    } catch {
      setError("Fehler beim Aktualisieren");
    } finally {
      setUpdatingProgress(false);
    }
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="animate-fade-in">
        <DetailSkeleton />
      </div>
    );
  }

  // ---- Error state ----
  if (error && !challenge) {
    return (
      <div className="mx-auto max-w-4xl animate-fade-in">
        <button
          onClick={() => router.push("/challenges")}
          className="mb-6 inline-flex items-center gap-2 text-body-sm font-medium text-surface-500 hover:text-surface-700 transition-colors"
        >
          <span className="h-4 w-4"><ArrowLeftIcon /></span>
          Zurueck zu Challenges
        </button>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-16 text-center">
          <h3 className="font-heading text-title font-semibold text-surface-900">
            {error}
          </h3>
          <p className="mt-2 text-body-sm text-surface-500">
            Die angeforderte Challenge konnte nicht geladen werden.
          </p>
          <Button
            variant="primary"
            size="md"
            className="mt-6"
            onClick={() => router.push("/challenges")}
          >
            Zurueck zu Challenges
          </Button>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  // ---- Derived state ----
  const isExpired = challenge.daysRemaining === 0 && !challenge.isCompleted;
  const canJoin = !challenge.userJoined && challenge.isActive && challenge.daysRemaining > 0;
  const canUpdateProgress = challenge.userJoined && !challenge.isCompleted && challenge.daysRemaining > 0;
  const timePercentage = Math.max(0, (challenge.daysRemaining / challenge.totalDays) * 100);
  const isTimeUrgent = challenge.daysRemaining <= 2 && challenge.daysRemaining > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      {/* Back navigation */}
      <button
        onClick={() => router.push("/challenges")}
        className="inline-flex items-center gap-2 text-body-sm font-medium text-surface-500 hover:text-surface-700 transition-colors"
      >
        <span className="h-4 w-4"><ArrowLeftIcon /></span>
        Zurueck zu Challenges
      </button>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Challenge Card */}
      <Card accent={challenge.isCompleted ? "none" : "green"}>
        <div className="flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading text-headline-lg font-bold text-surface-900">
                  {challenge.title}
                </h1>
                {challenge.isCompleted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-50 px-3 py-1 text-body-sm font-semibold text-brand-primary-700">
                    <span className="h-4 w-4"><CheckCircleIcon /></span>
                    Abgeschlossen
                  </span>
                )}
              </div>
              <p className="mt-2 text-body text-surface-600 leading-relaxed">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold" size="md">
              +{challenge.xpReward} XP
            </Badge>
            <Badge
              variant={difficultyVariants[challenge.difficulty] ?? "gray"}
              size="md"
            >
              {difficultyLabels[challenge.difficulty] ?? challenge.difficulty}
            </Badge>
            <Badge
              variant={challenge.challengeType === "special" ? "purple" : "blue"}
              size="md"
            >
              {challengeTypeLabels[challenge.challengeType] ?? challenge.challengeType}
            </Badge>
            {challenge.badgeReward && (
              <Badge variant="gold" size="md" dot>
                Badge: {challenge.badgeReward}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Time remaining */}
        <Card>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                isTimeUrgent
                  ? "bg-red-50 text-red-500"
                  : "bg-brand-primary-50 text-brand-primary-600",
                "[&>svg]:h-5 [&>svg]:w-5"
              )}
            >
              <ClockIcon />
            </div>
            <div>
              <p className="text-caption font-medium text-surface-500">Verbleibende Zeit</p>
              <p
                className={cn(
                  "text-title font-bold",
                  isTimeUrgent ? "text-red-600" : "text-surface-900"
                )}
              >
                {challenge.daysRemaining} {challenge.daysRemaining === 1 ? "Tag" : "Tage"}
              </p>
            </div>
          </div>
          <CardBody>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isTimeUrgent
                    ? "bg-gradient-to-r from-red-400 to-orange-400"
                    : "bg-gradient-to-r from-brand-primary-400 to-brand-primary-500"
                )}
                style={{ width: `${timePercentage}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Participants */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 [&>svg]:h-5 [&>svg]:w-5">
              <UsersIcon />
            </div>
            <div>
              <p className="text-caption font-medium text-surface-500">Teilnehmer</p>
              <p className="text-title font-bold text-surface-900">
                {challenge.participantCount}
                {challenge.maxParticipants
                  ? ` / ${challenge.maxParticipants}`
                  : ""}
              </p>
            </div>
          </div>
        </Card>

        {/* XP Reward */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent-50 text-brand-accent-600 [&>svg]:h-5 [&>svg]:w-5">
              <StarIcon />
            </div>
            <div>
              <p className="text-caption font-medium text-surface-500">XP Belohnung</p>
              <p className="text-title font-bold text-surface-900">
                +{challenge.xpReward} XP
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* User Progress Section */}
      {challenge.userJoined && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-title font-semibold text-surface-900">
              Dein Fortschritt
            </h2>
            {challenge.isCompleted && challenge.userCompletedAt && (
              <span className="text-body-sm font-medium text-brand-primary-600">
                Abgeschlossen am{" "}
                {new Date(challenge.userCompletedAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <ProgressBar
            value={challenge.userProgress ?? 0}
            variant={challenge.isCompleted ? "green" : "gradient"}
            size="lg"
            label="Fortschritt"
            showLabel
          />
          {canUpdateProgress && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                size="md"
                isLoading={updatingProgress}
                loadingText="Aktualisiere..."
                onClick={handleUpdateProgress}
              >
                Fortschritt aktualisieren (+25%)
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Join / Actions */}
      {!challenge.userJoined && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600 [&>svg]:h-7 [&>svg]:w-7">
              <TrophyIcon />
            </div>
            <div>
              <h2 className="font-heading text-title font-semibold text-surface-900">
                An dieser Challenge teilnehmen?
              </h2>
              <p className="mt-1 max-w-md text-body-sm text-surface-500">
                Nimm teil, verfolge deinen Fortschritt und verdiene {challenge.xpReward} XP
                bei erfolgreichem Abschluss.
              </p>
            </div>
            {canJoin ? (
              <Button
                variant="primary"
                size="lg"
                isLoading={joining}
                loadingText="Trete bei..."
                onClick={handleJoin}
              >
                Teilnehmen
              </Button>
            ) : isExpired ? (
              <p className="text-body-sm font-medium text-surface-600">
                Diese Challenge ist bereits beendet.
              </p>
            ) : null}
          </div>
        </Card>
      )}

      {/* Participants List */}
      <Card>
        <h2 className="font-heading text-title font-semibold text-surface-900 mb-4">
          Teilnehmer ({challenge.participantCount})
        </h2>

        {challenge.participants.length === 0 ? (
          <p className="text-body-sm text-surface-500 py-4 text-center">
            Noch keine Teilnehmer. Sei der Erste!
          </p>
        ) : (
          <div className="divide-y divide-surface-100">
            {challenge.participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={participant.name}
                    src={participant.avatarUrl}
                    size="sm"
                  />
                  <div>
                    <p className="text-body-sm font-medium text-surface-900">
                      {participant.name}
                    </p>
                    {participant.completedAt && (
                      <p className="text-caption text-brand-primary-600">
                        Abgeschlossen
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 hidden sm:block">
                    <ProgressBar
                      value={participant.progress}
                      size="sm"
                      variant={participant.completedAt ? "green" : "gradient"}
                      showLabel={false}
                    />
                  </div>
                  <span className="text-caption font-semibold tabular-nums text-surface-600 w-10 text-right">
                    {participant.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Challenge Timeline / Metadata */}
      <Card>
        <h2 className="font-heading text-title font-semibold text-surface-900 mb-4">
          Details
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <span className="text-caption font-medium text-surface-500">Start:</span>
            <span className="text-body-sm text-surface-700">
              {new Date(challenge.startsAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-caption font-medium text-surface-500">Ende:</span>
            <span className="text-body-sm text-surface-700">
              {new Date(challenge.endsAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-caption font-medium text-surface-500">Typ:</span>
            <span className="text-body-sm text-surface-700">
              {challengeTypeLabels[challenge.challengeType] ?? challenge.challengeType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-caption font-medium text-surface-500">Schwierigkeit:</span>
            <span className="text-body-sm text-surface-700">
              {difficultyLabels[challenge.difficulty] ?? challenge.difficulty}
            </span>
          </div>
          {challenge.maxParticipants && (
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium text-surface-500">Max. Teilnehmer:</span>
              <span className="text-body-sm text-surface-700">
                {challenge.maxParticipants}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
