// =============================================================================
// Tooltip Component
// AI Hub Design System
// Hover-triggered tooltip with glassmorphism pill shape
// =============================================================================

"use client";

import React, {
  forwardRef,
  useState,
  useRef,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  /** The content displayed inside the tooltip */
  content: ReactNode;
  /** Position relative to the trigger element */
  position?: TooltipPosition;
  /** Delay before showing (ms) */
  delayShow?: number;
  /** Delay before hiding (ms) */
  delayHide?: number;
  /** The trigger element (children) */
  children: ReactNode;
}

// -----------------------------------------------------------------------------
// Position Styles
// -----------------------------------------------------------------------------

const positionStyles: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowStyles: Record<TooltipPosition, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-surface-800/90",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-surface-800/90",
  left: "left-full top-1/2 -translate-y-1/2 border-l-surface-800/90",
  right: "right-full top-1/2 -translate-y-1/2 border-r-surface-800/90",
};

const arrowBorderDirection: Record<TooltipPosition, string> = {
  top: "border-l-transparent border-r-transparent border-b-transparent border-t-4 border-x-4 border-b-0",
  bottom: "border-l-transparent border-r-transparent border-t-transparent border-b-4 border-x-4 border-t-0",
  left: "border-t-transparent border-b-transparent border-r-transparent border-l-4 border-y-4 border-r-0",
  right: "border-t-transparent border-b-transparent border-l-transparent border-r-4 border-y-4 border-l-0",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      className,
      content,
      position = "top",
      delayShow = 200,
      delayHide = 100,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const showTimeout = useRef<ReturnType<typeof setTimeout>>();
    const hideTimeout = useRef<ReturnType<typeof setTimeout>>();

    const show = useCallback(() => {
      clearTimeout(hideTimeout.current);
      showTimeout.current = setTimeout(() => setIsVisible(true), delayShow);
    }, [delayShow]);

    const hide = useCallback(() => {
      clearTimeout(showTimeout.current);
      hideTimeout.current = setTimeout(() => setIsVisible(false), delayHide);
    }, [delayHide]);

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        {...props}
      >
        {/* Trigger */}
        {children}

        {/* Tooltip Content */}
        {isVisible && content && (
          <div
            role="tooltip"
            className={cn(
              "pointer-events-none absolute z-tooltip",
              "animate-fade-in",
              positionStyles[position]
            )}
          >
            <div
              className={cn(
                // Pill shape with glassmorphism
                "rounded-full px-3 py-1.5",
                "bg-surface-800/90 backdrop-blur-md",
                "text-caption font-medium text-white",
                "whitespace-nowrap",
                "shadow-elevated"
              )}
            >
              {content}
            </div>

            {/* Arrow */}
            <span
              className={cn(
                "absolute h-0 w-0 border-solid",
                arrowStyles[position],
                arrowBorderDirection[position]
              )}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = "Tooltip";
