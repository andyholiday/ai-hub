// =============================================================================
// DashboardContent Component
// Client-side wrapper that provides dashboard data context to all widgets.
// Used by the Dashboard page (Server Component) to inject real data.
// =============================================================================

"use client";

import {
  StatsGrid,
  XpProgress,
  RecommendationSection,
  ActivityFeed,
  MentorMini,
  ChallengesCard,
  LeaderboardMini,
  RecentAchievements,
  DashboardDataProvider,
  DashboardStreak,
} from "@/components/features/dashboard";
import { OrbPageState } from "@/components/features/ai-orb/use-orb-page-state";
import { PageBriefingBanner } from "@/components/features/mentor-signals";
import { OnboardingWizard } from "@/components/features/onboarding/onboarding-wizard";
import { useDashboardContext } from "./dashboard-data-provider";

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function DashboardContent() {
  return (
    <DashboardDataProvider>
      <DashboardContentInner />
    </DashboardDataProvider>
  );
}

function DashboardContentInner() {
  const { data, refetch } = useDashboardContext();

  return (
    <>
      {data && !data.onboardingCompleted && (
        <OnboardingWizard userName={data.userName} onComplete={refetch} />
      )}
      <div className="flex flex-col gap-7">
        {/* Set orb to greeting state on first load */}
        <OrbPageState state="greeting" />

        {/* AI Mentor Page-Entry Briefing */}
        <PageBriefingBanner pageContext="dashboard" />

        {/* Stats Grid: 4 KPI cards */}
        <StatsGrid />

        {/* XP Progress Bar */}
        <XpProgress />

        {/* Personalized Recommendations */}
        <RecommendationSection />

        {/* Content Grid: Feed (left) + Sidebar widgets (right) */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          {/* Left Column: Activity Feed */}
          <ActivityFeed />

          {/* Right Column: Sidebar Widgets */}
          <aside className="flex flex-col gap-5">
            <DashboardStreak />
            <RecentAchievements />
            <MentorMini />
            <ChallengesCard />
            <LeaderboardMini />
          </aside>
        </div>
      </div>
    </>
  );
}
