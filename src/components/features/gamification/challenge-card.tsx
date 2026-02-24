// =============================================================================
// Challenge Card Component
// Displays a gamification challenge with progress, timer, and participants
// =============================================================================

"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, Badge, Button, ProgressBar } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ChallengeParticipant {
  name: string;
  avatarUrl?: string;
}

export interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  xpReward: number;
  daysRemaining: number;
  totalDays: number;
  participants: ChallengeParticipant[];
  totalParticipants: number;
  progress: number;
  isCompleted?: boolean;
  result?: string;
  frequency: "wochentlich" | "monatlich";
  onJoin?: (id: string) => void;
  onContinue?: (id: string) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function TimeBar({
  daysRemaining,
  totalDays,
}: {
  daysRemaining: number;
  totalDays: number;
}) {
  const percentage = Math.max(0, (daysRemaining / totalDays) * 100);
  const isUrgent = daysRemaining <= 2;

  return (
    <div className="flex items-center gap-2">
      {/* Clock Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={cn(
          "h-4 w-4 shrink-0",
          isUrgent ? "text-error" : "text-surface-400"
        )}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isUrgent
                ? "bg-gradient-to-r from-error to-orange-400"
                : "bg-gradient-to-r from-brand-primary-400 to-brand-primary-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 text-caption font-medium tabular-nums",
          isUrgent ? "text-error" : "text-surface-500"
        )}
      >
        Noch {daysRemaining} {daysRemaining === 1 ? "Tag" : "Tage"}
      </span>
    </div>
  );
}

function ParticipantAvatars({
  participants,
  totalParticipants,
}: {
  participants: ChallengeParticipant[];
  totalParticipants: number;
}) {
  const shown = participants.slice(0, 4);
  const remaining = totalParticipants - shown.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((p, i) => (
          <Avatar
            key={i}
            name={p.name}
            src={p.avatarUrl}
            size="xs"
            className="ring-2 ring-white"
          />
        ))}
        {remaining > 0 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-[0.6rem] font-semibold text-surface-600 ring-2 ring-white">
            +{remaining}
          </div>
        )}
      </div>
      <span className="text-caption text-surface-500">
        {totalParticipants} Teilnehmer
      </span>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function ChallengeCard({
  id,
  title,
  description,
  icon,
  xpReward,
  daysRemaining,
  totalDays,
  participants,
  totalParticipants,
  progress,
  isCompleted = false,
  result,
  frequency,
  onJoin,
  onContinue,
  className,
}: ChallengeCardProps) {
  const hasStarted = progress > 0;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-5 shadow-card",
        "transition-all duration-300",
        isCompleted
          ? "border-surface-200 bg-surface-50"
          : "border-surface-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        className
      )}
    >
      {/* Completed overlay checkmark */}
      {isCompleted && (
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary-500">
          <CheckIcon className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Header: Icon + Title + XP Badge */}
      <div className="flex items-start gap-3">
        {/* Challenge Icon */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isCompleted
              ? "bg-surface-200 text-surface-500"
              : "bg-brand-primary-50 text-brand-primary-600",
            "[&>svg]:h-5 [&>svg]:w-5"
          )}
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={cn(
                "font-heading text-title-sm font-semibold",
                isCompleted ? "text-surface-500" : "text-surface-900"
              )}
            >
              {title}
            </h3>
            <Badge
              variant={isCompleted ? "gray" : "gold"}
              size="sm"
            >
              +{xpReward} XP
            </Badge>
          </div>
          <p
            className={cn(
              "mt-1 text-body-sm leading-relaxed",
              isCompleted ? "text-surface-400" : "text-surface-500"
            )}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Frequency Badge */}
      <div className="mt-3">
        <Badge variant={frequency === "monatlich" ? "purple" : "blue"} size="sm">
          {frequency === "monatlich" ? "Monatlich" : "Woechentlich"}
        </Badge>
      </div>

      {/* Time Bar (active only) */}
      {!isCompleted && (
        <div className="mt-4">
          <TimeBar daysRemaining={daysRemaining} totalDays={totalDays} />
        </div>
      )}

      {/* Progress (if started or completed) */}
      {(hasStarted || isCompleted) && (
        <div className="mt-4">
          <ProgressBar
            value={isCompleted ? 100 : progress}
            variant={isCompleted ? "green" : "gradient"}
            size="sm"
            label="Dein Fortschritt"
            showLabel
          />
        </div>
      )}

      {/* Completed result text */}
      {isCompleted && result && (
        <p className="mt-3 text-body-sm font-medium text-brand-primary-600">
          {result}
        </p>
      )}

      {/* Footer: Participants + Action */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3">
          <ParticipantAvatars
            participants={participants}
            totalParticipants={totalParticipants}
          />

          {!isCompleted && (
            <Button
              size="sm"
              variant={hasStarted ? "primary" : "outline"}
              onClick={() =>
                hasStarted ? onContinue?.(id) : onJoin?.(id)
              }
            >
              {hasStarted ? "Fortsetzen" : "Teilnehmen"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
