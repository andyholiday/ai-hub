// =============================================================================
// Badge Component
// AI Hub Design System
// =============================================================================

import React, { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type BadgeVariant = "green" | "blue" | "gold" | "purple" | "red" | "gray";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: BadgeSize;
  /** Optional dot indicator before the label */
  dot?: boolean;
}

// -----------------------------------------------------------------------------
// Style Maps
// -----------------------------------------------------------------------------

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-brand-primary-50 text-brand-primary-700 ring-brand-primary-200",
  blue: "bg-info-light text-info-dark ring-blue-200",
  gold: "bg-brand-accent-50 text-brand-accent-800 ring-brand-accent-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  red: "bg-error-light text-error-dark ring-red-200",
  gray: "bg-surface-100 text-surface-600 ring-surface-300",
};

const dotColors: Record<BadgeVariant, string> = {
  green: "bg-brand-primary-500",
  blue: "bg-info",
  gold: "bg-brand-accent-500",
  purple: "bg-purple-500",
  red: "bg-error",
  gray: "bg-surface-400",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-overline",
  md: "px-2.5 py-1 text-caption",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "gray", size = "sm", dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          "ring-1 ring-inset",
          "whitespace-nowrap",
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColors[variant])}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
