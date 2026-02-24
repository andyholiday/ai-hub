// =============================================================================
// Page Entry Briefing Banner
// A slim, animated banner that slides in from the top when entering a page.
// Shows a personalized context-aware message from the AI Mentor.
//
// Design:
// - Glassmorphism background with gradient border
// - AI Mentor avatar + message text
// - Auto-dismiss after 8 seconds
// - Manual dismiss with X button
// - Slide-down entrance animation
// =============================================================================

"use client";

import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useMentorSignals, type MentorSignal } from "@/hooks/use-mentor-signals";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PageBriefingBannerProps {
    /** The current page context (e.g., "dashboard", "learn-hub") */
    pageContext: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PageBriefingBanner({ pageContext }: PageBriefingBannerProps) {
    const { activeBriefing, dismiss, markAsRead } = useMentorSignals(pageContext);
    const [isVisible, setIsVisible] = useState(false);
    const [currentBriefing, setCurrentBriefing] = useState<MentorSignal | null>(null);

    // Show banner when briefing becomes available
    useEffect(() => {
        if (activeBriefing && !currentBriefing) {
            // Small delay so it feels like the page "triggers" it
            const timer = setTimeout(() => {
                setCurrentBriefing(activeBriefing);
                setIsVisible(true);
                // Mark as read (shown)
                markAsRead([activeBriefing.id]).catch(() => { });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [activeBriefing, currentBriefing, markAsRead]);

    // Auto-dismiss after 8 seconds
    useEffect(() => {
        if (!isVisible || !currentBriefing) return;

        const timer = setTimeout(() => {
            setIsVisible(false);
            // Dismiss after animation completes
            setTimeout(() => {
                if (currentBriefing) {
                    dismiss([currentBriefing.id]).catch(() => { });
                }
            }, 400);
        }, 8000);

        return () => clearTimeout(timer);
    }, [isVisible, currentBriefing, dismiss]);

    // Manual dismiss
    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            if (currentBriefing) {
                dismiss([currentBriefing.id]).catch(() => { });
            }
        }, 400);
    }, [currentBriefing, dismiss]);

    return (
        <AnimatePresence>
            {isVisible && currentBriefing && (
                <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    }}
                    className="mb-4 overflow-hidden"
                >
                    <div
                        className={cn(
                            "relative flex items-center gap-3 rounded-xl px-4 py-3",
                            "bg-gradient-to-r from-white to-brand-primary-50/50",
                            "border border-brand-primary-200/50",
                            "shadow-sm",
                        )}
                    >
                        {/* Gradient left accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-brand-primary-500 to-brand-accent-500" />

                        {/* AI Mentor Avatar */}
                        <div className="cosmos-core-mini flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 shadow-sm">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                            {currentBriefing.title && (
                                <span className="text-xs font-bold text-surface-800 truncate">
                                    {currentBriefing.title}
                                </span>
                            )}
                            <span className="text-xs text-surface-600 leading-relaxed line-clamp-2">
                                {currentBriefing.content}
                            </span>
                        </div>

                        {/* Dismiss button */}
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className={cn(
                                "ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                                "text-surface-400 transition-colors",
                                "hover:bg-surface-100 hover:text-surface-600",
                            )}
                            aria-label="Hinweis schließen"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>

                        {/* Progress bar (auto-dismiss timer) */}
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 8, ease: "linear" }}
                            className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-brand-primary-500 to-brand-accent-500"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
