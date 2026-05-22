// =============================================================================
// Pagination Component
// AI Hub Design System — page navigation for lists
// =============================================================================

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface PaginationProps {
  /** Current active page (1-based) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when the user selects a different page */
  onPageChange: (page: number) => void;
  /** Additional CSS classes on the nav container */
  className?: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Build the list of page numbers and ellipsis markers to render */
function buildPages(current: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | "…"> = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");

  pages.push(total);
  return pages;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {/* Previous */}
      <PaginationButton
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Vorherige Seite"
      >
        <ChevronLeft className="h-4 w-4" />
      </PaginationButton>

      {/* Pages */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-9 w-9 items-center justify-center text-body-sm text-surface-400"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <PaginationButton
            key={p}
            onClick={() => onPageChange(p)}
            isActive={p === page}
            aria-label={`Seite ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </PaginationButton>
        )
      )}

      {/* Next */}
      <PaginationButton
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Nächste Seite"
      >
        <ChevronRight className="h-4 w-4" />
      </PaginationButton>
    </nav>
  );
}

// -----------------------------------------------------------------------------
// Sub-component: PaginationButton
// -----------------------------------------------------------------------------

interface PaginationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

function PaginationButton({ isActive = false, className, children, ...props }: PaginationButtonProps) {
  return (
    <button
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-body-sm font-medium",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-40",
        isActive
          ? "bg-brand-primary-500 text-white shadow-sm"
          : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
