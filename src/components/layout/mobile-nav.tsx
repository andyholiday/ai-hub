"use client";

// =============================================================================
// Mobile Navigation Component
// Bottom navigation bar for mobile viewports
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  GraduationCap,
  Users,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ROUTES } from "@/constants/routes";

// ---------------------------------------------------------------------------
// Mobile Navigation Items (top 5 most important)
// ---------------------------------------------------------------------------

interface MobileNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: "Best Practices",
    href: ROUTES.BEST_PRACTICES,
    icon: Lightbulb,
  },
  {
    label: "Lernen",
    href: ROUTES.LEARN_HUB,
    icon: GraduationCap,
  },
  {
    label: "Community",
    href: ROUTES.COMMUNITY,
    icon: Users,
  },
  {
    label: "AI Mentor",
    href: ROUTES.AI_MENTOR,
    icon: Bot,
  },
];

// ---------------------------------------------------------------------------
// Mobile Navigation Component
// ---------------------------------------------------------------------------

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-fixed",
        "border-t border-surface-200 bg-white/95 backdrop-blur-lg",
        "pb-[env(safe-area-inset-bottom)]",
        "lg:hidden"
      )}
      role="navigation"
      aria-label="Mobile Navigation"
    >
      <ul className="flex items-center justify-around px-2 py-1.5" role="list">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== ROUTES.DASHBOARD &&
              pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5",
                  "text-[10px] font-medium transition-colors duration-150",
                  "min-w-[56px]",
                  isActive
                    ? "text-[#00A651]"
                    : "text-surface-400 active:text-surface-600"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-150",
                    isActive ? "text-[#00A651]" : "text-surface-400"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="truncate">{item.label}</span>

                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-0.5 h-0.5 w-4 rounded-full bg-[#00A651]" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
