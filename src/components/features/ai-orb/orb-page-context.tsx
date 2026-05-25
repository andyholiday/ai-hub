"use client";

// =============================================================================
// OrbPageContext — wires the current route into OrbProvider.setPageContext
// so the chat banner shows the correct page name instead of "Dashboard".
// =============================================================================

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useOrb } from "./orb-provider";

const PATH_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ai-mentor": "AI Mentor",
  "/learn-hub": "Learn Hub",
  "/best-practices": "Best Practices",
  "/innovation-radar": "Innovation Radar",
  "/community": "Community",
  "/leaderboard": "Leaderboard",
  "/challenges": "Challenges",
  "/profile": "Profil",
  "/settings": "Einstellungen",
  "/notifications": "Benachrichtigungen",
};

function labelFromPath(pathname: string): string {
  // Exact match first
  const exact = PATH_LABELS[pathname];
  if (exact) return exact;

  // Prefix match (longest first) for nested routes
  const sorted = Object.keys(PATH_LABELS).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    const label = PATH_LABELS[prefix];
    if (pathname.startsWith(prefix + "/") && label) return label;
  }

  return "Dashboard";
}

export function OrbPageContext() {
  const pathname = usePathname();
  const { setPageContext } = useOrb();

  useEffect(() => {
    setPageContext(labelFromPath(pathname));
  }, [pathname, setPageContext]);

  return null;
}
