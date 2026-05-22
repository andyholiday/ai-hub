// =============================================================================
// ErrorBoundary Component
// AI Hub Design System — catches React render errors, shows a fallback UI
// =============================================================================

"use client";

import React, { Component, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback; receives the caught error and a reset callback */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Additional CSS classes on the default fallback container */
  className?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// -----------------------------------------------------------------------------
// Default Fallback
// -----------------------------------------------------------------------------

function DefaultFallback({
  error,
  reset,
  className,
}: {
  error: Error;
  reset: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4 py-12",
        className
      )}
      role="alert"
    >
      <div className="rounded-full bg-red-50 p-4 dark:bg-red-950">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-50">
        Etwas ist schiefgelaufen
      </h2>

      <p className="text-center text-sm text-surface-500 dark:text-surface-400">
        {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
      </p>

      <button
        onClick={reset}
        className={cn(
          "rounded-[10px] bg-brand-primary-500 px-6 py-2.5 text-sm font-semibold text-white",
          "shadow-brand-primary transition-all",
          "hover:bg-brand-primary-600 hover:-translate-y-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-2"
        )}
      >
        Erneut versuchen
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ErrorBoundary (class component required by React)
// -----------------------------------------------------------------------------

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log without exposing to users; replace with a real logger if available
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback, className } = this.props;

    if (error) {
      if (fallback) return fallback(error, this.reset);
      return <DefaultFallback error={error} reset={this.reset} className={className} />;
    }

    return children;
  }
}
