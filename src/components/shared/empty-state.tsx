// =============================================================================
// EmptyState Component
// AI Hub Design System — shared placeholder for empty lists / zero-data views
// =============================================================================

import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface EmptyStateProps {
  /** Icon element rendered in the circle above the title */
  icon?: ReactNode;
  /** Primary heading */
  title: string;
  /** Supporting description */
  description?: string;
  /** Optional CTA rendered below the description */
  action?: ReactNode;
  /** Additional CSS classes on the outer container */
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed border-surface-200",
        "bg-surface-50/50 dark:border-surface-700 dark:bg-surface-900/50",
        "p-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
          <span className="text-surface-400 dark:text-surface-500 [&>svg]:h-8 [&>svg]:w-8">
            {icon}
          </span>
        </div>
      )}

      <h3 className="font-heading text-title-md font-semibold text-surface-900 dark:text-surface-50">
        {title}
      </h3>

      {description && (
        <p className="mx-auto mt-2 max-w-sm text-body text-surface-500 dark:text-surface-400">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
