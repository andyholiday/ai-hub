// =============================================================================
// Challenges Page
// Active and completed challenges with card grid - connected to real API
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui";
import { ChallengeCard } from "@/components/features/gamification";
import type { ChallengeParticipant } from "@/components/features/gamification";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Tab = "active" | "completed";

interface ApiChallenge {
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
  participants: { name: string; avatarUrl?: string }[];
  userProgress: number | null;
  userJoined: boolean;
  userCompletedAt: string | null;
  isCompleted: boolean;
}

// -----------------------------------------------------------------------------
// Challenge Icon Components
// -----------------------------------------------------------------------------

function ProcessIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
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

function TargetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Icon Picker Helper
// -----------------------------------------------------------------------------

const challengeIcons: Record<string, React.ReactNode> = {
  daily: <FlameIcon />,
  weekly: <TargetIcon />,
  special: <TrophyIcon />,
};

function getChallengeIcon(
  challengeType: string,
  index: number
): React.ReactNode {
  const iconPool = [
    <ProcessIcon key="process" />,
    <BookIcon key="book" />,
    <ChatIcon key="chat" />,
    <LightbulbIcon key="lightbulb" />,
    <TrophyIcon key="trophy" />,
    <TargetIcon key="target" />,
    <FlameIcon key="flame" />,
  ];

  return challengeIcons[challengeType] ?? iconPool[index % iconPool.length];
}

// -----------------------------------------------------------------------------
// Loading Skeleton
// -----------------------------------------------------------------------------

function ChallengeCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-surface-200 bg-white p-5 shadow-card animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-surface-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-surface-200" />
          <div className="h-4 w-full rounded bg-surface-100" />
          <div className="h-4 w-2/3 rounded bg-surface-100" />
        </div>
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-surface-200" />
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-6 rounded-full bg-surface-200 ring-2 ring-white" />
          ))}
        </div>
        <div className="h-8 w-24 rounded-lg bg-surface-200" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function ChallengesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("active");
  const [challenges, setChallenges] = useState<ApiChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  // Stats derived from data
  const [allActiveChallenges, setAllActiveChallenges] = useState<ApiChallenge[]>([]);
  const [allCompletedChallenges, setAllCompletedChallenges] = useState<ApiChallenge[]>([]);

  // ---- Fetch challenges from API ----
  const fetchChallenges = useCallback(async (status: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges?status=${status}`);
      const json = await res.json();

      if (json.data) {
        setChallenges(json.data);
      } else {
        setChallenges([]);
      }
    } catch {
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats for both tabs on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const [activeRes, completedRes] = await Promise.all([
          fetch("/api/challenges?status=active"),
          fetch("/api/challenges?status=completed"),
        ]);
        const [activeJson, completedJson] = await Promise.all([
          activeRes.json(),
          completedRes.json(),
        ]);
        setAllActiveChallenges(activeJson.data ?? []);
        setAllCompletedChallenges(completedJson.data ?? []);
      } catch {
        // Stats will stay at 0
      }
    }
    fetchStats();
  }, []);

  // Fetch challenges when tab changes
  useEffect(() => {
    fetchChallenges(tab);
  }, [tab, fetchChallenges]);

  // ---- Join handler ----
  const handleJoin = async (challengeId: string) => {
    setJoining(challengeId);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "POST",
      });
      if (res.ok) {
        // Refresh the list and stats
        await fetchChallenges(tab);
        // Update stats
        const activeRes = await fetch("/api/challenges?status=active");
        const activeJson = await activeRes.json();
        setAllActiveChallenges(activeJson.data ?? []);
      }
    } catch {
      // Silently fail for now
    } finally {
      setJoining(null);
    }
  };

  // ---- Continue handler ----
  const handleContinue = (challengeId: string) => {
    router.push(`/challenges/${challengeId}`);
  };

  // ---- Compute stats ----
  const activeCount = allActiveChallenges.length;
  const completedCount = allCompletedChallenges.length;
  const earnedXP = allCompletedChallenges.reduce(
    (sum, c) => sum + c.xpReward,
    0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-headline-lg font-bold text-surface-900">
            Challenges
          </h1>
          <p className="mt-1 text-body text-surface-500">
            Nimm an Challenges teil, sammle XP und beweise dein KI-Wissen.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-surface-100 p-1">
          <button
            onClick={() => setTab("active")}
            className={cn(
              "rounded-lg px-4 py-2 text-body-sm font-medium transition-all duration-200",
              tab === "active"
                ? "bg-white text-surface-900 shadow-sm"
                : "text-surface-500 hover:text-surface-700"
            )}
          >
            Aktive
            <span className="ml-1.5 rounded-full bg-brand-primary-100 px-1.5 py-0.5 text-overline font-semibold text-brand-primary-700">
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => setTab("completed")}
            className={cn(
              "rounded-lg px-4 py-2 text-body-sm font-medium transition-all duration-200",
              tab === "completed"
                ? "bg-white text-surface-900 shadow-sm"
                : "text-surface-500 hover:text-surface-700"
            )}
          >
            Abgeschlossene
            <span className="ml-1.5 rounded-full bg-surface-200 px-1.5 py-0.5 text-overline font-semibold text-surface-600">
              {completedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Aktive Challenges"
          value={activeCount}
          icon={<TargetIcon />}
          iconVariant="green"
        />
        <StatCard
          label="Abgeschlossen"
          value={completedCount}
          change="Insgesamt"
          changeDirection="neutral"
          icon={<TrophyIcon />}
          iconVariant="gold"
        />
        <StatCard
          label="Verdiente XP"
          value={earnedXP.toString()}
          change="Durch Challenges"
          changeDirection="neutral"
          icon={<FlameIcon />}
          iconVariant="purple"
        />
        <StatCard
          label="Teilnahmen"
          value={allActiveChallenges.filter((c) => c.userJoined).length + completedCount}
          change="Aktiv + Abgeschlossen"
          changeDirection="neutral"
          icon={<FlameIcon />}
          iconVariant="blue"
        />
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <ChallengeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Challenge Cards Grid */}
      {!loading && challenges.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {challenges.map((challenge, index) => {
            const participants: ChallengeParticipant[] = challenge.participants.map(
              (p) => ({
                name: p.name,
                avatarUrl: p.avatarUrl,
              })
            );

            return (
              <ChallengeCard
                key={challenge.id}
                id={challenge.id}
                title={challenge.title}
                description={challenge.description}
                icon={getChallengeIcon(challenge.challengeType, index)}
                xpReward={challenge.xpReward}
                daysRemaining={challenge.daysRemaining}
                totalDays={challenge.totalDays}
                participants={participants}
                totalParticipants={challenge.participantCount}
                progress={challenge.userProgress ?? 0}
                isCompleted={challenge.isCompleted}
                result={
                  challenge.userCompletedAt
                    ? `Erfolgreich abgeschlossen am ${new Date(challenge.userCompletedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`
                    : undefined
                }
                frequency={challenge.frequency}
                onJoin={() => {
                  if (joining !== challenge.id) {
                    handleJoin(challenge.id);
                  }
                }}
                onContinue={() => handleContinue(challenge.id)}
              />
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && challenges.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <TrophyIcon />
          </div>
          <h3 className="mt-4 font-heading text-title font-semibold text-surface-900">
            Keine Challenges
          </h3>
          <p className="mt-1 max-w-sm text-body-sm text-surface-500">
            {tab === "active"
              ? "Aktuell sind keine aktiven Challenges verfuegbar. Schau spaeter nochmal vorbei!"
              : "Du hast noch keine Challenges abgeschlossen. Starte jetzt deine erste Challenge!"}
          </p>
        </div>
      )}
    </div>
  );
}
