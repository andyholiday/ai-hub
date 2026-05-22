// =============================================================================
// Breadcrumbs Component
// AI Hub Design System — navigation path trail
// =============================================================================

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Additional CSS classes on the nav element */
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex flex-wrap items-center gap-1" role="list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-surface-400"
                  aria-hidden="true"
                />
              )}

              {isLast || !item.href ? (
                <span
                  className={cn(
                    "text-body-sm",
                    isLast
                      ? "font-medium text-surface-900 dark:text-surface-50"
                      : "text-surface-500 dark:text-surface-400"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-body-sm text-surface-500 transition-colors duration-150",
                    "hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-50",
                    "focus-visible:outline-none focus-visible:underline"
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
