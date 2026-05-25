// =============================================================================
// SearchBar Component
// AI Hub Design System — controlled search input with clear button
// =============================================================================

"use client";

import React, { useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SearchBarProps {
  /** Current search value */
  value: string;
  /** Called when the value changes */
  onChange: (value: string) => void;
  /** Called when Enter is pressed */
  onSubmit?: (value: string) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Disables the input */
  disabled?: boolean;
  /** Additional CSS classes on the wrapper */
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Suchen…",
  disabled = false,
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && onSubmit) {
      onSubmit(value);
    }
    if (e.key === "Escape") {
      onChange("");
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      {/* Search icon */}
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-surface-400"
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-10 w-full rounded-[10px] pl-9 pr-9",
          "border border-surface-300 bg-white text-body text-surface-900",
          "placeholder:text-surface-400",
          "transition-colors duration-150",
          "hover:border-surface-400",
          "focus:border-brand-primary-500 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20",
          "dark:border-surface-600 dark:bg-surface-800 dark:text-surface-50",
          "dark:placeholder:text-surface-500",
          "dark:hover:border-surface-500 dark:focus:border-brand-primary-400",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
        aria-label={placeholder}
      />

      {/* Clear button — shown only when there is a value */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "absolute right-2 flex h-6 w-6 items-center justify-center rounded-md",
            "text-surface-400 transition-colors",
            "hover:bg-surface-100 hover:text-surface-600",
            "dark:hover:bg-surface-700 dark:hover:text-surface-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500"
          )}
          aria-label="Suche leeren"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
