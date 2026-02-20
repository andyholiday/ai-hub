// =============================================================================
// Dashboard Layout
// Grid layout combining Sidebar, Header, and Main content area.
// Includes the persistent AI Orb (Living Cloud) floating element.
// =============================================================================

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OrbProvider, AiOrb } from "@/components/features/ai-orb";

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
        <main className="flex flex-1 flex-col overflow-x-hidden bg-[#F7F8FA]">
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

      {/* AI Orb – persistent floating KI companion, rendered outside the layout flow */}
      <AiOrb />
    </OrbProvider>
  );
}
