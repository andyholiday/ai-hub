// =============================================================================
// Dashboard Layout
// Grid layout combining Sidebar, Header, and Main content area.
// Includes the persistent Cosmos Companion floating element.
// =============================================================================

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OrbProvider } from "@/components/features/ai-orb";
import { CommandPaletteTrigger } from "@/components/shared/command-palette";

// ---------------------------------------------------------------------------
// Lazy-load the Cosmos Companion (pulls in framer-motion ~45 kB gzipped).
// SSR disabled because the orb is a purely client-side floating overlay.
// ---------------------------------------------------------------------------
const CosmosCompanionLazy = dynamic(
  () =>
    import("@/components/features/ai-orb/cosmos-companion").then(
      (m) => m.CosmosCompanion,
    ),
  { ssr: false },
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrbProvider initialContext="Dashboard">
      <div className="flex min-h-screen">
        {/* Sidebar – hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col overflow-x-hidden bg-surface-50 dark:bg-surface-900">
          {/* Header */}
          <div className="px-5 pt-6 sm:px-7 lg:px-8 lg:pt-7">
            <Header />
          </div>

          {/* Page Content */}
          <div className="flex-1 px-5 py-5 sm:px-7 lg:px-8 lg:py-7">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation – visible only on mobile */}
        <MobileNav />
      </div>

      {/* Cosmos Companion – lazy-loaded floating KI companion */}
      <CosmosCompanionLazy />

      {/* Command Palette – Cmd/Ctrl+K global search + navigation */}
      <CommandPaletteTrigger />
    </OrbProvider>
  );
}
