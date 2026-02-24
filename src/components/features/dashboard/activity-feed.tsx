// =============================================================================
// ActivityFeed Component
// Dashboard activity feed with color-coded tags and staggered animations
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, MessageCircle, Eye, Clock, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type FeedItemTag = "best-practice" | "achievement" | "diskussion" | "challenge";

interface FeedAction {
  icon: React.ReactNode;
  label: string;
  isXp?: boolean;
  isHighlight?: boolean;
}

interface FeedItem {
  id: string;
  author: string;
  initials: string;
  avatarColor: string;
  time: string;
  department: string;
  tag: FeedItemTag;
  title: string;
  excerpt: string;
  actions: FeedAction[];
}

interface ActivityFeedProps {
  className?: string;
}

// -----------------------------------------------------------------------------
// Tag Configuration
// -----------------------------------------------------------------------------

const tagConfig: Record<FeedItemTag, { label: string; classes: string }> = {
  "best-practice": {
    label: "Best Practice",
    classes: "bg-brand-primary-50 text-brand-primary-600",
  },
  achievement: {
    label: "Achievement",
    classes: "bg-purple-50 text-purple-600",
  },
  diskussion: {
    label: "Diskussion",
    classes: "bg-blue-50 text-blue-500",
  },
  challenge: {
    label: "Challenge",
    classes: "bg-orange-50 text-amber-500",
  },
};

// -----------------------------------------------------------------------------
// Demo Data
// -----------------------------------------------------------------------------

const feedItems: FeedItem[] = [
  {
    id: "1",
    author: "Markus Koenig",
    initials: "MK",
    avatarColor: "bg-blue-500",
    time: "Vor 25 Min",
    department: "Marketing",
    tag: "best-practice",
    title: "ChatGPT-Prompts fuer Social Media Content",
    excerpt:
      "Eine Sammlung von 15 getesteten Prompts fuer Social Media Posts. Inkl. Vorher/Nachher-Vergleiche und Zeitersparnis-Analyse.",
    actions: [
      { icon: <ThumbsUp className="h-3.5 w-3.5" />, label: "24" },
      { icon: <MessageCircle className="h-3.5 w-3.5" />, label: "8" },
      { icon: <Eye className="h-3.5 w-3.5" />, label: "156" },
      { icon: <Trophy className="h-3.5 w-3.5" />, label: "+50 XP", isXp: true },
    ],
  },
  {
    id: "2",
    author: "Lisa Peters",
    initials: "LP",
    avatarColor: "bg-purple-500",
    time: "Vor 2 Std",
    department: "Produktentwicklung",
    tag: "achievement",
    title: 'Lisa hat Level "AI Champion" erreicht!',
    excerpt:
      'Herzlichen Glueckwunsch! Lisa ist die dritte Kollegin auf Level 5 -- besonders durch ihre Workshop-Reihe "KI in der Produktentwicklung".',
    actions: [
      { icon: <ThumbsUp className="h-3.5 w-3.5" />, label: "42", isHighlight: true },
      { icon: <MessageCircle className="h-3.5 w-3.5" />, label: "15 Gratulationen" },
    ],
  },
  {
    id: "3",
    author: "Thomas Wagner",
    initials: "TW",
    avatarColor: "bg-brand-accent-500",
    time: "Vor 3 Std",
    department: "IT",
    tag: "diskussion",
    title: "Welche KI-Tools nutzt ihr fuer Datenanalyse?",
    excerpt:
      "Ich evaluiere verschiedene Tools fuer Vertriebsdaten-Analyse. Erfahrungen mit Claude, Copilot oder Julius AI?",
    actions: [
      { icon: <ThumbsUp className="h-3.5 w-3.5" />, label: "11" },
      { icon: <MessageCircle className="h-3.5 w-3.5" />, label: "23" },
      { icon: <Eye className="h-3.5 w-3.5" />, label: "89" },
    ],
  },
  {
    id: "4",
    author: "Julia Richter",
    initials: "JR",
    avatarColor: "bg-pink-500",
    time: "Vor 5 Std",
    department: "HR",
    tag: "challenge",
    title: 'Wochenchallenge: "KI-Optimierung eines Arbeitsprozesses"',
    excerpt:
      "Dokumentiere einen mit KI optimierten Arbeitsprozess. 75 Bonus-XP zu gewinnen!",
    actions: [
      { icon: <Clock className="h-3.5 w-3.5" />, label: "4 Tage uebrig" },
      { icon: <Users className="h-3.5 w-3.5" />, label: "18 Teilnehmer" },
      { icon: <Trophy className="h-3.5 w-3.5" />, label: "75 XP", isXp: true },
    ],
  },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ActivityFeed({ className }: ActivityFeedProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className={cn("flex flex-col", className)}>
      {/* Section Title */}
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-surface-900">
        <span
          className="h-4 w-[3px] rounded-full bg-brand-primary-500"
          aria-hidden="true"
        />
        Aktivitaets-Feed
      </h2>

      {/* Feed Items */}
      <div className="flex flex-col gap-3.5">
        {feedItems.map((item, index) => {
          const tag = tagConfig[item.tag];

          return (
            <article
              key={item.id}
              className={cn(
                // Base card
                "rounded-[14px] border border-surface-200 bg-white p-5",
                "shadow-card",
                "cursor-pointer transition-all duration-300 ease-out",
                // Hover
                "hover:-translate-y-0.5 hover:border-surface-300 hover:shadow-card-hover",
                // Fade-in
                "translate-y-2 opacity-0",
                mounted && "translate-y-0 opacity-100"
              )}
              style={{
                transitionDelay: mounted ? `${index * 100}ms` : "0ms",
              }}
            >
              {/* Card Header */}
              <div className="mb-3.5 flex items-center gap-2.5">
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    "text-caption font-semibold text-white",
                    item.avatarColor
                  )}
                  aria-hidden="true"
                >
                  {item.initials}
                </div>

                {/* Author Info */}
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm font-semibold text-surface-900">
                    {item.author}
                  </div>
                  <div className="text-[11px] text-surface-400">
                    {item.time} · {item.department}
                  </div>
                </div>

                {/* Tag */}
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold",
                    tag.classes
                  )}
                >
                  {tag.label}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-body font-semibold leading-snug text-surface-900">
                {item.title}
              </h3>

              {/* Excerpt */}
              <p className="mt-1.5 text-body-sm leading-relaxed text-surface-500">
                {item.excerpt}
              </p>

              {/* Footer */}
              <div className="mt-3.5 flex items-center gap-3.5 border-t border-surface-100 pt-3.5">
                {item.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-caption transition-colors duration-150",
                      action.isXp
                        ? "ml-auto font-semibold text-brand-accent-500"
                        : "text-surface-400 hover:text-brand-primary-500"
                    )}
                    type="button"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
