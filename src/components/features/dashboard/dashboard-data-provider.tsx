// =============================================================================
// Dashboard Data Provider
// Fetches dashboard data once and distributes to all child widgets via context.
// =============================================================================

"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useDashboardData,
  type DashboardData,
  type UseDashboardDataReturn,
} from "@/hooks/use-dashboard-data";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DashboardDataContext = createContext<UseDashboardDataReturn | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface DashboardDataProviderProps {
  children: ReactNode;
}

export function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const dashboardData = useDashboardData();

  return (
    <DashboardDataContext.Provider value={dashboardData}>
      {children}
    </DashboardDataContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer Hook
// ---------------------------------------------------------------------------

/**
 * Access dashboard data from the nearest DashboardDataProvider.
 * Must be used within a DashboardDataProvider.
 */
export function useDashboardContext(): UseDashboardDataReturn {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within a DashboardDataProvider"
    );
  }
  return context;
}

// Re-export DashboardData type for convenience
export type { DashboardData };
