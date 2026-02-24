// =============================================================================
// Mentor Signals API Route
// GET  /api/mentor/signals – Fetch active signals for the current user
// POST /api/mentor/signals – Generate a page-entry briefing
// PATCH /api/mentor/signals – Mark signal(s) as read/dismissed
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";

export const dynamic = 'force-dynamic';

// Note: mentor_signals table types will be fully available after running
// migration 00010 and regenerating types with `supabase gen types`.
// Until then, we use explicit typing for insert/update operations.

type MentorSignalType =
    | "page_entry_briefing"
    | "inline_suggestion"
    | "scroll_trigger"
    | "inactivity_nudge"
    | "achievement_congrats"
    | "streak_motivation"
    | "course_reminder"
    | "smart_notification";

// ---------------------------------------------------------------------------
// GET – Fetch active (unread, undismissed) signals for the current user
// Query params: ?page=dashboard&limit=10
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;
    const { userId, supabase } = auth;

    const url = new URL(req.url);
    const page = url.searchParams.get("page") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 50);

    try {
        let query = supabase
            .from("mentor_signals")
            .select("*")
            .eq("user_id", userId)
            .eq("is_read", false)
            .eq("is_dismissed", false)
            .order("priority", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(limit);

        if (page) {
            query = query.eq("page_context", page);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[Mentor Signals] GET error:", error);
            return NextResponse.json(
                { data: null, error: { code: "DB_ERROR", message: error.message } },
                { status: 500 },
            );
        }

        // Count unread signals (for notification badge)
        const { count } = await supabase
            .from("mentor_signals")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false)
            .eq("is_dismissed", false);

        return NextResponse.json(
            {
                data: {
                    signals: data || [],
                    unreadCount: count || 0,
                },
                error: null,
            },
            {
                headers: {
                    "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
                },
            },
        );
    } catch (err) {
        console.error("[Mentor Signals] GET unexpected error:", err);
        return NextResponse.json(
            { data: null, error: { code: "INTERNAL_ERROR", message: "Internal error" } },
            { status: 500 },
        );
    }
}

// ---------------------------------------------------------------------------
// POST – Generate a page-entry briefing or custom signal
// Body: { page: "dashboard" | "learn-hub" | "community" | ... }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;
    const { userId, supabase } = auth;

    try {
        const body = await req.json();
        const { page, signalType, title, content } = body as {
            page?: string;
            signalType?: string;
            title?: string;
            content?: string;
        };

        // If custom signal content is provided, insert directly
        if (signalType && content) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("mentor_signals")
                .insert({
                    user_id: userId,
                    signal_type: signalType as MentorSignalType,
                    page_context: page || "dashboard",
                    title: title || "AI Mentor",
                    content,
                    priority: 5,
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error("[Mentor Signals] POST insert error:", error);
                return NextResponse.json(
                    { data: null, error: { code: "DB_ERROR", message: error.message } },
                    { status: 500 },
                );
            }

            return NextResponse.json({ data, error: null }, { status: 201 });
        }

        // Generate a page-entry briefing using the DB function
        if (page) {
            // Check if briefing was already generated recently
            const { data: existing } = await supabase
                .from("mentor_signals")
                .select("id")
                .eq("user_id", userId)
                .eq("page_context", page)
                .eq("signal_type", "page_entry_briefing")
                .eq("is_dismissed", false)
                .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
                .limit(1);

            if (existing && existing.length > 0) {
                // Return existing briefing
                return NextResponse.json({
                    data: { skipped: true, existingId: ((existing as Record<string, unknown>[])[0] as Record<string, unknown>).id },
                    error: null,
                });
            }

            // Generate briefing based on page context
            const briefing = generateBriefingContent(page);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("mentor_signals")
                .insert({
                    user_id: userId,
                    signal_type: "page_entry_briefing",
                    page_context: page,
                    title: briefing.title,
                    content: briefing.content,
                    priority: 7,
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error("[Mentor Signals] POST briefing error:", error);
                return NextResponse.json(
                    { data: null, error: { code: "DB_ERROR", message: error.message } },
                    { status: 500 },
                );
            }

            return NextResponse.json({ data, error: null }, { status: 201 });
        }

        return NextResponse.json(
            {
                data: null,
                error: { code: "BAD_REQUEST", message: "Missing 'page' or 'content' parameter" },
            },
            { status: 400 },
        );
    } catch (err) {
        console.error("[Mentor Signals] POST unexpected error:", err);
        return NextResponse.json(
            { data: null, error: { code: "INTERNAL_ERROR", message: "Internal error" } },
            { status: 500 },
        );
    }
}

// ---------------------------------------------------------------------------
// PATCH – Mark signal(s) as read or dismissed
// Body: { ids: string[], action: "read" | "dismiss" }
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;
    const { userId, supabase } = auth;

    try {
        const body = await req.json();
        const { ids, action } = body as { ids?: string[]; action?: "read" | "dismiss" };

        if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
            return NextResponse.json(
                {
                    data: null,
                    error: { code: "BAD_REQUEST", message: "Missing 'ids' array or 'action'" },
                },
                { status: 400 },
            );
        }

        const updateData =
            action === "read"
                ? { is_read: true, shown_at: new Date().toISOString() }
                : { is_dismissed: true };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from("mentor_signals")
            .update(updateData)
            .eq("user_id", userId)
            .in("id", ids);

        if (error) {
            console.error("[Mentor Signals] PATCH error:", error);
            return NextResponse.json(
                { data: null, error: { code: "DB_ERROR", message: error.message } },
                { status: 500 },
            );
        }

        return NextResponse.json({ data: { updated: ids.length }, error: null });
    } catch (err) {
        console.error("[Mentor Signals] PATCH unexpected error:", err);
        return NextResponse.json(
            { data: null, error: { code: "INTERNAL_ERROR", message: "Internal error" } },
            { status: 500 },
        );
    }
}

// ---------------------------------------------------------------------------
// Helper: Generate briefing content based on page context
// ---------------------------------------------------------------------------
function generateBriefingContent(page: string): {
    title: string;
    content: string;
} {
    switch (page) {
        case "dashboard":
            return {
                title: "Willkommen zurück! 👋",
                content:
                    "Schön, dass du da bist! Schau dir deine neuesten Empfehlungen an und halte deine Streak aufrecht. 🔥",
            };
        case "learn-hub":
            return {
                title: "Lernfortschritt 📚",
                content:
                    "Setze deinen Lernpfad fort! Nur noch wenige Lektionen bis zum nächsten Zertifikat. 💪",
            };
        case "community":
            return {
                title: "Community Updates 💬",
                content:
                    "Neue Diskussionen und Ideen warten auf dein Feedback. Teile dein Wissen und sammle XP!",
            };
        case "challenges":
            return {
                title: "Challenges warten! 🏆",
                content:
                    "Aktive Challenges stehen bereit. Schließe eine ab und steige im Leaderboard auf!",
            };
        case "innovation-radar":
            return {
                title: "Innovation Radar 🌐",
                content:
                    "Entdecke die neuesten KI-Trends und wie sie im Unternehmen eingesetzt werden koennen.",
            };
        case "best-practices":
            return {
                title: "Best Practices 📋",
                content:
                    "Neue Best Practices wurden geteilt. Lass dich inspirieren und teile dein Wissen!",
            };
        default:
            return {
                title: "AI Mentor Tipp 🤖",
                content:
                    "Brauchst du Hilfe? Klick mich an und ich unterstütze dich auf dieser Seite!",
            };
    }
}
