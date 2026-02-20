// =============================================================================
// Input Component
// LR AI Hub Design System
// =============================================================================

import React, { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label text displayed above the input */
  label?: string;
  /** Hint text displayed below the input */
  hint?: string;
  /** Error message - also sets the visual error state */
  error?: string;
  /** Icon or element rendered inside the input on the left */
  prefixIcon?: ReactNode;
  /** Icon or element rendered inside the input on the right */
  suffixIcon?: ReactNode;
  /** Size variant of the input */
  size?: "sm" | "md" | "lg";
  /** Make the input take full container width */
  fullWidth?: boolean;
}

// -----------------------------------------------------------------------------
// Size Styles
// -----------------------------------------------------------------------------

const sizeStyles = {
  sm: {
    input: "h-8 text-body-sm px-3",
    inputWithPrefix: "pl-8",
    inputWithSuffix: "pr-8",
    icon: "h-3.5 w-3.5",
    prefixOffset: "left-2.5",
    suffixOffset: "right-2.5",
  },
  md: {
    input: "h-10 text-body px-3.5",
    inputWithPrefix: "pl-10",
    inputWithSuffix: "pr-10",
    icon: "h-4 w-4",
    prefixOffset: "left-3",
    suffixOffset: "right-3",
  },
  lg: {
    input: "h-12 text-title-sm px-4",
    inputWithPrefix: "pl-12",
    inputWithSuffix: "pr-12",
    icon: "h-5 w-5",
    prefixOffset: "left-3.5",
    suffixOffset: "right-3.5",
  },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      prefixIcon,
      suffixIcon,
      size = "md",
      fullWidth = true,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // Generate a stable id for label association
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const hasError = !!error;
    const sizes = sizeStyles[size];

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-body-sm font-medium text-surface-700",
              disabled && "text-surface-400"
            )}
          >
            {label}
          </label>
        )}

        {/* Input Wrapper */}
        <div className="relative">
          {/* Prefix Icon */}
          {prefixIcon && (
            <span
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2",
                sizes.prefixOffset,
                sizes.icon,
                "[&>svg]:h-full [&>svg]:w-full",
                hasError ? "text-error" : "text-surface-400"
              )}
              aria-hidden="true"
            >
              {prefixIcon}
            </span>
          )}

          {/* Input Element */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={
              [
                hint && `${inputId}-hint`,
                error && `${inputId}-error`,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={cn(
              // Base
              "w-full rounded-[10px] border bg-white",
              "font-sans text-surface-900 placeholder:text-surface-400",
              "transition-all duration-200 ease-out",
              // Focus
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              // Disabled
              "disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400",
              // Size
              sizes.input,
              prefixIcon && sizes.inputWithPrefix,
              suffixIcon && sizes.inputWithSuffix,
              // State styles
              hasError
                ? "border-error text-error-dark focus:border-error focus:ring-error/30"
                : [
                    "border-surface-300",
                    "hover:border-surface-400",
                    "focus:border-lr-green-500 focus:ring-lr-green-500/20",
                  ].join(" "),
              className
            )}
            {...props}
          />

          {/* Suffix Icon */}
          {suffixIcon && (
            <span
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2",
                sizes.suffixOffset,
                sizes.icon,
                "[&>svg]:h-full [&>svg]:w-full",
                hasError ? "text-error" : "text-surface-400"
              )}
              aria-hidden="true"
            >
              {suffixIcon}
            </span>
          )}
        </div>

        {/* Hint Text */}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="text-caption text-surface-500"
          >
            {hint}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-caption font-medium text-error"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
