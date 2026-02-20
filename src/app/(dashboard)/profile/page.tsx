// =============================================================================
// Profile Page
// User profile with level display, badges, stats, and activity timeline
// =============================================================================

"use client";

import React from "react";
import { Avatar, Badge, Button, Card, StatCard } from "@/components/ui";
import {
  LevelDisplay,
  BadgeGrid,
  ActivityTimeline,
  type UserBadge,
  type ActivityEvent,
} from "@/components/features/gamification";
import { BADGES } from "@/constants/gamification";

// -----------------------------------------------------------------------------
// Demo Data
// -----------------------------------------------------------------------------

const currentUser = {
  name: "Sarah Hoffmann",
  department: "Vertrieb",
  position: "Sales Manager",
  bio: "Begeisterte KI-Anwenderin mit Fokus auf Vertriebsoptimierung durch kuenstliche Intelligenz. Immer auf der Suche nach innovativen Wegen, um Kundenerlebnisse zu verbessern.",
  xp: 2340,
  level: 7,
  levelTitle: "KI-Spezialist",
  rank: 7,
  contributions: 18,
  coursesCompleted: 6,
  streak: 12,
};

// Build badge data from constants - some earned, some not
const userBadges: UserBadge[] = BADGES.map((badge) => {
  const earnedBadges: Record<string, string> = {
    "first-steps": "2025-11-15",
    "first-practice": "2025-12-03",
    "course-graduate": "2025-12-20",
    "challenge-winner": "2026-01-14",
    "helpful": "2026-02-01",
    "early-adopter": "2025-11-15",
  };

  return {
    ...badge,
    earned: badge.id in earnedBadges,
    earnedAt: earnedBadges[badge.id],
  };
});

const activityEvents: ActivityEvent[] = [
  {
    id: "ev-1",
    type: "xp_earned",
    title: "XP fuer taeglichen Login erhalten",
    xp: 10,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  },
  {
    id: "ev-2",
    type: "challenge_completed",
    title: "Challenge \"7-Tage Login-Streak\" abgeschlossen",
    description: "Du hast die Streak-Challenge gemeistert!",
    xp: 35,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
  },
  {
    id: "ev-3",
    type: "badge_earned",
    title: "Badge \"Hilfreich\" erhalten",
    description: "50 Likes auf deine Beitraege - grossartig!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
  },
  {
    id: "ev-4",
    type: "best_practice_created",
    title: "Best Practice veroeffentlicht",
    description: "\"KI-gestuetzte Angebotserstellung im Vertrieb\"",
    xp: 50,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2d ago
  },
  {
    id: "ev-5",
    type: "course_completed",
    title: "Kurs \"Prompt Engineering Grundlagen\" abgeschlossen",
    description: "Zertifikat erhalten",
    xp: 100,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3d ago
  },
  {
    id: "ev-6",
    type: "level_up",
    title: "Level Up! Du bist jetzt Level 7",
    description: "KI-Spezialist - Herzlichen Glueckwunsch!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3d ago
  },
  {
    id: "ev-7",
    type: "xp_earned",
    title: "XP fuer Kurs-Lektion erhalten",
    xp: 25,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4d ago
  },
  {
    id: "ev-8",
    type: "comment",
    title: "Kommentar in der Community gepostet",
    description: "Diskussion: \"Beste KI-Tools fuer Vertrieb\"",
    xp: 5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5d ago
  },
  {
    id: "ev-9",
    type: "login_streak",
    title: "10-Tage Streak erreicht!",
    description: "Du bist seit 10 Tagen taeglich aktiv.",
    xp: 20,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(), // 7d ago
  },
];

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
// Page Component
// -----------------------------------------------------------------------------

export default function ProfilePage() {
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
                name={currentUser.name}
                size="lg"
                className="!h-20 !w-20 sm:!h-24 sm:!w-24 [&>div]:!h-full [&>div]:!w-full [&>div>span]:!text-headline"
              />
            </div>
          </div>

          {/* Edit button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<EditIcon />}
            >
              Profil bearbeiten
            </Button>
          </div>

          {/* Name + Info */}
          <div className="mt-4 sm:mt-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-headline font-bold text-surface-900">
                {currentUser.name}
              </h1>
              <Badge variant="green" size="md">
                Lvl {currentUser.level} &ndash; {currentUser.levelTitle}
              </Badge>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-surface-500">
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M3.75 2a.75.75 0 000 1.5h.531a1 1 0 01.714.286l.112.11a2.5 2.5 0 001.25.658V14H5.25a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5H9.643V4.554a2.5 2.5 0 001.252-.657l.11-.111A1 1 0 0111.72 3.5h.53a.75.75 0 000-1.5h-8.5z" clipRule="evenodd" />
                </svg>
                {currentUser.position}
              </span>
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h7.5A2.25 2.25 0 0114 4.25v5.5A2.25 2.25 0 0111.75 12h-1.312c-.1.495-.312.953-.614 1.349a.75.75 0 01-1.148 0 3.746 3.746 0 01-.614-1.349H6.25A2.25 2.25 0 014 9.75v-5.5z" clipRule="evenodd" />
                </svg>
                {currentUser.department}
              </span>
            </div>

            {/* Bio */}
            <p className="mt-3 max-w-2xl text-body-sm leading-relaxed text-surface-600">
              {currentUser.bio}
            </p>
          </div>
        </div>
      </Card>

      {/* Level Display */}
      <LevelDisplay currentXP={currentUser.xp} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="XP Gesamt"
          value={currentUser.xp.toLocaleString("de-DE")}
          icon={<XPIcon />}
          iconVariant="gold"
        />
        <StatCard
          label="Level"
          value={currentUser.level}
          change={currentUser.levelTitle}
          changeDirection="neutral"
          icon={<LevelIcon />}
          iconVariant="green"
        />
        <StatCard
          label="Rang"
          value={`#${currentUser.rank}`}
          change="Top 5%"
          changeDirection="up"
          icon={<RankIcon />}
          iconVariant="purple"
        />
        <StatCard
          label="Beitraege"
          value={currentUser.contributions}
          change="+3 diesen Monat"
          changeDirection="up"
          icon={<PenIcon />}
          iconVariant="blue"
        />
        <StatCard
          label="Kurse"
          value={currentUser.coursesCompleted}
          change="Abgeschlossen"
          changeDirection="neutral"
          icon={<BookIcon />}
          iconVariant="green"
        />
        <StatCard
          label="Streak"
          value={`${currentUser.streak} Tage`}
          change="Persoenlicher Rekord!"
          changeDirection="up"
          icon={<FlameIcon />}
          iconVariant="gold"
        />
      </div>

      {/* Badges Section */}
      <Card>
        <BadgeGrid badges={userBadges} />
      </Card>

      {/* Activity Timeline */}
      <Card>
        <ActivityTimeline events={activityEvents} />
      </Card>
    </div>
  );
}
