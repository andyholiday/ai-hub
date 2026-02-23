// =============================================================================
// Dashboard Page
// Main dashboard view composing all feature widgets.
// Server Component for metadata; delegates to DashboardContent (Client)
// which wraps all widgets in a DashboardDataProvider for real API data.
// =============================================================================

import { DashboardContent } from "@/components/features/dashboard";

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
  return <DashboardContent />;
}
