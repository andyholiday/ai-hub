// =============================================================================
// StatCard Component
// AI Hub Design System
// Dashboard statistics card with label, value, change indicator, and icon
// =============================================================================

import React, { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type StatChangeDirection = "up" | "down" | "neutral";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Metric label (e.g. "Aktive Nutzer") */
  label: string;
  /** Metric value (e.g. "1,234" or "87%") */
  value: string | number;
  /** Change text (e.g. "+12%" or "-3 seit gestern") */
  change?: string;
  /** Direction of the change */
  changeDirection?: StatChangeDirection;
  /** Icon element displayed in the top-right corner */
  icon?: ReactNode;
  /** Icon background color variant */
  iconVariant?: "green" | "gold" | "blue" | "purple";
}

// -----------------------------------------------------------------------------
// Icon Variant Styles
// -----------------------------------------------------------------------------

const iconVariantStyles = {
  green: "bg-brand-primary-50 text-brand-primary-600",
  gold: "bg-brand-accent-50 text-brand-accent-700",
  blue: "bg-info-light text-info-dark",
  purple: "bg-purple-50 text-purple-600",
};

const changeDirectionStyles: Record<StatChangeDirection, string> = {
  up: "text-brand-primary-600",
  down: "text-error",
  neutral: "text-surface-500",
};

// -----------------------------------------------------------------------------
// Change Arrow Sub-component
// -----------------------------------------------------------------------------

function ChangeArrow({ direction }: { direction: StatChangeDirection }) {
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

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      change,
      changeDirection = "neutral",
      icon,
      iconVariant = "green",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base card styles
          "relative rounded-[14px] border border-surface-200 bg-white p-5",
          "shadow-card",
          "transition-all duration-300 ease-out",
          // Hover
          "hover:-translate-y-0.5 hover:shadow-card-hover",
          "active:translate-y-0 active:shadow-card",
          className
        )}
        {...props}
      >
        {/* Top Row: Label + Icon */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-body-sm font-medium text-surface-500">
            {label}
          </span>

          {icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                iconVariantStyles[iconVariant],
                "[&>svg]:h-5 [&>svg]:w-5"
              )}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mt-2 font-heading text-headline font-bold tabular-nums text-surface-900">
          {value}
        </div>

        {/* Change Indicator */}
        {change && (
          <div
            className={cn(
              "mt-2 flex items-center gap-1",
              "text-caption font-medium",
              changeDirectionStyles[changeDirection]
            )}
          >
            <ChangeArrow direction={changeDirection} />
            <span>{change}</span>
          </div>
        )}
      </div>
    );
  }
);

StatCard.displayName = "StatCard";
