// =============================================================================
// Profile Page
// User profile with level display, badges, stats, and activity timeline
// Fetches real data from Supabase via /api/profile
// =============================================================================

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Avatar, Badge, Button, Card, StatCard } from "@/components/ui";
import {
  LevelDisplay,
  BadgeGrid,
  ActivityTimeline,
  type UserBadge,
  type ActivityEvent,
} from "@/components/features/gamification";
import { BADGES } from "@/constants/gamification";
import { LEVELS } from "@/constants/gamification";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ProfileData {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  department: string | null;
  position: string | null;
  bio: string | null;
  xp: number;
  level: number;
  role: "user" | "moderator" | "admin" | "super_admin";
  streak_days: number;
  last_login_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface BadgeData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: "achievement" | "skill" | "social" | "special";
  earned_at: string;
}

interface ProfileApiResponse {
  data: {
    profile: ProfileData;
    badges: BadgeData[];
    stats: {
      postsCount: number;
      coursesCompleted: number;
    };
  } | null;
  error: { code: string; message: string } | null;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getLevelTitle(level: number): string {
  const lvl = LEVELS.find((l) => l.level === level);
  return lvl?.title ?? "KI-Neuling";
}

// -----------------------------------------------------------------------------
// Stat Icons
// -----------------------------------------------------------------------------

function XPIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" />
    </svg>
  );
}

function RankIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
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

function FlameIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Loading Skeleton
// -----------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
      {/* Header Card Skeleton */}
      <Card className="!p-0 overflow-hidden">
        <div className="h-28 bg-surface-200 sm:h-36" />
        <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="absolute -top-10 left-5 sm:-top-12 sm:left-6">
            <div className="h-20 w-20 rounded-full bg-surface-200 ring-4 ring-white sm:h-24 sm:w-24" />
          </div>
          <div className="flex justify-end pt-2">
            <div className="h-8 w-36 rounded-lg bg-surface-200" />
          </div>
          <div className="mt-4 sm:mt-2 space-y-3">
            <div className="h-7 w-48 rounded bg-surface-200" />
            <div className="flex gap-4">
              <div className="h-4 w-28 rounded bg-surface-200" />
              <div className="h-4 w-24 rounded bg-surface-200" />
            </div>
            <div className="h-12 w-full max-w-2xl rounded bg-surface-200" />
          </div>
        </div>
      </Card>

      {/* Level Skeleton */}
      <div className="h-32 rounded-2xl border border-surface-200 bg-white" />

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-surface-200 bg-white" />
        ))}
      </div>

      {/* Badges Skeleton */}
      <Card>
        <div className="space-y-4">
          <div className="h-6 w-32 rounded bg-surface-200" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-surface-200 bg-surface-50" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<BadgeData[]>([]);
  const [stats, setStats] = useState({ postsCount: 0, coursesCompleted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/profile");
      const json: ProfileApiResponse = await res.json();

      if (json.error || !json.data) {
        setError(json.error?.message ?? "Profil konnte nicht geladen werden.");
        return;
      }

      setProfile(json.data.profile);
      setEarnedBadges(json.data.badges);
      setStats(json.data.stats);
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Loading State ---
  if (loading) {
    return <ProfileSkeleton />;
  }

  // --- Error State ---
  if (error || !profile) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="text-center py-12">
          <p className="text-body text-surface-500">
            {error ?? "Profil nicht gefunden."}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={fetchProfile}
          >
            Erneut versuchen
          </Button>
        </Card>
      </div>
    );
  }

  // --- Build badge data for BadgeGrid ---
  // Merge the static BADGES definitions with the user's earned badges from the DB
  const earnedBadgeKeys = new Set(earnedBadges.map((b) => b.key));
  const earnedBadgeMap = new Map(earnedBadges.map((b) => [b.key, b]));

  const userBadges: UserBadge[] = BADGES.map((badge) => {
    const earned = earnedBadgeKeys.has(badge.id);
    const dbBadge = earnedBadgeMap.get(badge.id);

    return {
      ...badge,
      earned,
      earnedAt: dbBadge?.earned_at,
    };
  });

  // --- Derived values ---
  const displayName = profile.full_name ?? profile.username ?? "Unbekannt";
  const levelTitle = getLevelTitle(profile.level);

  // --- Demo activity events (activity log table does not exist yet) ---
  const activityEvents: ActivityEvent[] = [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* Profile Header Card */}
      <Card className="!p-0 overflow-hidden">
        {/* Green gradient banner */}
        <div className="h-28 bg-lr-gradient sm:h-36" />

        {/* Profile info */}
        <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
          {/* Avatar overlapping banner */}
          <div className="absolute -top-10 left-5 sm:-top-12 sm:left-6">
            <div className="rounded-full ring-4 ring-white">
              <Avatar
                name={displayName}
                src={profile.avatar_url}
                size="lg"
                className="!h-20 !w-20 sm:!h-24 sm:!w-24 [&>div]:!h-full [&>div]:!w-full [&>div>span]:!text-headline"
              />
            </div>
          </div>

          {/* Edit button */}
          <div className="flex justify-end pt-2">
            <Link href="/profile/settings">
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<EditIcon />}
              >
                Profil bearbeiten
              </Button>
            </Link>
          </div>

          {/* Name + Info */}
          <div className="mt-4 sm:mt-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-headline font-bold text-surface-900">
                {displayName}
              </h1>
              <Badge variant="green" size="md">
                Lvl {profile.level} &ndash; {levelTitle}
              </Badge>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-surface-500">
              {profile.position && (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M3.75 2a.75.75 0 000 1.5h.531a1 1 0 01.714.286l.112.11a2.5 2.5 0 001.25.658V14H5.25a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5H9.643V4.554a2.5 2.5 0 001.252-.657l.11-.111A1 1 0 0111.72 3.5h.53a.75.75 0 000-1.5h-8.5z" clipRule="evenodd" />
                  </svg>
                  {profile.position}
                </span>
              )}
              {profile.department && (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h7.5A2.25 2.25 0 0114 4.25v5.5A2.25 2.25 0 0111.75 12h-1.312c-.1.495-.312.953-.614 1.349a.75.75 0 01-1.148 0 3.746 3.746 0 01-.614-1.349H6.25A2.25 2.25 0 014 9.75v-5.5z" clipRule="evenodd" />
                  </svg>
                  {profile.department}
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 max-w-2xl text-body-sm leading-relaxed text-surface-600">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Level Display */}
      <LevelDisplay currentXP={profile.xp} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="XP Gesamt"
          value={profile.xp.toLocaleString("de-DE")}
          icon={<XPIcon />}
          iconVariant="gold"
        />
        <StatCard
          label="Level"
          value={profile.level}
          change={levelTitle}
          changeDirection="neutral"
          icon={<LevelIcon />}
          iconVariant="green"
        />
        <StatCard
          label="Rolle"
          value={profile.role === "super_admin" ? "Super Admin" : profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          icon={<RankIcon />}
          iconVariant="purple"
        />
        <StatCard
          label="Beitraege"
          value={stats.postsCount}
          icon={<PenIcon />}
          iconVariant="blue"
        />
        <StatCard
          label="Kurse"
          value={stats.coursesCompleted}
          change="Abgeschlossen"
          changeDirection="neutral"
          icon={<BookIcon />}
          iconVariant="green"
        />
        <StatCard
          label="Streak"
          value={`${profile.streak_days} Tage`}
          icon={<FlameIcon />}
          iconVariant="gold"
        />
      </div>

      {/* Badges Section */}
      <Card>
        <BadgeGrid badges={userBadges} />
      </Card>

      {/* Activity Timeline */}
      {activityEvents.length > 0 && (
        <Card>
          <ActivityTimeline events={activityEvents} />
        </Card>
      )}
    </div>
  );
}
