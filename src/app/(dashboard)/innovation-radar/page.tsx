// =============================================================================
// Innovation Radar Page
// Interactive visualization of AI trends and technologies
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Loader2, Radar, AlertTriangle } from "lucide-react";
import {
  TopicListSidebar,
  TopicDetailCard,
  TopicDetailEmpty,
  TrendingTopics,
} from "@/components/features/innovation-radar";
import type { RadarItem } from "@/components/features/innovation-radar";
import type { RadarCategory } from "@/lib/validators/innovation-radar";

// ---------------------------------------------------------------------------
// Lazy-load the SVG-heavy RadarChart component (large DOM + math calculations)
// ---------------------------------------------------------------------------
const RadarChart = dynamic(
  () =>
    import("@/components/features/innovation-radar/radar-chart").then(
      (m) => m.RadarChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-surface-300" />
      </div>
    ),
  },
);

// ---------------------------------------------------------------------------
// Types for API response
// ---------------------------------------------------------------------------

interface RadarApiItem {
  id: string;
  title: string;
  description: string;
  category: "tools" | "techniques" | "platforms" | "frameworks";
  ring: "adopt" | "trial" | "assess" | "hold";
  url: string | null;
  added_by: string;
  votes_count: number;
  created_at: string;
  updated_at: string;
  isVotedByUser: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InnovationRadarPage() {
  const [items, setItems] = useState<RadarApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [highlightCategory, setHighlightCategory] =
    useState<RadarCategory | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // --- Fetch radar items ---
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/innovation-radar");
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      setItems(json.data ?? []);
    } catch {
      setError("Innovation Radar konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // --- Derived data ---
  const radarItems: RadarItem[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        ring: item.ring,
        votes_count: item.votes_count,
        isVotedByUser: item.isVotedByUser,
      })),
    [items],
  );

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const maxVotes = useMemo(
    () => Math.max(1, ...items.map((i) => i.votes_count)),
    [items],
  );

  // --- Handlers ---
  const handleItemClick = useCallback((item: RadarItem) => {
    setSelectedItemId((prev) => (prev === item.id ? null : item.id));
    setShowMobileSidebar(false);
  }, []);

  const handleItemHover = useCallback((_item: RadarItem | null) => {
    // Hover state is handled inside RadarChart
  }, []);

  const handleCategoryFilter = useCallback(
    (category: RadarCategory | null) => {
      setHighlightCategory(category);
    },
    [],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedItemId(null);
  }, []);

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card className="flex flex-col items-center py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-warning" />
          <p className="mt-4 text-title-sm font-semibold text-surface-700">
            Fehler beim Laden
          </p>
          <p className="mt-1 text-body-sm text-surface-500">{error}</p>
          <button
            onClick={fetchItems}
            className="mt-4 rounded-lg bg-lr-green-500 px-4 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-lr-green-600"
          >
            Erneut versuchen
          </button>
        </Card>
      </div>
    );
  }

  // --- Empty state ---
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card className="flex flex-col items-center py-12 text-center">
          <Radar className="h-12 w-12 text-surface-300" />
          <p className="mt-4 text-title-sm font-semibold text-surface-700">
            Noch keine Topics vorhanden
          </p>
          <p className="mt-1 max-w-xs text-body-sm text-surface-500">
            Der Innovation Radar wird mit Topics befuellt, sobald die Community
            aktiv wird.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        itemCount={items.length}
        onToggleMobileSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
      />

      {/* Trending Topics */}
      <TrendingTopics
        items={radarItems}
        onItemClick={handleItemClick}
        selectedItemId={selectedItemId}
      />

      {/* Main Layout: Sidebar + Radar + Detail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar - Topic List */}
        <div
          className={`lg:col-span-3 ${
            showMobileSidebar ? "block" : "hidden lg:block"
          }`}
        >
          <Card noPadding className="h-[600px] overflow-hidden">
            <TopicListSidebar
              items={radarItems}
              selectedItemId={selectedItemId}
              highlightCategory={highlightCategory}
              onItemClick={handleItemClick}
              onCategoryFilter={handleCategoryFilter}
            />
          </Card>
        </div>

        {/* Radar Visualization */}
        <div className="lg:col-span-5">
          <Card noPadding className="overflow-hidden p-2 sm:p-4">
            <RadarChart
              items={radarItems}
              selectedItemId={selectedItemId}
              highlightCategory={highlightCategory}
              onItemClick={handleItemClick}
              onItemHover={handleItemHover}
            />
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-4">
          {selectedItem ? (
            <TopicDetailCard
              item={{
                id: selectedItem.id,
                title: selectedItem.title,
                description: selectedItem.description,
                category: selectedItem.category,
                ring: selectedItem.ring,
                votes_count: selectedItem.votes_count,
                isVotedByUser: selectedItem.isVotedByUser,
              }}
              maxVotes={maxVotes}
              url={selectedItem.url}
              createdAt={selectedItem.created_at}
              onClose={handleCloseDetail}
            />
          ) : (
            <TopicDetailEmpty />
          )}
        </div>
      </div>

      {/* Legend */}
      <RadarLegend />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Header Sub-component
// ---------------------------------------------------------------------------

function PageHeader({
  itemCount,
  onToggleMobileSidebar,
}: {
  itemCount?: number;
  onToggleMobileSidebar?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">
          Innovation Radar
        </h1>
        <p className="mt-1 text-body-sm text-surface-500">
          Entdecke KI-Trends und Technologien, die unsere Community bewertet.
          {itemCount !== undefined && itemCount > 0 && (
            <span className="ml-1 text-surface-400">
              {itemCount} Topics
            </span>
          )}
        </p>
      </div>
      {onToggleMobileSidebar && (
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-lg bg-surface-100 px-4 py-2 text-body-sm font-medium text-surface-700 transition-colors hover:bg-surface-200 lg:hidden"
        >
          Topic-Liste
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend Sub-component
// ---------------------------------------------------------------------------

function RadarLegend() {
  return (
    <Card className="p-4">
      <h3 className="font-heading text-body-sm font-semibold text-surface-700">
        Legende
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {/* Rings */}
        <div>
          <p className="text-overline font-semibold uppercase text-surface-400">
            Ringe
          </p>
          <div className="mt-1.5 space-y-1">
            <LegendItem color="#00A651" label="Adopt - Empfohlen" />
            <LegendItem color="#42A5F5" label="Trial - Testen" />
            <LegendItem color="#FFA726" label="Assess - Bewerten" />
            <LegendItem color="#EF5350" label="Hold - Abwarten" />
          </div>
        </div>

        {/* Quadrants */}
        <div>
          <p className="text-overline font-semibold uppercase text-surface-400">
            Quadranten
          </p>
          <div className="mt-1.5 space-y-1">
            <LegendItem color="#00A651" label="Techniken" />
            <LegendItem color="#42A5F5" label="Tools" />
            <LegendItem color="#C7A84E" label="Plattformen" />
            <LegendItem color="#7C3AED" label="Sprachen & Frameworks" />
          </div>
        </div>

        {/* Size */}
        <div>
          <p className="text-overline font-semibold uppercase text-surface-400">
            Punkt-Groesse
          </p>
          <p className="mt-1.5 text-caption text-surface-500">
            Groessere Punkte = mehr Community-Stimmen
          </p>
        </div>

        {/* Interaction */}
        <div>
          <p className="text-overline font-semibold uppercase text-surface-400">
            Interaktion
          </p>
          <p className="mt-1.5 text-caption text-surface-500">
            Hover fuer Details, Klick fuer die Detailansicht
          </p>
        </div>
      </div>
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-caption text-surface-600">{label}</span>
    </div>
  );
}
