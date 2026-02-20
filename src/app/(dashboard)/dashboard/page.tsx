// =============================================================================
// Dashboard Page
// Main dashboard view composing all feature widgets
// =============================================================================

import {
  StatsGrid,
  XpProgress,
  ActivityFeed,
  MentorMini,
  ChallengesCard,
  LeaderboardMini,
} from "@/components/features/dashboard";

// -----------------------------------------------------------------------------
// Metadata
// -----------------------------------------------------------------------------

export const metadata = {
  title: "Dashboard | LR AI Hub",
  description: "Deine persoenliche Uebersicht im LR AI Hub",
};

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-7">
      {/* Stats Grid: 4 KPI cards */}
      <StatsGrid />

      {/* XP Progress Bar */}
      <XpProgress
        currentXp={2340}
        maxXp={3000}
        currentLevel={4}
        currentLevelTitle="AI Innovator"
        nextLevelTitle="AI Champion"
        nextLevel={5}
      />

      {/* Content Grid: Feed (left) + Sidebar widgets (right) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left Column: Activity Feed */}
        <ActivityFeed />

        {/* Right Column: Sidebar Widgets */}
        <aside className="flex flex-col gap-5">
          <MentorMini />
          <ChallengesCard />
          <LeaderboardMini />
        </aside>
      </div>
    </div>
  );
}
