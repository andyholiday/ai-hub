"use client";

// =============================================================================
// Admin Tabs Component
// Horizontal tab navigation for the Admin Panel sections
// =============================================================================

import {
  Bot,
  Users,
  BarChart3,
  Gamepad2,
  BookOpen,
  Settings,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AdminTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface AdminTabsProps {
  /** Currently active tab id */
  activeTab: string;
  /** Callback when a tab is clicked */
  onTabChange: (tabId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// -----------------------------------------------------------------------------
// Tab Definitions
// -----------------------------------------------------------------------------

export const ADMIN_TABS: AdminTab[] = [
  { id: "ai-provider", label: "KI-Provider", icon: Bot },
  { id: "users", label: "Benutzer", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "gamification", label: "Gamification", icon: Gamepad2 },
  { id: "content", label: "Content", icon: BookOpen },
  { id: "system", label: "System", icon: Settings },
  { id: "branding", label: "Branding", icon: Palette },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function AdminTabs({ activeTab, onTabChange, className }: AdminTabsProps) {
  return (
    <nav
      className={cn(
        "flex gap-1 rounded-xl border border-surface-200 bg-white p-1 w-fit",
        "overflow-x-auto scrollbar-none",
        className
      )}
      role="tablist"
      aria-label="Admin-Bereiche"
    >
      {ADMIN_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2",
              "text-[13px] font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1",
              isActive
                ? "bg-lr-green-500 font-semibold text-white shadow-sm"
                : "text-surface-500 hover:text-surface-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
