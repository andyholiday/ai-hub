// =============================================================================
// Smart Notification Queue
// Shows the unread signal count as a dot badge on the Cosmos Companion.
// When the orb is expanded, shows a prioritized list of mentor signals
// instead of an empty chat.
// =============================================================================

"use client";

import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronRight, Sparkles, X } from "lucide-react";
import { useMentorSignals, type MentorSignal } from "@/hooks/use-mentor-signals";
import { useCallback } from "react";

// ---------------------------------------------------------------------------
// Signal Type Icons & Colors
// ---------------------------------------------------------------------------
const SIGNAL_TYPE_CONFIG: Record<
    string,
    { emoji: string; color: string; bgColor: string }
> = {
    page_entry_briefing: {
        emoji: "👋",
        color: "text-lr-green-600",
        bgColor: "bg-lr-green-50",
    },
    inline_suggestion: {
        emoji: "💡",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
    },
    scroll_trigger: {
        emoji: "📖",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
    },
    inactivity_nudge: {
        emoji: "🤔",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
    },
    achievement_congrats: {
        emoji: "🎉",
        color: "text-lr-gold-600",
        bgColor: "bg-lr-gold-50",
    },
    streak_motivation: {
        emoji: "🔥",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
    },
    course_reminder: {
        emoji: "📚",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
    },
    smart_notification: {
        emoji: "🤖",
        color: "text-lr-green-600",
        bgColor: "bg-lr-green-50",
    },
};

// ---------------------------------------------------------------------------
// NotificationQueue Component (for embedding in the chat split view)
// ---------------------------------------------------------------------------
interface NotificationQueueProps {
    pageContext?: string;
    onDismiss?: (signal: MentorSignal) => void;
}

export function NotificationQueue({ pageContext, onDismiss }: NotificationQueueProps) {
    const { signals, dismiss, markAsRead } = useMentorSignals(pageContext);

    const handleDismiss = useCallback(
        (signal: MentorSignal) => {
            dismiss([signal.id]).catch(() => { });
            onDismiss?.(signal);
        },
        [dismiss, onDismiss],
    );

    const handleRead = useCallback(
        (signal: MentorSignal) => {
            markAsRead([signal.id]).catch(() => { });
        },
        [markAsRead],
    );

    if (signals.length === 0) return null;

    return (
        <div className="px-4 py-3">
            {/* Header */}
            <div className="mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4 text-lr-green-500" />
                <span className="text-xs font-bold text-surface-700">
                    Smarte Empfehlungen
                </span>
                <span className="ml-auto rounded-full bg-lr-green-100 px-2 py-0.5 text-[10px] font-bold text-lr-green-700">
                    {signals.length} neu
                </span>
            </div>

            {/* Signal List */}
            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {signals.map((signal) => {
                        const config =
                            SIGNAL_TYPE_CONFIG[signal.signal_type] ??
                            SIGNAL_TYPE_CONFIG.smart_notification!;

                        return (
                            <motion.div
                                key={signal.id}
                                layout
                                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={cn(
                                    "group relative flex items-start gap-2.5 rounded-lg p-2.5",
                                    "border border-surface-100 bg-white",
                                    "transition-all duration-150",
                                    "hover:border-surface-200 hover:shadow-sm",
                                    "cursor-pointer",
                                )}
                                onClick={() => handleRead(signal)}
                            >
                                {/* Type Icon */}
                                <div
                                    className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
                                        config.bgColor,
                                    )}
                                >
                                    {config.emoji}
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    {signal.title && (
                                        <p className="truncate text-xs font-semibold text-surface-800">
                                            {signal.title}
                                        </p>
                                    )}
                                    <p className="line-clamp-2 text-[11px] leading-relaxed text-surface-500">
                                        {signal.content}
                                    </p>
                                </div>

                                {/* Dismiss */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDismiss(signal);
                                    }}
                                    className={cn(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                                        "text-surface-300 opacity-0",
                                        "transition-all duration-150",
                                        "group-hover:opacity-100 hover:bg-surface-100 hover:text-surface-500",
                                    )}
                                    aria-label="Hinweis entfernen"
                                >
                                    <X className="h-3 w-3" />
                                </button>

                                {/* Chevron */}
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-surface-300 transition-transform group-hover:translate-x-0.5 group-hover:text-surface-400" />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// NotificationBadge (for displaying unread count on the orb)
// ---------------------------------------------------------------------------
interface NotificationBadgeProps {
    count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
    if (count <= 0) return null;

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={cn(
                "absolute -right-1 -top-1 z-30 flex h-5 min-w-5 items-center justify-center",
                "rounded-full bg-lr-gold-500 px-1",
                "text-[10px] font-bold text-white",
                "shadow-md",
                "cosmos-notification-dot",
            )}
        >
            {count > 99 ? "99+" : count}
        </motion.div>
    );
}
