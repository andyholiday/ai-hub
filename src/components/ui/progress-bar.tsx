// =============================================================================
// ProgressBar Component
// AI Hub Design System
// =============================================================================

"use client";

import React, { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value (defaults to 100) */
  max?: number;
  /** Show the percentage label */
  showLabel?: boolean;
  /** Label text displayed on the left */
  label?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Color variant or use the default green-to-gold gradient */
  variant?: "gradient" | "green" | "gold" | "blue";
  /** Animate the fill on mount */
  animated?: boolean;
}

// -----------------------------------------------------------------------------
// Size Styles
// -----------------------------------------------------------------------------

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantStyles = {
  gradient: "bg-gradient-to-r from-brand-primary-500 to-brand-accent-500",
  green: "bg-brand-primary-500",
  gold: "bg-brand-accent-500",
  blue: "bg-info",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      showLabel = true,
      label,
      size = "md",
      variant = "gradient",
      animated = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const roundedPercentage = Math.round(percentage);

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {/* Header: Label + Percentage */}
        {(label || showLabel) && (
          <div className="mb-2 flex items-center justify-between">
            {label && (
              <span className="text-body-sm font-medium text-surface-700">
                {label}
              </span>
            )}
            {showLabel && (
              <span className="text-body-sm font-semibold tabular-nums text-surface-600">
                {roundedPercentage}%
              </span>
            )}
          </div>
        )}

        {/* Track */}
        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-surface-200",
            sizeStyles[size]
          )}
          role="progressbar"
          aria-valuenow={roundedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || `Progress: ${roundedPercentage}%`}
        >
          {/* Fill */}
          <div
            className={cn(
              "h-full rounded-full",
              variantStyles[variant],
              animated && "transition-all duration-700 ease-out"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";
