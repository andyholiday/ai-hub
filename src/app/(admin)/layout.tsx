// =============================================================================
// Admin Layout
// Grid layout with sidebar and admin-specific warning banner
// =============================================================================

import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-x-hidden bg-[#F7F8FA]">
        {/* Admin Warning Banner */}
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 sm:px-7 lg:px-8">
          <div className="flex items-center gap-2 text-[13px] font-medium text-amber-700">
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <span>
              Du befindest dich im Admin-Bereich. Aenderungen wirken sich auf
              die gesamte Plattform aus.
            </span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 px-5 py-6 sm:px-7 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
