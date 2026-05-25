// =============================================================================
// LoadingSkeleton Component
// AI Hub Design System — animated placeholder while content loads
// =============================================================================

import React, { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Skeleton (single bar)
// -----------------------------------------------------------------------------

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Explicit width (Tailwind class or inline style) */
  width?: string;
  /** Explicit height (Tailwind class or inline style) */
  height?: string;
  /** Fully round the element (for avatars, icons) */
  rounded?: boolean;
}

export function Skeleton({ className, width, height, rounded = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-surface-200 dark:bg-surface-700",
        rounded ? "rounded-full" : "rounded-lg",
        width,
        height,
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

// -----------------------------------------------------------------------------
// LoadingSkeleton (convenience multi-line layout)
// -----------------------------------------------------------------------------

export interface LoadingSkeletonProps {
  /** Number of text lines to show */
  lines?: number;
  /** Show a leading avatar/icon circle */
  showAvatar?: boolean;
  /** Additional CSS classes on the container */
  className?: string;
}

export function LoadingSkeleton({ lines = 3, showAvatar = false, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("flex gap-3", className)} aria-label="Wird geladen..." aria-busy="true">
      {showAvatar && <Skeleton width="w-10" height="h-10" rounded className="shrink-0" />}

      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            height="h-4"
            // Last line is shorter to look more natural
            width={i === lines - 1 ? "w-3/5" : "w-full"}
          />
        ))}
      </div>
    </div>
  );
}
