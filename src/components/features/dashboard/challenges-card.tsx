// =============================================================================
// ChallengesCard Component
// Active challenges sidebar card with progress indicators
// =============================================================================

"use client";

import { Target, FileText, Brain } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ChallengeItem {
  id: string;
  name: string;
  reward: string;
  daysLeft: string;
  progress: number;
  icon: React.ReactNode;
  iconBg: string;
}

interface ChallengesCardProps {
  className?: string;
}

// -----------------------------------------------------------------------------
// Demo Data
// -----------------------------------------------------------------------------

const challenges: ChallengeItem[] = [
  {
    id: "1",
    name: "KI-Prozessoptimierung",
    reward: "75 XP",
    daysLeft: "4 Tage",
    progress: 60,
    icon: <Target className="h-4.5 w-4.5 text-lr-green-600" />,
    iconBg: "bg-lr-green-50",
  },
  {
    id: "2",
    name: "5 Best Practices lesen",
    reward: "25 XP",
    daysLeft: "2 Tage",
    progress: 80,
    icon: <FileText className="h-4.5 w-4.5 text-amber-500" />,
    iconBg: "bg-orange-50",
  },
  {
    id: "3",
    name: "AI Mentor 10x fragen",
    reward: "30 XP",
    daysLeft: "5 Tage",
    progress: 30,
    icon: <Brain className="h-4.5 w-4.5 text-purple-500" />,
    iconBg: "bg-purple-50",
  },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ChallengesCard({ className }: ChallengesCardProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-surface-200 bg-white p-5 shadow-card",
        "animate-fade-up",
        className
      )}
    >
      {/* Section Title */}
      <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-surface-900">
        <span
          className="h-4 w-[3px] rounded-full bg-lr-green-500"
          aria-hidden="true"
        />
        Aktive Challenges
      </h3>

      {/* Challenge Items */}
      <div className="flex flex-col divide-y divide-surface-100">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0"
          >
            {/* Icon */}
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                challenge.iconBg
              )}
              aria-hidden="true"
            >
              {challenge.icon}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-caption font-semibold text-surface-900">
                {challenge.name}
              </div>
              <div className="text-[10px] font-medium text-lr-gold-500">
                <span aria-hidden="true">&#x26A1;</span> {challenge.reward} · {challenge.daysLeft}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-[70px] shrink-0">
              <div
                className="h-[3px] w-full overflow-hidden rounded-full bg-surface-200"
                role="progressbar"
                aria-valuenow={challenge.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${challenge.name}: ${challenge.progress}%`}
              >
                <div
                  className="h-full rounded-full bg-lr-green-500 transition-all duration-500"
                  style={{ width: `${challenge.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
