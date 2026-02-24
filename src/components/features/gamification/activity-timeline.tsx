// =============================================================================
// Activity Timeline Component
// Vertical timeline showing recent gamification activity events
// =============================================================================

"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ActivityEventType =
  | "xp_earned"
  | "badge_earned"
  | "level_up"
  | "course_completed"
  | "best_practice_created"
  | "challenge_completed"
  | "comment"
  | "login_streak";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description?: string;
  xp?: number;
  timestamp: string; // ISO date string
}

export interface ActivityTimelineProps {
  events: ActivityEvent[];
  className?: string;
  maxItems?: number;
}

// -----------------------------------------------------------------------------
// Event Type Configuration
// -----------------------------------------------------------------------------

const eventConfig: Record<
  ActivityEventType,
  { icon: React.ReactNode; colorClass: string; bgClass: string }
> = {
  xp_earned: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
      </svg>
    ),
    colorClass: "text-brand-accent-600",
    bgClass: "bg-brand-accent-50",
  },
  badge_earned: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10 1a.75.75 0 01.65.375l2.083 3.604 4.148.608a.75.75 0 01.416 1.28l-3.002 2.926.709 4.132a.75.75 0 01-1.089.79L10 12.347l-3.715 1.953a.75.75 0 01-1.09-.79l.71-4.132-3.003-2.926a.75.75 0 01.416-1.28l4.148-.608L9.35 1.375A.75.75 0 0110 1z" clipRule="evenodd" />
      </svg>
    ),
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
  },
  level_up: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    ),
    colorClass: "text-brand-primary-600",
    bgClass: "bg-brand-primary-50",
  },
  course_completed: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.999 8.999 0 00-4.25 1.065V16.82zM9.25 4.065A8.999 8.999 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
      </svg>
    ),
    colorClass: "text-info-dark",
    bgClass: "bg-info-light",
  },
  best_practice_created: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
      </svg>
    ),
    colorClass: "text-brand-primary-600",
    bgClass: "bg-brand-primary-50",
  },
  challenge_completed: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
    colorClass: "text-brand-accent-600",
    bgClass: "bg-brand-accent-50",
  },
  comment: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z" clipRule="evenodd" />
      </svg>
    ),
    colorClass: "text-surface-500",
    bgClass: "bg-surface-100",
  },
  login_streak: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938zM14 12a4 4 0 01-5.168 3.821A.75.75 0 019.5 15a2.5 2.5 0 001.586-4.43.75.75 0 01.598-1.32A4.001 4.001 0 0114 12z" clipRule="evenodd" />
      </svg>
    ),
    colorClass: "text-orange-500",
    bgClass: "bg-orange-50",
  },
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `Vor ${diffMins} Min.`;
  if (diffHours < 24) return `Vor ${diffHours} Std.`;
  if (diffDays < 7) return `Vor ${diffDays} ${diffDays === 1 ? "Tag" : "Tagen"}`;

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ActivityTimeline({
  events,
  className,
  maxItems = 10,
}: ActivityTimelineProps) {
  const displayed = events.slice(0, maxItems);

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-heading text-title font-semibold text-surface-900">
        Aktivitaeten
      </h3>

      <div className="relative" role="list" aria-label="Aktivitaets-Timeline">
        {/* Vertical Line */}
        <div
          className="absolute left-[17px] top-2 bottom-2 w-px bg-surface-200"
          aria-hidden="true"
        />

        {/* Events */}
        <div className="space-y-0">
          {displayed.map((event, idx) => {
            const config = eventConfig[event.type];
            const isLast = idx === displayed.length - 1;

            return (
              <div
                key={event.id}
                className={cn(
                  "relative flex gap-3.5 pl-0",
                  !isLast && "pb-5"
                )}
                role="listitem"
              >
                {/* Dot / Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    config.bgClass
                  )}
                >
                  <span className={config.colorClass}>{config.icon}</span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-body-sm font-medium text-surface-800">
                      {event.title}
                    </p>
                    {event.xp && (
                      <span className="shrink-0 text-caption font-semibold tabular-nums text-brand-primary-600">
                        +{event.xp} XP
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="mt-0.5 text-caption text-surface-500">
                      {event.description}
                    </p>
                  )}

                  <p className="mt-1 text-caption text-surface-400">
                    {formatTimestamp(event.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
