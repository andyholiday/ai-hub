// =============================================================================
// Chat Panel Component
// Expanded chat interface that slides up from the orb position.
//
// Features:
// - Fixed position, bottom-right, 400px wide (full width on mobile)
// - Glassmorphism header with animated mini-orb
// - Context banner showing current page context
// - Scrollable chat area with user/AI message bubbles
// - Input area with send button
// - Quick-action chips
// - Smooth expand/collapse animation via Framer Motion
// =============================================================================

"use client";

import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Minimize2,
  Send,
  Sparkles,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, TypingIndicator } from "./chat-message";
import { useOrb, type OrbState } from "./orb-provider";

// -----------------------------------------------------------------------------
// Status labels shown in the chat panel header subtitle
// -----------------------------------------------------------------------------

const PANEL_STATUS_LABEL: Record<OrbState, string> = {
  idle: "Online",
  thinking: "denkt nach...",
  notification: "Online",
  celebration: "Feiert mit dir!",
  greeting: "Begruesst dich!",
  listening: "Hoert zu...",
  energized: "Voller Energie!",
};

// -----------------------------------------------------------------------------
// Quick action chip definitions
// -----------------------------------------------------------------------------

const QUICK_ACTIONS = [
  { label: "Idee bewerten", icon: Lightbulb },
  { label: "Zusammenfassen", icon: FileText },
  { label: "Vorschlag", icon: MessageSquare },
] as const;

// -----------------------------------------------------------------------------
// Animation variants
// -----------------------------------------------------------------------------

const panelVariants = {
  hidden: {
    opacity: 0,
    scale: 0.4,
    y: 60,
    x: 60,
    borderRadius: "50%",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    borderRadius: "1.25rem",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.4,
    y: 60,
    x: 60,
    borderRadius: "50%",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// -----------------------------------------------------------------------------
// Chat Panel Component
// -----------------------------------------------------------------------------

export function ChatPanel() {
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    addMessage("user", trimmed);
    setInputValue("");

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(
        "ai",
        "Das ist eine tolle Frage! Lass mich dir dabei helfen. Basierend auf deinem aktuellen Lernfortschritt habe ich ein paar Vorschlaege."
      );
    }, 2000);
  }, [inputValue, addMessage, setIsTyping]);

  // Handle quick action click
  const handleQuickAction = useCallback(
    (action: string) => {
      addMessage("user", action);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage(
          "ai",
          `Gerne helfe ich dir mit "${action}". Was genau moechtest du wissen?`
        );
      }, 1500);
    },
    [addMessage, setIsTyping]
  );

  // Handle keyboard submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "fixed bottom-4 right-4 z-[9999] flex flex-col overflow-hidden",
        "w-[400px] max-h-[85vh]",
        "rounded-[1.25rem] border border-surface-200 bg-white shadow-elevated",
        // Mobile: full-width
        "max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-h-full max-sm:rounded-none"
      )}
      role="dialog"
      aria-label="AI Mentor Chat"
    >
      {/* ------------------------------------------------------------------- */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative shrink-0">
        {/* Gradient accent bar at the very top */}
        <div className="h-1 w-full bg-gradient-to-r from-lr-green-500 via-lr-green-400 to-lr-gold-500" />

        <div className="flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur-xl">
          {/* Mini-Orb (continues breathing animation) */}
          <div
            className={cn(
              "ai-orb-core ai-orb-core--mini flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              "bg-gradient-to-br from-lr-green-500 to-lr-gold-500"
            )}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-surface-900">
              AI Mentor
            </span>
            <span className="text-[11px] text-surface-400">
              {PANEL_STATUS_LABEL[orbState]}
            </span>
          </div>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={minimize}
            className={cn(
              "ml-auto flex h-8 w-8 items-center justify-center rounded-lg",
              "text-surface-400 transition-colors duration-150",
              "hover:bg-surface-100 hover:text-surface-600",
              "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1"
            )}
            aria-label="Chat minimieren"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Context Banner                                                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="shrink-0 border-b border-surface-100 bg-surface-50 px-4 py-2">
        <div className="flex items-center gap-1.5 text-[11px] text-surface-500">
          <FileText className="h-3 w-3 shrink-0 text-lr-green-500" />
          <span className="truncate">
            Kontext: {pageContext}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Chat Messages Area                                                  */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto py-3 no-scrollbar">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={chatEndRef} />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Quick Action Chips                                                  */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-surface-100 bg-surface-50/50 px-4 py-2.5 no-scrollbar">
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleQuickAction(label)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full",
              "border border-surface-200 bg-white px-3 py-1.5",
              "text-xs font-medium text-surface-600",
              "transition-all duration-150",
              "hover:border-lr-green-300 hover:bg-lr-green-50 hover:text-lr-green-700",
              "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1"
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Input Area                                                          */}
      {/* ------------------------------------------------------------------- */}
      <div className="shrink-0 border-t border-surface-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            className={cn(
              "flex-1 rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5",
              "text-sm text-surface-800 placeholder:text-surface-400",
              "transition-colors duration-150",
              "focus:border-lr-green-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-lr-green-400"
            )}
            aria-label="Chat-Nachricht eingeben"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "bg-lr-green-500 text-white",
              "transition-all duration-150",
              "hover:bg-lr-green-600 hover:shadow-lr-green",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-lr-green-500 disabled:hover:shadow-none",
              "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1"
            )}
            aria-label="Nachricht senden"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
