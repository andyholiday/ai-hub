// =============================================================================
// StatsGrid Component
// Dashboard statistics cards row with staggered fade-in animation.
// Fetches real user data via DashboardDataProvider context.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { Zap, BookOpen, Lightbulb, Trophy } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDashboardContext } from "./dashboard-data-provider";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface StatItem {
  label: string;
  value: string;
  change: string;
  changeDirection: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

interface StatsGridProps {
  className?: string;
}

// -----------------------------------------------------------------------------
// Skeleton Card
// -----------------------------------------------------------------------------

function StatCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        "relative rounded-[14px] border border-surface-200 bg-white p-5",
        "shadow-card animate-pulse"
      )}
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {/* Label skeleton */}
      <div className="h-3 w-20 rounded bg-surface-200" />

      {/* Icon skeleton (top-right) */}
      <div className="absolute right-4 top-4 h-10 w-10 rounded-xl bg-surface-100" />

      {/* Value skeleton */}
      <div className="mt-3 h-7 w-16 rounded bg-surface-200" />

      {/* Change skeleton */}
      <div className="mt-2 h-3 w-24 rounded bg-surface-100" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Error State
// -----------------------------------------------------------------------------

function StatsGridError({ message }: { message: string }) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-red-200 bg-red-50 p-5",
        "text-sm text-red-600"
      )}
    >
      <p className="font-medium">Statistiken konnten nicht geladen werden</p>
      <p className="mt-1 text-xs text-red-500">{message}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Change Arrow
// -----------------------------------------------------------------------------

function ChangeArrow({ direction }: { direction: "up" | "down" | "neutral" }) {
  if (direction === "neutral") return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn(
        "h-3.5 w-3.5 shrink-0",
        direction === "down" && "rotate-180"
      )}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 3.293l4.354 4.354a.5.5 0 01-.708.708L8.5 5.207V12.5a.5.5 0 01-1 0V5.207L4.354 8.354a.5.5 0 11-.708-.708L8 3.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Build Stats from Dashboard Data
// -----------------------------------------------------------------------------

function buildStats(
  xpTotal: number,
  coursesCompleted: number,
  badgeCount: number,
  communityRank: number | null
): StatItem[] {
  return [
    {
      label: "Deine XP",
      value: xpTotal.toLocaleString("de-DE"),
      change: `Level-Fortschritt aktiv`,
      changeDirection: "up" as const,
      icon: <Zap className="h-5 w-5 text-brand-primary-500" />,
      iconBg: "bg-brand-primary-50",
      valueColor: "text-brand-primary-500",
    },
    {
      label: "Abgeschlossene Kurse",
      value: String(coursesCompleted),
      change: coursesCompleted === 0 ? "Starte deinen ersten Kurs" : `${coursesCompleted} abgeschlossen`,
      changeDirection: coursesCompleted > 0 ? ("up" as const) : ("neutral" as const),
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      iconBg: "bg-blue-50",
    },
    {
      label: "Badges",
      value: String(badgeCount),
      change: badgeCount === 0 ? "Sammle dein erstes Badge" : `${badgeCount} verdient`,
      changeDirection: badgeCount > 0 ? ("up" as const) : ("neutral" as const),
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      iconBg: "bg-orange-50",
    },
    {
      label: "Community Rang",
      value: communityRank !== null ? `#${communityRank}` : "-",
      change: communityRank !== null ? "Aktiv im Ranking" : "Noch nicht platziert",
      changeDirection: communityRank !== null ? ("up" as const) : ("neutral" as const),
      icon: <Trophy className="h-5 w-5 text-purple-500" />,
      iconBg: "bg-purple-50",
    },
  ];
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function StatsGrid({ className }: StatsGridProps) {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, error } = useDashboardContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
          className
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return <StatsGridError message={error} />;
  }

  // No data
  if (!data) {
    return null;
  }

  const stats = buildStats(
    data.xpTotal,
    data.coursesCompleted,
    data.badgeCount,
    data.communityRank
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            // Base card styles
            "relative rounded-[14px] border border-surface-200 bg-white p-5",
            "shadow-card",
            "transition-all duration-300 ease-out",
            // Hover
            "hover:-translate-y-0.5 hover:shadow-card-hover",
            // Fade-in animation
            "translate-y-2 opacity-0",
            mounted && "translate-y-0 opacity-100"
          )}
          style={{
            transitionDelay: mounted ? `${index * 75}ms` : "0ms",
          }}
        >
          {/* Label */}
          <span className="text-caption font-semibold uppercase tracking-wide text-surface-400">
            {stat.label}
          </span>

          {/* Icon (top-right) */}
          <div
            className={cn(
              "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl",
              stat.iconBg
            )}
            aria-hidden="true"
          >
            {stat.icon}
          </div>

          {/* Value */}
          <div
            className={cn(
              "mt-2 font-display text-[28px] font-bold tabular-nums leading-tight",
              stat.valueColor || "text-surface-900"
            )}
          >
            {stat.value}
          </div>

          {/* Change Indicator */}
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-[11px] font-medium",
              stat.changeDirection === "up" && "text-emerald-500",
              stat.changeDirection === "down" && "text-error",
              stat.changeDirection === "neutral" && "text-surface-500"
            )}
          >
            <ChangeArrow direction={stat.changeDirection} />
            <span>{stat.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
