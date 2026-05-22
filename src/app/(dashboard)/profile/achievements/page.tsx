// =============================================================================
// Achievements Page
// Full overview of all achievements grouped by category with unlock status,
// progress bars, and category tabs.
// =============================================================================

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, Badge, Button, ProgressBar } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirementType: string;
  requirementValue: number;
  xpReward: number;
  isHidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  currentProgress: number;
}

interface AchievementGroup {
  category: string;
  label: string;
  achievements: Achievement[];
}

interface AchievementSummary {
  total: number;
  unlocked: number;
  locked: number;
  totalXpEarned: number;
}

interface AchievementsApiResponse {
  data: {
    summary: AchievementSummary;
    grouped: AchievementGroup[];
  } | null;
  error: { code: string; message: string } | null;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const CATEGORY_TABS = [
  { key: "all", label: "Alle" },
  { key: "learning", label: "Lernen" },
  { key: "community", label: "Community" },
  { key: "engagement", label: "Engagement" },
  { key: "mastery", label: "Meisterschaft" },
] as const;

type CategoryTab = (typeof CATEGORY_TABS)[number]["key"];

const ICON_MAP: Record<string, string> = {
  footprints: "\u{1F463}",
  "book-open": "\u{1F4D6}",
  "graduation-cap": "\u{1F393}",
  library: "\u{1F4DA}",
  crown: "\u{1F451}",
  star: "\u{2B50}",
  "message-circle": "\u{1F4AC}",
  messages: "\u{1F5E8}\u{FE0F}",
  heart: "\u{2764}\u{FE0F}",
  "trending-up": "\u{1F4C8}",
  flame: "\u{1F525}",
  zap: "\u{26A1}",
  rocket: "\u{1F680}",
  award: "\u{1F3C6}",
  medal: "\u{1F3C5}",
  shield: "\u{1F6E1}\u{FE0F}",
  "shield-check": "\u{2705}",
  sparkles: "\u{2728}",
  coins: "\u{1FA99}",
  gem: "\u{1F48E}",
  trophy: "\u{1F3C6}",
  "help-circle": "\u{2753}",
};

function getIconEmoji(iconName: string): string {
  return ICON_MAP[iconName] ?? "\u{1F3C6}";
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; badge: "green" | "blue" | "gold" | "purple" }> = {
  learning: { bg: "bg-blue-50", text: "text-blue-600", badge: "blue" },
  community: { bg: "bg-brand-primary-50", text: "text-brand-primary-600", badge: "green" },
  engagement: { bg: "bg-orange-50", text: "text-amber-600", badge: "gold" },
  mastery: { bg: "bg-purple-50", text: "text-purple-600", badge: "purple" },
};

// -----------------------------------------------------------------------------
// Helper: Format Date
// -----------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// -----------------------------------------------------------------------------
// Sub-Components
// -----------------------------------------------------------------------------

function SummaryCards({ summary }: { summary: AchievementSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
        <div className="text-caption font-semibold uppercase tracking-wide text-surface-600">
          Freigeschaltet
        </div>
        <div className="mt-1 font-display text-[24px] font-bold tabular-nums text-brand-primary-500">
          {summary.unlocked}
        </div>
      </div>
      <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
        <div className="text-caption font-semibold uppercase tracking-wide text-surface-600">
          Gesperrt
        </div>
        <div className="mt-1 font-display text-[24px] font-bold tabular-nums text-surface-600">
          {summary.locked}
        </div>
      </div>
      <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
        <div className="text-caption font-semibold uppercase tracking-wide text-surface-600">
          Gesamt
        </div>
        <div className="mt-1 font-display text-[24px] font-bold tabular-nums text-surface-900">
          {summary.total}
        </div>
      </div>
      <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
        <div className="text-caption font-semibold uppercase tracking-wide text-surface-600">
          XP verdient
        </div>
        <div className="mt-1 font-display text-[24px] font-bold tabular-nums text-amber-500">
          {summary.totalXpEarned.toLocaleString("de-DE")}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const colors = CATEGORY_COLORS[achievement.category] ?? CATEGORY_COLORS.engagement!;
  const progressPercent =
    achievement.requirementValue > 0
      ? Math.min(100, Math.round((achievement.currentProgress / achievement.requirementValue) * 100))
      : 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 transition-all duration-200",
        achievement.unlocked
          ? "border-surface-200 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover"
          : "border-surface-100 opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            achievement.unlocked ? colors.bg : "bg-surface-100",
          )}
        >
          <span
            className={cn(
              "text-xl",
              !achievement.unlocked && achievement.isHidden && "grayscale",
            )}
            aria-hidden="true"
          >
            {getIconEmoji(achievement.icon)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + Status */}
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "text-body-sm font-semibold",
                achievement.unlocked ? "text-surface-900" : "text-surface-700",
              )}
            >
              {achievement.title}
            </h4>
            {achievement.unlocked ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-primary-500" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0 text-surface-300" />
            )}
          </div>

          {/* Description */}
          <p
            className={cn(
              "mt-0.5 text-caption",
              achievement.unlocked ? "text-surface-600" : "text-surface-600",
            )}
          >
            {achievement.description}
          </p>

          {/* XP Reward */}
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant={achievement.unlocked ? "gold" : "gray"}
              size="sm"
            >
              +{achievement.xpReward} XP
            </Badge>
            {achievement.isHidden && !achievement.unlocked && (
              <Badge variant="gray" size="sm">
                Versteckt
              </Badge>
            )}
          </div>

          {/* Progress Bar (only for locked achievements) */}
          {!achievement.unlocked && !achievement.isHidden && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] font-medium text-surface-600">
                <span>Fortschritt</span>
                <span className="tabular-nums">
                  {achievement.currentProgress}/{achievement.requirementValue}
                </span>
              </div>
              <div className="mt-1">
                <ProgressBar
                  value={progressPercent}
                  variant="green"
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* Unlock Date */}
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="mt-2 text-[10px] font-medium text-surface-600">
              Freigeschaltet am {formatDate(achievement.unlockedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AchievementGroupSection({ group }: { group: AchievementGroup }) {
  const colors = CATEGORY_COLORS[group.category] ?? CATEGORY_COLORS.engagement!;
  const unlockedCount = group.achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      {/* Group Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-surface-900">
          <span
            className={cn("h-4 w-[3px] rounded-full", colors.bg.replace("bg-", "bg-").replace("-50", "-400"))}
            aria-hidden="true"
          />
          {group.label}
        </h3>
        <Badge variant={colors.badge} size="sm">
          {unlockedCount}/{group.achievements.length}
        </Badge>
      </div>

      {/* Achievement Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {group.achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Loading Skeleton
// -----------------------------------------------------------------------------

function AchievementsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-surface-200 bg-white" />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-surface-100" />
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl border border-surface-200 bg-white" />
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function AchievementsPage() {
  const [groups, setGroups] = useState<AchievementGroup[]>([]);
  const [summary, setSummary] = useState<AchievementSummary>({
    total: 0,
    unlocked: 0,
    locked: 0,
    totalXpEarned: 0,
  });
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/gamification/achievements");
      const json: AchievementsApiResponse = await res.json();

      if (json.error || !json.data) {
        setError(json.error?.message ?? "Achievements konnten nicht geladen werden.");
        return;
      }

      setSummary(json.data.summary);
      setGroups(json.data.grouped);
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Filter groups by active tab
  const filteredGroups =
    activeTab === "all"
      ? groups
      : groups.filter((g) => g.category === activeTab);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />}>
              Profil
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-headline font-bold text-surface-900">
              Achievements
            </h1>
            <p className="text-body-sm text-surface-500">
              Schalte Achievements frei und verdiene Bonus-XP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="font-display text-headline-sm font-bold text-surface-900">
            {summary.unlocked}/{summary.total}
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && <AchievementsSkeleton />}

      {/* Error */}
      {error && !loading && (
        <Card className="py-12 text-center">
          <p className="text-body text-surface-500">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={fetchAchievements}
          >
            Erneut versuchen
          </Button>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Summary */}
          <SummaryCards summary={summary} />

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-caption font-semibold transition-all duration-150",
                  activeTab === tab.key
                    ? "bg-brand-primary-50 text-brand-primary-600"
                    : "bg-surface-50 text-surface-500 hover:bg-surface-100 hover:text-surface-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Achievement Groups */}
          <div className="space-y-8">
            {filteredGroups.map((group) => (
              <AchievementGroupSection key={group.category} group={group} />
            ))}
          </div>

          {/* Empty State */}
          {filteredGroups.length === 0 && (
            <Card className="py-12 text-center">
              <Trophy className="mx-auto h-10 w-10 text-surface-300" />
              <p className="mt-3 text-body text-surface-500">
                Keine Achievements in dieser Kategorie
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
