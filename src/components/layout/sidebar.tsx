"use client";

// =============================================================================
// Sidebar Component
// Main navigation sidebar for the LR AI Hub dashboard
// =============================================================================

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  GraduationCap,
  Users,
  Bot,
  Radar,
  Trophy,
  Target,
  Shield,
  Route,
  Award,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBrandingStore } from "@/stores/branding-store";
import { MAIN_NAVIGATION, ADMIN_NAVIGATION } from "@/constants/navigation";
import type { NavItem } from "@/constants/navigation";
import { LogoutButton } from "@/app/(auth)/login/logout";
import { useAuth } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Icon Map – maps string icon names from navigation constants to components
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Lightbulb,
  GraduationCap,
  Users,
  Bot,
  Radar,
  Trophy,
  Target,
  Shield,
  Route,
  Award,
};

// ---------------------------------------------------------------------------
// Navigation Section Definitions
// Groups navigation items into labeled sections
// ---------------------------------------------------------------------------

interface NavSection {
  label?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    // Hauptnavigation (no label, top section)
    items: MAIN_NAVIGATION.slice(0, 5), // Dashboard, Best Practices, Learn Hub, Community, Ideen-Board
  },
  {
    label: "KI-Features",
    items: MAIN_NAVIGATION.slice(5, 7), // AI Mentor, Innovation Radar
  },
  {
    label: "Gamification",
    items: MAIN_NAVIGATION.slice(7, 10), // Leaderboard, Challenges, Achievements
  },
  {
    label: "Administration",
    items: ADMIN_NAVIGATION.slice(0, 1), // Admin Panel (first item only)
  },
];

// ---------------------------------------------------------------------------
// User role label mapping
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  moderator: "Moderator",
  user: "KI-Enthusiast",
};

// Badge counts – replace with real data from API
const BADGE_COUNTS: Record<string, number> = {
  "/best-practices": 12,
};

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function SidebarLogo() {
  const { branding, isHydrated, hydrate } = useBrandingStore();

  // Hydrate from localStorage on first render
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="flex items-center gap-3 px-5 py-5">
      {/* Brand Mark */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
          isHydrated ? branding.logoGradient : "bg-lr-gradient",
        )}
      >
        <span className="font-display text-[15px] font-bold leading-none text-white">
          {isHydrated ? branding.logoText : "LR"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-surface-300" />

      {/* Platform Name */}
      <div className="flex flex-col">
        <span className="font-display text-[13px] font-bold leading-tight text-surface-900">
          {isHydrated ? branding.appName : "AI Hub"}
        </span>
        <span className="text-[11px] leading-tight text-surface-500">
          {isHydrated ? branding.appSubtitle : "Community Platform"}
        </span>
      </div>
    </div>
  );
}

function SidebarNavItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const IconComponent = ICON_MAP[item.icon];
  const badgeCount = BADGE_COUNTS[item.href];

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-150",
        isActive
          ? "bg-[#F0FDF4] font-semibold text-[#00A651]"
          : "text-surface-600 hover:bg-[#F7F8FA] hover:text-surface-900"
      )}
    >
      {/* Icon */}
      {IconComponent && (
        <IconComponent
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
            isActive
              ? "text-[#00A651]"
              : "text-surface-400 group-hover:text-surface-600"
          )}
          strokeWidth={isActive ? 2.2 : 1.8}
        />
      )}

      {/* Label */}
      <span className="flex-1 truncate">{item.title}</span>

      {/* Badge */}
      {badgeCount && (
        <span className="inline-flex items-center justify-center rounded-lg bg-[#00A651] px-[7px] py-[2px] text-[10px] font-semibold leading-tight text-white">
          {badgeCount}
        </span>
      )}

      {/* AI Badge */}
      {item.badge === "KI" && !badgeCount && (
        <span className="inline-flex items-center justify-center rounded-md bg-lr-green-50 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide text-lr-green-600">
          KI
        </span>
      )}

      {/* Admin Badge */}
      {item.badge === "Admin" && (
        <span className="ml-auto inline-flex items-center justify-center rounded bg-amber-50 px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-[0.5px] text-amber-600">
          Admin
        </span>
      )}
    </Link>
  );
}

function SidebarSectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3.5 pb-1.5 pt-5">
      <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-surface-400">
        {label}
      </span>
    </div>
  );
}

function SidebarUserCard() {
  const { user, isLoaded, initials, displayName } = useAuth();

  const level = user?.level ?? 1;
  const roleLabel = ROLE_LABELS[user?.role ?? "user"] ?? "KI-Enthusiast";

  return (
    <div className="border-t border-surface-200 p-4">
      <Link
        href="/profile"
        className="flex items-center gap-3 rounded-[10px] bg-[#F7F8FA] px-3 py-2.5 transition-colors duration-150 hover:bg-surface-200"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-lr-gradient">
          <span className="text-[12px] font-bold leading-none text-white">
            {isLoaded ? initials : "..."}
          </span>
        </div>

        {/* User Info */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <span className="truncate text-[13px] font-semibold text-surface-900">
            {isLoaded ? displayName : "\u00A0"}
          </span>
          <span className="text-[11px] text-surface-500">
            {isLoaded ? (
              <>Level {level} &middot; {roleLabel}</>
            ) : (
              "\u00A0"
            )}
          </span>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-4 w-4 shrink-0 text-surface-400" />
      </Link>
      <LogoutButton />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Sidebar Component
// ---------------------------------------------------------------------------

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 z-sticky flex h-screen w-[260px] shrink-0 flex-col border-r border-[#E5E7EB] bg-white"
      role="navigation"
      aria-label="Hauptnavigation"
    >
      {/* Logo */}
      <SidebarLogo />

      {/* Separator */}
      <div className="mx-4 border-t border-surface-200" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {/* Section Label */}
            {section.label && (
              <SidebarSectionLabel label={section.label} />
            )}

            {/* Navigation Items */}
            <ul className="flex flex-col gap-0.5" role="list">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <SidebarNavItem item={item} isActive={isActive} />
                    {/* Child Navigation Items */}
                    {item.children && item.children.length > 0 && isActive && (
                      <ul className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-surface-200 pl-3">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href || pathname.startsWith(child.href);
                          return (
                            <li key={child.href}>
                              <SidebarNavItem item={child} isActive={isChildActive} />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Card */}
      <SidebarUserCard />
    </aside>
  );
}
