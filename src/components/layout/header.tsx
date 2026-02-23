"use client";

// =============================================================================
// Header Component
// Top header bar for the main content area
// =============================================================================

import { Bell, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeaderProps {
  /** User's display name for the greeting */
  userName?: string;
  /** Subtitle text below the greeting */
  subtitle?: string;
  /** Number of unread notifications */
  notificationCount?: number;
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a time-based German greeting.
 */
function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 6) return "Gute Nacht";
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

// ---------------------------------------------------------------------------
// Header Component
// ---------------------------------------------------------------------------

export function Header({
  userName,
  subtitle = "Hier ist deine Uebersicht fuer heute.",
  notificationCount = 0,
  className,
}: HeaderProps) {
  const { firstName, isLoaded } = useAuth();
  const resolvedName = userName ?? (isLoaded ? firstName : "...");
  const greeting = getGreeting();

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 pb-2",
        className
      )}
    >
      {/* Left: Greeting */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[26px] font-bold leading-tight text-surface-900">
          {greeting}, {resolvedName}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[14px] text-surface-500">{subtitle}</p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Notifications Button */}
        <Link
          href="/notifications"
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-xl",
            "text-surface-500 transition-colors duration-150",
            "hover:bg-surface-100 hover:text-surface-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-2"
          )}
          aria-label={`Benachrichtigungen${notificationCount > 0 ? ` (${notificationCount} ungelesen)` : ""}`}
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} />

          {/* Notification Badge */}
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Link>

        {/* New Post Button */}
        <Link
          href="/best-practices/new"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5",
            "bg-[#00A651] text-[13.5px] font-semibold text-white",
            "shadow-lr-green transition-all duration-150",
            "hover:bg-lr-green-600 hover:shadow-lg",
            "active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-2"
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Neuer Beitrag</span>
        </Link>
      </div>
    </header>
  );
}
