// =============================================================================
// Toggle (Switch) Component
// LR AI Hub Design System
// =============================================================================

"use client";

import React, { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "onChange"> {
  /** Whether the toggle is on */
  checked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Label text rendered beside the toggle */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Place the label on the left side */
  labelPosition?: "left" | "right";
}

// -----------------------------------------------------------------------------
// Size Styles
// -----------------------------------------------------------------------------

const sizeStyles = {
  sm: {
    track: "h-5 w-9",
    thumb: "h-4 w-4",
    thumbTranslate: "translate-x-4",
    thumbOffset: "translate-x-0.5",
  },
  md: {
    track: "h-6 w-11",
    thumb: "h-5 w-5",
    thumbTranslate: "translate-x-5",
    thumbOffset: "translate-x-0.5",
  },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      className,
      checked = false,
      onChange,
      label,
      description,
      size = "md",
      labelPosition = "right",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const toggleId = id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const styles = sizeStyles[size];

    const handleChange = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleChange();
      }
    };

    const switchElement = (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? `${toggleId}-label` : undefined}
        disabled={disabled}
        onClick={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          // Track
          "relative inline-flex shrink-0 cursor-pointer rounded-full",
          "transition-colors duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          styles.track,
          checked ? "bg-lr-green-500" : "bg-surface-300"
        )}
      >
        {/* Thumb */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow-sm",
            "transform transition-transform duration-200 ease-out",
            "mt-0.5",
            styles.thumb,
            checked ? styles.thumbTranslate : styles.thumbOffset
          )}
        />
      </button>
    );

    // Hidden input for form compatibility
    const hiddenInput = (
      <input
        ref={ref}
        type="checkbox"
        id={toggleId}
        checked={checked}
        onChange={() => onChange?.(!checked)}
        disabled={disabled}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      />
    );

    // Without label, return just the switch
    if (!label) {
      return (
        <div className={cn("inline-flex items-center", className)}>
          {hiddenInput}
          {switchElement}
        </div>
      );
    }

    // With label
    const labelElement = (
      <div className="flex-1">
        <span
          id={`${toggleId}-label`}
          className={cn(
            "text-body font-medium",
            disabled ? "text-surface-400" : "text-surface-700"
          )}
        >
          {label}
        </span>
        {description && (
          <p className="mt-0.5 text-body-sm text-surface-500">{description}</p>
        )}
      </div>
    );

    return (
      <label
        className={cn(
          "flex items-center gap-3",
          !disabled && "cursor-pointer",
          className
        )}
      >
        {hiddenInput}
        {labelPosition === "left" && labelElement}
        {switchElement}
        {labelPosition === "right" && labelElement}
      </label>
    );
  }
);

Toggle.displayName = "Toggle";
