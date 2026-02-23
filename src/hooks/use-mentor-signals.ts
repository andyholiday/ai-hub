// =============================================================================
// useMentorSignals Hook
// Fetches and manages proactive mentor signals for the current page context.
//
// Features:
// - Auto-fetch signals on mount and page context change
// - Generate page-entry briefings automatically
// - Mark signals as read/dismissed
// - Unread count for notification badge
// - Stale-while-revalidate caching
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MentorSignal {
    id: string;
    user_id: string;
    signal_type: string;
    page_context: string;
    title: string | null;
    content: string;
    priority: number;
    metadata: Record<string, unknown>;
    is_read: boolean;
    is_dismissed: boolean;
    shown_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

interface MentorSignalsState {
    signals: MentorSignal[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

interface UseMentorSignalsReturn extends MentorSignalsState {
    /** The active briefing signal for the current page (if any) */
    activeBriefing: MentorSignal | null;
    /** All inline suggestion signals */
    inlineSuggestions: MentorSignal[];
    /** Generate a briefing for the given page context */
    generateBriefing: (page: string) => Promise<void>;
    /** Mark one or more signals as read */
    markAsRead: (ids: string[]) => Promise<void>;
    /** Dismiss one or more signals */
    dismiss: (ids: string[]) => Promise<void>;
    /** Refresh signals from the API */
    refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 15_000; // 15 seconds

let signalsCache: {
    data: MentorSignalsState | null;
    timestamp: number;
    page: string | null;
} = { data: null, timestamp: 0, page: null };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMentorSignals(pageContext?: string): UseMentorSignalsReturn {
    const [state, setState] = useState<MentorSignalsState>({
        signals: [],
        unreadCount: 0,
        isLoading: true,
        error: null,
    });

    const abortRef = useRef<AbortController | null>(null);
    const hasFetchedRef = useRef(false);

    // Fetch signals from API
    const fetchSignals = useCallback(
        async (forceRefresh = false) => {
            // Check cache
            if (
                !forceRefresh &&
                signalsCache.data &&
                signalsCache.page === (pageContext ?? null) &&
                Date.now() - signalsCache.timestamp < CACHE_TTL_MS
            ) {
                setState(signalsCache.data);
                return;
            }

            // Abort any in-flight request
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                setState((prev) => ({ ...prev, isLoading: true, error: null }));

                const params = new URLSearchParams();
                if (pageContext) params.set("page", pageContext);
                params.set("limit", "10");

                const res = await fetch(`/api/mentor/signals?${params}`, {
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const json = await res.json();

                if (json.error) {
                    throw new Error(json.error.message);
                }

                const newState: MentorSignalsState = {
                    signals: json.data.signals ?? [],
                    unreadCount: json.data.unreadCount ?? 0,
                    isLoading: false,
                    error: null,
                };

                // Update cache
                signalsCache = {
                    data: newState,
                    timestamp: Date.now(),
                    page: pageContext ?? null,
                };

                setState(newState);
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") return;
                console.error("[useMentorSignals] Fetch error:", err);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: err instanceof Error ? err.message : "Unknown error",
                }));
            }
        },
        [pageContext],
    );

    // Generate a page-entry briefing
    const generateBriefing = useCallback(
        async (page: string) => {
            try {
                const res = await fetch("/api/mentor/signals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ page }),
                });

                if (res.ok) {
                    // Refresh signals to pick up the new briefing
                    await fetchSignals(true);
                }
            } catch (err) {
                console.error("[useMentorSignals] Generate briefing error:", err);
            }
        },
        [fetchSignals],
    );

    // Mark signals as read
    const markAsRead = useCallback(
        async (ids: string[]) => {
            try {
                await fetch("/api/mentor/signals", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids, action: "read" }),
                });

                // Optimistic update
                setState((prev) => ({
                    ...prev,
                    signals: prev.signals.map((s) =>
                        ids.includes(s.id) ? { ...s, is_read: true } : s,
                    ),
                    unreadCount: Math.max(0, prev.unreadCount - ids.length),
                }));

                // Invalidate cache
                signalsCache.timestamp = 0;
            } catch (err) {
                console.error("[useMentorSignals] Mark as read error:", err);
            }
        },
        [],
    );

    // Dismiss signals
    const dismiss = useCallback(
        async (ids: string[]) => {
            try {
                await fetch("/api/mentor/signals", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids, action: "dismiss" }),
                });

                // Optimistic update
                setState((prev) => ({
                    ...prev,
                    signals: prev.signals.filter((s) => !ids.includes(s.id)),
                    unreadCount: Math.max(0, prev.unreadCount - ids.length),
                }));

                // Invalidate cache
                signalsCache.timestamp = 0;
            } catch (err) {
                console.error("[useMentorSignals] Dismiss error:", err);
            }
        },
        [],
    );

    // Refresh
    const refresh = useCallback(async () => {
        await fetchSignals(true);
    }, [fetchSignals]);

    // Auto-fetch on mount and page context change
    useEffect(() => {
        hasFetchedRef.current = false;
        fetchSignals();

        return () => {
            abortRef.current?.abort();
        };
    }, [fetchSignals]);

    // Auto-generate page briefing on first mount
    useEffect(() => {
        if (!hasFetchedRef.current && pageContext && !state.isLoading) {
            hasFetchedRef.current = true;
            // Generate briefing (fire-and-forget, won't error if table doesn't exist)
            generateBriefing(pageContext).catch(() => { });
        }
    }, [pageContext, state.isLoading, generateBriefing]);

    // Derived data
    const activeBriefing =
        state.signals.find(
            (s) =>
                s.signal_type === "page_entry_briefing" &&
                s.page_context === pageContext,
        ) ?? null;

    const inlineSuggestions = state.signals.filter(
        (s) => s.signal_type === "inline_suggestion",
    );

    return {
        ...state,
        activeBriefing,
        inlineSuggestions,
        generateBriefing,
        markAsRead,
        dismiss,
        refresh,
    };
}
