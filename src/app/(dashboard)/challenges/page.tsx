// =============================================================================
// Challenges Page
// Active and completed challenges with card grid
// =============================================================================

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui";
import { ChallengeCard } from "@/components/features/gamification";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Tab = "active" | "completed";

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
// Demo Data
// -----------------------------------------------------------------------------

const participants = [
  { name: "Lisa Peters" },
  { name: "Markus Koenig" },
  { name: "Julia Richter" },
  { name: "Thomas Wagner" },
  { name: "Anna Mueller" },
];

const activeChallenges = [
  {
    id: "ch-1",
    title: "KI-Prozessoptimierung",
    description:
      "Identifiziere einen Prozess in deiner Abteilung, der mit KI optimiert werden kann, und dokumentiere den Use Case.",
    icon: <ProcessIcon />,
    xpReward: 75,
    daysRemaining: 4,
    totalDays: 7,
    participants: participants.slice(0, 4),
    totalParticipants: 18,
    progress: 35,
    frequency: "wochentlich" as const,
  },
  {
    id: "ch-2",
    title: "5 Best Practices lesen",
    description:
      "Lies diese Woche 5 Best Practices aus der Bibliothek und bewerte mindestens 3 davon.",
    icon: <BookIcon />,
    xpReward: 25,
    daysRemaining: 2,
    totalDays: 7,
    participants: participants.slice(0, 3),
    totalParticipants: 32,
    progress: 60,
    frequency: "wochentlich" as const,
  },
  {
    id: "ch-3",
    title: "AI Mentor 10x fragen",
    description:
      "Stelle dem AI Mentor in dieser Woche mindestens 10 Fragen zu KI-Themen.",
    icon: <ChatIcon />,
    xpReward: 30,
    daysRemaining: 5,
    totalDays: 7,
    participants: participants.slice(1, 4),
    totalParticipants: 25,
    progress: 0,
    frequency: "wochentlich" as const,
  },
  {
    id: "ch-4",
    title: "KI-Idee mit Score >80 einreichen",
    description:
      "Reiche eine KI-Idee beim AI Mentor ein und erreiche einen Bewertungsscore von mindestens 80 Punkten.",
    icon: <LightbulbIcon />,
    xpReward: 100,
    daysRemaining: 15,
    totalDays: 30,
    participants: participants.slice(0, 2),
    totalParticipants: 8,
    progress: 0,
    frequency: "monatlich" as const,
  },
];

const completedChallenges = [
  {
    id: "ch-5",
    title: "Erste Best Practice schreiben",
    description: "Verfasse und veroeffentliche deine erste Best Practice in der Bibliothek.",
    icon: <TrophyIcon />,
    xpReward: 50,
    daysRemaining: 0,
    totalDays: 7,
    participants: participants.slice(0, 3),
    totalParticipants: 45,
    progress: 100,
    isCompleted: true,
    result: "Erfolgreich abgeschlossen am 12.02.2026",
    frequency: "wochentlich" as const,
  },
  {
    id: "ch-6",
    title: "7-Tage Login-Streak",
    description: "Logge dich 7 Tage hintereinander in die Plattform ein.",
    icon: <FlameIcon />,
    xpReward: 35,
    daysRemaining: 0,
    totalDays: 7,
    participants: participants.slice(0, 2),
    totalParticipants: 67,
    progress: 100,
    isCompleted: true,
    result: "Erfolgreich abgeschlossen am 08.02.2026",
    frequency: "wochentlich" as const,
  },
];

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function ChallengesPage() {
  const [tab, setTab] = useState<Tab>("active");

  const challenges = tab === "active" ? activeChallenges : completedChallenges;

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
            <span className="ml-1.5 rounded-full bg-lr-green-100 px-1.5 py-0.5 text-overline font-semibold text-lr-green-700">
              {activeChallenges.length}
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
              {completedChallenges.length}
            </span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Aktive Challenges"
          value={activeChallenges.length}
          icon={<TargetIcon />}
          iconVariant="green"
        />
        <StatCard
          label="Abgeschlossen"
          value={completedChallenges.length}
          change="Insgesamt"
          changeDirection="neutral"
          icon={<TrophyIcon />}
          iconVariant="gold"
        />
        <StatCard
          label="Verdiente XP"
          value="85"
          change="Durch Challenges"
          changeDirection="neutral"
          icon={<FlameIcon />}
          iconVariant="purple"
        />
        <StatCard
          label="Aktuelle Streak"
          value="12 Tage"
          change="+3 seit letzter Woche"
          changeDirection="up"
          icon={<FlameIcon />}
          iconVariant="blue"
        />
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            {...challenge}
            onJoin={() => { /* TODO: implement join handler */ }}
            onContinue={() => { /* TODO: implement continue handler */ }}
          />
        ))}
      </div>

      {/* Empty state for completed */}
      {challenges.length === 0 && (
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
