// =============================================================================
// Navigation Constants
// Sidebar and header navigation configuration
// =============================================================================

import { ROUTES } from "./routes";

export interface NavItem {
  title: string;
  href: string;
  icon: string; // Lucide icon name
  badge?: string;
  description?: string;
  children?: NavItem[];
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    title: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: "LayoutDashboard",
    description: "Uebersicht und Aktivitaeten",
  },
  {
    title: "Best Practices",
    href: ROUTES.BEST_PRACTICES,
    icon: "Lightbulb",
    description: "KI-Tipps und Erfolgsrezepte",
  },
  {
    title: "Learn Hub",
    href: ROUTES.LEARN_HUB,
    icon: "GraduationCap",
    description: "Kurse und Lernpfade",
    children: [
      {
        title: "Lernpfade",
        href: ROUTES.LEARNING_PATHS,
        icon: "Route",
        description: "Strukturierte Kurs-Reihenfolgen",
      },
    ],
  },
  {
    title: "Community",
    href: ROUTES.COMMUNITY,
    icon: "Users",
    description: "Austausch und Diskussionen",
  },
  {
    title: "Ideen-Board",
    href: ROUTES.COMMUNITY_IDEAS,
    icon: "Lightbulb",
    description: "Ideen entdecken und bewerten",
  },
  {
    title: "AI Mentor",
    href: ROUTES.AI_MENTOR,
    icon: "Bot",
    description: "Persoenlicher KI-Berater",
    badge: "KI",
  },
  {
    title: "Innovation Radar",
    href: ROUTES.INNOVATION_RADAR,
    icon: "Radar",
    description: "Neue Tools und Trends",
  },
  {
    title: "Leaderboard",
    href: ROUTES.LEADERBOARD,
    icon: "Trophy",
    description: "Rankings und Bestenliste",
  },
  {
    title: "Challenges",
    href: ROUTES.CHALLENGES,
    icon: "Target",
    description: "Wettbewerbe und Aufgaben",
  },
  {
    title: "Achievements",
    href: ROUTES.PROFILE_ACHIEVEMENTS,
    icon: "Award",
    description: "Erfolge und Meilensteine",
  },
];

export const ADMIN_NAVIGATION: NavItem[] = [
  {
    title: "Admin Panel",
    href: ROUTES.ADMIN,
    icon: "Shield",
    badge: "Admin",
  },
  {
    title: "Benutzer",
    href: ROUTES.ADMIN_USERS,
    icon: "UserCog",
  },
  {
    title: "Inhalte",
    href: ROUTES.ADMIN_CONTENT,
    icon: "FileText",
  },
  {
    title: "Analytics",
    href: ROUTES.ADMIN_ANALYTICS,
    icon: "BarChart3",
  },
  {
    title: "KI-Konfiguration",
    href: ROUTES.ADMIN_AI_CONFIG,
    icon: "Settings2",
  },
  {
    title: "Einstellungen",
    href: ROUTES.ADMIN_SETTINGS,
    icon: "Settings",
  },
];
