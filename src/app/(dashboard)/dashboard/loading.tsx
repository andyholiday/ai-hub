// =============================================================================
// Dashboard Loading State
// Skeleton placeholders while dashboard data loads
// =============================================================================

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-7 animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] rounded-[14px] border border-surface-200 bg-white"
          />
        ))}
      </div>

      {/* XP Progress Skeleton */}
      <div className="h-[130px] rounded-2xl border border-surface-200 bg-white" />

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Feed Skeleton */}
        <div className="flex flex-col gap-3.5">
          <div className="h-6 w-40 rounded bg-surface-200" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[180px] rounded-[14px] border border-surface-200 bg-white"
            />
          ))}
        </div>

        {/* Sidebar Skeleton */}
        <div className="flex flex-col gap-5">
          <div className="h-[200px] rounded-[14px] border border-surface-200 bg-white" />
          <div className="h-[180px] rounded-[14px] border border-surface-200 bg-white" />
          <div className="h-[200px] rounded-[14px] border border-surface-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
