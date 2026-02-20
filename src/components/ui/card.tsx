// =============================================================================
// Card Component
// LR AI Hub Design System
// =============================================================================

import React, { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type CardAccentColor = "green" | "gold" | "blue" | "red" | "purple" | "none";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Enable the hover lift + shadow effect */
  hoverable?: boolean;
  /** Color of the accent bar at the top of the card */
  accent?: CardAccentColor;
  /** Remove default padding (useful for custom layouts) */
  noPadding?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Title text rendered as a heading */
  title?: string;
  /** Subtitle / description text */
  subtitle?: string;
  /** Action element (e.g. a button) rendered on the right side */
  action?: ReactNode;
}

export type CardBodyProps = HTMLAttributes<HTMLDivElement>;

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Visually separate the footer with a top border */
  bordered?: boolean;
}

// -----------------------------------------------------------------------------
// Accent Color Map
// -----------------------------------------------------------------------------

const accentColors: Record<CardAccentColor, string> = {
  green: "before:bg-lr-gradient",
  gold: "before:bg-lr-gradient-gold",
  blue: "before:bg-gradient-to-r before:from-info before:to-blue-600",
  red: "before:bg-gradient-to-r before:from-error before:to-red-700",
  purple: "before:bg-gradient-to-r before:from-purple-500 before:to-purple-700",
  none: "",
};

// -----------------------------------------------------------------------------
// Card (Root)
// -----------------------------------------------------------------------------

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, accent = "none", noPadding = false, children, ...props }, ref) => {
    const hasAccent = accent !== "none";

    return (
      <div
        ref={ref}
        className={cn(
          // Base
          "relative rounded-[14px] border border-surface-200 bg-white",
          "shadow-card",
          "transition-all duration-300 ease-out",
          // Accent top border
          hasAccent && [
            "overflow-hidden",
            "before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-[14px]",
            accentColors[accent],
          ],
          // Hover effect
          hoverable && [
            "cursor-pointer",
            "hover:-translate-y-0.5 hover:shadow-card-hover",
            "active:translate-y-0 active:shadow-card",
          ],
          // Padding
          !noPadding && "p-5",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// -----------------------------------------------------------------------------
// Card Header
// -----------------------------------------------------------------------------

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between gap-4", className)}
        {...props}
      >
        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="truncate font-heading text-title font-semibold text-surface-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-body-sm text-surface-500">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

// -----------------------------------------------------------------------------
// Card Body
// -----------------------------------------------------------------------------

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = "CardBody";

// -----------------------------------------------------------------------------
// Card Footer
// -----------------------------------------------------------------------------

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mt-4 flex items-center gap-3",
          bordered && "border-t border-surface-200 pt-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";
