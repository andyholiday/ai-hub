// =============================================================================
// Modal Component
// AI Hub Design System — accessible dialog overlay
// =============================================================================

"use client";

import React, { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Called when the user requests to close the modal */
  onClose: () => void;
  /** Modal heading */
  title?: string;
  /** Content inside the modal body */
  children: ReactNode;
  /** Footer content (e.g., action buttons) */
  footer?: ReactNode;
  /** Max width variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes on the panel */
  className?: string;
}

// -----------------------------------------------------------------------------
// Size map
// -----------------------------------------------------------------------------

const sizeStyles: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function Modal({ open, onClose, title, children, footer, size = "md", className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative z-10 w-full rounded-2xl",
          "border border-surface-200 bg-white shadow-elevated",
          "dark:border-surface-700 dark:bg-surface-900",
          "flex flex-col",
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2
              id="modal-title"
              className="font-heading text-title font-semibold text-surface-900 dark:text-surface-50"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                "text-surface-500 transition-colors",
                "hover:bg-surface-100 hover:text-surface-700",
                "dark:hover:bg-surface-800 dark:hover:text-surface-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500"
              )}
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-surface-200 px-6 py-4 dark:border-surface-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
