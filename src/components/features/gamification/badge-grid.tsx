// =============================================================================
// Badge Grid Component
// Displays earned and locked gamification badges in a responsive grid
// =============================================================================

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Tooltip } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "achievement" | "skill" | "social" | "special";
  requirement: string;
  earned: boolean;
  earnedAt?: string; // ISO date string
}

export interface BadgeGridProps {
  badges: UserBadge[];
  className?: string;
}

// -----------------------------------------------------------------------------
// Icon Map (Lucide-style SVG icons)
// -----------------------------------------------------------------------------

function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    footprints: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5 10 7.19 9 8.5 9 10.5c0 2 1 3.5 1 3.5" />
        <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 1.69 1 3 1 5 0 2-1 3.5-1 3.5" />
        <path d="M4 16H10" />
        <path d="M14 20H20" />
      </svg>
    ),
    pencil: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    ),
    "graduation-cap": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
    trophy: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    terminal: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    wrench: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    heart: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    star: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    rocket: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
    flame: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  };

  return <>{iconMap[icon] || iconMap["star"]}</>;
}

// -----------------------------------------------------------------------------
// Category Config
// -----------------------------------------------------------------------------

const categoryConfig: Record<
  string,
  { label: string; colorClass: string; bgClass: string }
> = {
  achievement: {
    label: "Erfolg",
    colorClass: "text-brand-primary-600",
    bgClass: "bg-brand-primary-50",
  },
  skill: {
    label: "Skill",
    colorClass: "text-info-dark",
    bgClass: "bg-info-light",
  },
  social: {
    label: "Social",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
  },
  special: {
    label: "Spezial",
    colorClass: "text-brand-accent-700",
    bgClass: "bg-brand-accent-50",
  },
};

// -----------------------------------------------------------------------------
// Badge Card Sub-component
// -----------------------------------------------------------------------------

function BadgeCard({ badge }: { badge: UserBadge }) {
  const cat = categoryConfig[badge.category] ?? categoryConfig.achievement!;

  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const tooltipContent = badge.earned
    ? `${badge.description} (Erhalten am ${earnedDate})`
    : `${badge.description} -- Bedingung: ${badge.requirement.replace(/_/g, " ")}`;

  return (
    <Tooltip content={tooltipContent} position="top">
      <div
        className={cn(
          "group flex flex-col items-center rounded-xl border p-4 text-center",
          "transition-all duration-200",
          badge.earned
            ? "border-surface-200 bg-white shadow-card hover:-translate-y-0.5 hover:shadow-card-hover cursor-default"
            : "border-dashed border-surface-300 bg-surface-50 opacity-60 grayscale hover:opacity-80 hover:grayscale-[50%] cursor-default"
        )}
        role="listitem"
        aria-label={`${badge.name}${badge.earned ? " (verdient)" : " (noch nicht verdient)"}`}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            badge.earned ? cat.bgClass : "bg-surface-200"
          )}
        >
          <BadgeIcon
            icon={badge.icon}
            className={cn(
              "h-6 w-6",
              badge.earned ? cat.colorClass : "text-surface-400"
            )}
          />
        </div>

        {/* Name */}
        <p
          className={cn(
            "mt-2.5 font-heading text-body-sm font-semibold leading-tight",
            badge.earned ? "text-surface-900" : "text-surface-500"
          )}
        >
          {badge.name}
        </p>

        {/* Date or Lock indicator */}
        {badge.earned && earnedDate ? (
          <p className="mt-1 text-caption text-surface-400">{earnedDate}</p>
        ) : (
          <div className="mt-1.5 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3 w-3 text-surface-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1zm2 6V4.5a2 2 0 1 0-4 0V7h4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[0.625rem] text-surface-400">Gesperrt</span>
          </div>
        )}
      </div>
    </Tooltip>
  );
}

// -----------------------------------------------------------------------------
// Filter Tabs
// -----------------------------------------------------------------------------

const categories = [
  { key: "all", label: "Alle" },
  { key: "achievement", label: "Erfolge" },
  { key: "skill", label: "Skills" },
  { key: "social", label: "Social" },
  { key: "special", label: "Spezial" },
] as const;

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function BadgeGrid({ badges, className }: BadgeGridProps) {
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? badges
      : badges.filter((b) => b.category === filter);

  // Sort: earned first, then alphabetically
  const sorted = [...filtered].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return a.name.localeCompare(b.name, "de");
  });

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-heading text-title font-semibold text-surface-900">
          Badges
          <span className="ml-2 text-body-sm font-medium text-surface-400">
            {earnedCount}/{badges.length}
          </span>
        </h3>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-caption font-medium transition-all duration-150",
              filter === cat.key
                ? "bg-brand-primary-500 text-white shadow-sm"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        role="list"
        aria-label="Badge-Sammlung"
      >
        {sorted.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}
