// =============================================================================
// Chat Split View – Command Center
// Replaces the narrow 400px panel with an immersive split-view.
//
// Layout:
// - Desktop:  50/50 split (left: page content dimmed, right: chat panel)
// - Tablet:   60/40 split
// - Mobile:   Full-screen chat
//
// Features:
// - Glassmorphism header with animated mini cosmos orb
// - Context banner showing current page context
// - Scrollable chat with user/AI message bubbles
// - Input area with send button
// - Quick action chips
// - Fullscreen overlay with backdrop blur
// =============================================================================

"use client";

import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import {
    Lightbulb,
    Maximize2,
    Minimize2,
    Send,
    Sparkles,
    FileText,
    MessageSquare,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, TypingIndicator } from "./chat-message";
import { useOrb, type OrbState } from "./orb-provider";

// ---------------------------------------------------------------------------
// Status labels
// ---------------------------------------------------------------------------
const PANEL_STATUS_LABEL: Record<OrbState, string> = {
    idle: "Online",
    thinking: "denkt nach...",
    notification: "Online",
    celebration: "Feiert mit dir!",
    greeting: "Begrüßt dich!",
    listening: "Hört zu...",
    energized: "Voller Energie!",
};

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------
const QUICK_ACTIONS = [
    { label: "🎯 Idee bewerten", icon: Lightbulb },
    { label: "📝 Zusammenfassen", icon: FileText },
    { label: "💡 Vorschlag", icon: MessageSquare },
] as const;

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.25 } },
};

const panelVariants = {
    hidden: {
        opacity: 0,
        x: "100%",
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
        },
    },
    exit: {
        opacity: 0,
        x: "100%",
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
        },
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChatSplitView() {
    const {
        minimize,
        messages,
        addMessage,
        isTyping,
        setIsTyping,
        pageContext,
        orbState,
    } = useOrb();

    const [inputValue, setInputValue] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Focus input on mount
    useEffect(() => {
        const timer = setTimeout(() => inputRef.current?.focus(), 400);
        return () => clearTimeout(timer);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") minimize();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [minimize]);

    // Handle send message
    const handleSend = useCallback(() => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        addMessage("user", trimmed);
        setInputValue("");

        // Simulate AI response (will be replaced with real API call)
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            addMessage(
                "ai",
                "Das ist eine tolle Frage! Lass mich dir dabei helfen. Basierend auf deinem aktuellen Lernfortschritt und dem Kontext der Seite habe ich ein paar Vorschläge für dich.",
            );
        }, 2000);
    }, [inputValue, addMessage, setIsTyping]);

    // Handle quick action
    const handleQuickAction = useCallback(
        (action: string) => {
            addMessage("user", action);
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                addMessage(
                    "ai",
                    `Gerne helfe ich dir mit "${action}". Was genau möchtest du wissen?`,
                );
            }, 1500);
        },
        [addMessage, setIsTyping],
    );

    // Keyboard submit
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    return (
        <>
            {/* Backdrop overlay */}
            <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
                onClick={minimize}
                aria-hidden="true"
            />

            {/* Split-view panel */}
            <motion.div
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                    "fixed z-[9999] flex flex-col overflow-hidden",
                    "border-l border-surface-200 bg-white shadow-2xl",
                    // Desktop: right half
                    isFullscreen
                        ? "inset-0"
                        : "bottom-0 right-0 top-0 w-full sm:w-[50vw] lg:w-[40vw] xl:w-[35vw]",
                    // Mobile: full screen
                    "max-sm:inset-0 max-sm:w-full",
                )}
                role="dialog"
                aria-label="AI Mentor Command Center"
                aria-modal="true"
            >
                {/* ----------------------------------------------------------------- */}
                {/* Header                                                            */}
                {/* ----------------------------------------------------------------- */}
                <div className="relative shrink-0">
                    {/* Gradient accent bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-lr-green-500 via-lr-green-400 to-lr-gold-500" />

                    <div className="flex items-center gap-3 bg-white/90 px-5 py-4 backdrop-blur-xl">
                        {/* Mini Cosmos Orb */}
                        <div className="cosmos-core-mini relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lr-green-500 to-lr-gold-500 shadow-md">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>

                        {/* Title */}
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-surface-900">
                                AI Mentor
                            </span>
                            <span className="text-[11px] text-surface-400">
                                {PANEL_STATUS_LABEL[orbState]}
                            </span>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Fullscreen Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsFullscreen((p) => !p)}
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg",
                                "text-surface-400 transition-colors duration-150",
                                "hover:bg-surface-100 hover:text-surface-600",
                                "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1",
                                "max-sm:hidden",
                            )}
                            aria-label={isFullscreen ? "Normalgröße" : "Vollbild"}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </button>

                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={minimize}
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg",
                                "text-surface-400 transition-colors duration-150",
                                "hover:bg-red-50 hover:text-red-500",
                                "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1",
                            )}
                            aria-label="Chat schließen"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* Context Banner                                                    */}
                {/* ----------------------------------------------------------------- */}
                <div className="shrink-0 border-b border-surface-100 bg-gradient-to-r from-surface-50 to-white px-5 py-2.5">
                    <div className="flex items-center gap-2 text-[11px] text-surface-500">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-lr-green-500" />
                        <span className="truncate font-medium">
                            Kontext: {pageContext}
                        </span>
                    </div>
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* Chat Messages Area                                                */}
                {/* ----------------------------------------------------------------- */}
                <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-lr-green-500/10 to-lr-gold-500/10">
                                <Sparkles className="h-8 w-8 text-lr-green-500" />
                            </div>
                            <p className="text-sm font-semibold text-surface-700">
                                Wie kann ich dir helfen?
                            </p>
                            <p className="text-xs text-surface-400">
                                Frag mich alles über KI, Lernpfade oder lass mich deine Ideen bewerten.
                            </p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}

                    {isTyping && <TypingIndicator />}

                    <div ref={chatEndRef} />
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* Quick Action Chips                                                */}
                {/* ----------------------------------------------------------------- */}
                <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-surface-100 bg-surface-50/50 px-5 py-3 no-scrollbar">
                    {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => handleQuickAction(label)}
                            className={cn(
                                "flex shrink-0 items-center gap-1.5 rounded-full",
                                "border border-surface-200 bg-white px-3.5 py-2",
                                "text-xs font-medium text-surface-600",
                                "transition-all duration-200",
                                "hover:border-lr-green-300 hover:bg-lr-green-50 hover:text-lr-green-700 hover:shadow-sm",
                                "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1",
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* Input Area                                                        */}
                {/* ----------------------------------------------------------------- */}
                <div className="shrink-0 border-t border-surface-200 bg-white px-5 py-4">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nachricht an den AI Mentor..."
                            className={cn(
                                "flex-1 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3",
                                "text-sm text-surface-800 placeholder:text-surface-400",
                                "transition-all duration-200",
                                "focus:border-lr-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lr-green-400/30",
                            )}
                            aria-label="Nachricht eingeben"
                        />

                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                                "bg-gradient-to-r from-lr-green-500 to-lr-green-600 text-white",
                                "transition-all duration-200",
                                "hover:shadow-lg hover:shadow-lr-green-500/25",
                                "disabled:cursor-not-allowed disabled:opacity-40",
                                "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1",
                            )}
                            aria-label="Nachricht senden"
                        >
                            <Send className="h-4.5 w-4.5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
