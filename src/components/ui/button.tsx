// =============================================================================
// Button Component
// AI Hub Design System
// =============================================================================

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Icon element rendered before the label */
  iconLeft?: ReactNode;
  /** Icon element rendered after the label */
  iconRight?: ReactNode;
  /** Show a loading spinner and disable interaction */
  isLoading?: boolean;
  /** Text shown while loading (defaults to children) */
  loadingText?: string;
  /** Render as full width */
  fullWidth?: boolean;
}

// -----------------------------------------------------------------------------
// Style Maps
// -----------------------------------------------------------------------------

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-brand-primary-500 text-white",
    "hover:bg-brand-primary-600 active:bg-brand-primary-700",
    "shadow-sm hover:shadow-brand-primary",
    "focus-visible:ring-brand-primary-500",
  ].join(" "),

  secondary: [
    "bg-brand-primary-50 text-brand-primary-700",
    "hover:bg-brand-primary-100 active:bg-brand-primary-200",
    "focus-visible:ring-brand-primary-500",
  ].join(" "),

  ghost: [
    "bg-transparent text-surface-700",
    "border border-surface-300",
    "hover:bg-surface-100 active:bg-surface-200",
    "focus-visible:ring-brand-primary-500",
  ].join(" "),

  outline: [
    "bg-transparent text-brand-primary-600",
    "border border-brand-primary-500",
    "hover:bg-brand-primary-50 active:bg-brand-primary-100",
    "focus-visible:ring-brand-primary-500",
  ].join(" "),

  danger: [
    "bg-error text-white",
    "hover:bg-error-dark active:bg-red-900",
    "shadow-sm hover:shadow-md",
    "focus-visible:ring-error",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-body-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-body gap-2 rounded-[10px]",
  lg: "h-12 px-6 text-title-sm gap-2.5 rounded-[10px]",
};

const iconOnlySizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-[10px]",
  lg: "h-12 w-12 rounded-[10px]",
};

// -----------------------------------------------------------------------------
// Spinner Sub-component
// -----------------------------------------------------------------------------

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      iconLeft,
      iconRight,
      isLoading = false,
      loadingText,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const isIconOnly = !children && !loadingText && (iconLeft || iconRight);

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          "font-semibold font-heading",
          "transition-all duration-200 ease-out",
          "select-none whitespace-nowrap",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Disabled state
          "disabled:pointer-events-none disabled:opacity-50",
          // Variant
          variantStyles[variant],
          // Size - icon only vs. normal
          isIconOnly ? iconOnlySizeStyles[size] : sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading && (
          <Spinner
            className={cn(
              size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5"
            )}
          />
        )}

        {!isLoading && iconLeft && (
          <span
            className={cn(
              "inline-flex shrink-0",
              size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5",
              "[&>svg]:h-full [&>svg]:w-full"
            )}
            aria-hidden="true"
          >
            {iconLeft}
          </span>
        )}

        {isLoading && loadingText ? (
          <span>{loadingText}</span>
        ) : (
          children && <span>{children}</span>
        )}

        {!isLoading && iconRight && (
          <span
            className={cn(
              "inline-flex shrink-0",
              size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5",
              "[&>svg]:h-full [&>svg]:w-full"
            )}
            aria-hidden="true"
          >
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
