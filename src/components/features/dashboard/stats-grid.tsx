// =============================================================================
// StatsGrid Component
// Dashboard statistics cards row with staggered fade-in animation
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { Zap, BookOpen, Lightbulb, Trophy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
// Demo Data
// -----------------------------------------------------------------------------

const stats: StatItem[] = [
  {
    label: "Deine XP",
    value: "2.340",
    change: "+120 diese Woche",
    changeDirection: "up",
    icon: <Zap className="h-5 w-5 text-lr-green-500" />,
    iconBg: "bg-lr-green-50",
    valueColor: "text-lr-green-500",
  },
  {
    label: "Abgeschlossene Kurse",
    value: "12",
    change: "+2 diesen Monat",
    changeDirection: "up",
    icon: <BookOpen className="h-5 w-5 text-blue-500" />,
    iconBg: "bg-blue-50",
  },
  {
    label: "Best Practices",
    value: "8",
    change: "3 neue Bewertungen",
    changeDirection: "up",
    icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
    iconBg: "bg-orange-50",
  },
  {
    label: "Community Rang",
    value: "#7",
    change: "3 Plaetze gestiegen",
    changeDirection: "up",
    icon: <Trophy className="h-5 w-5 text-purple-500" />,
    iconBg: "bg-purple-50",
  },
];

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
// Component
// -----------------------------------------------------------------------------

export function StatsGrid({ className }: StatsGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
