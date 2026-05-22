// =============================================================================
// Footer Component
// AI Hub Design System — site footer with copyright and links
// =============================================================================

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  links?: FooterLink[];
  /** Additional CSS classes on the footer element */
  className?: string;
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

const defaultLinks: FooterLink[] = [
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Impressum", href: "/impressum" },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function Footer({ links = defaultLinks, className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-surface-200 dark:border-surface-700",
        "bg-white dark:bg-surface-900",
        "px-6 py-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-surface-400 dark:text-surface-500">
          &copy; {year} AI Hub
        </p>

        {links.length > 0 && (
          <nav aria-label="Footer Navigation">
            <ul className="flex flex-wrap gap-4" role="list">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-caption text-surface-400 transition-colors duration-150",
                      "hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300",
                      "focus-visible:outline-none focus-visible:underline"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </footer>
  );
}
