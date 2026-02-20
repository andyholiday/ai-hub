// =============================================================================
// MentorMini Component
// AI Mentor mini card with input and suggestion chips
// =============================================================================

"use client";

import { useState } from "react";
import { Bot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface MentorMiniProps {
  /** Personalized message from the AI Mentor */
  message?: string;
  /** User name for personalization */
  userName?: string;
  className?: string;
}

// -----------------------------------------------------------------------------
// Suggestion Chips
// -----------------------------------------------------------------------------

const suggestions = [
  { label: "Naechster Kurs?", icon: "💡" },
  { label: "Mein Fortschritt", icon: "📊" },
  { label: "Idee bewerten", icon: "🎯" },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function MentorMini({
  message = 'Hi Sarah! Basierend auf deinem Fortschritt empfehle ich dir heute den Kurs "Advanced Prompt Engineering".',
  className,
}: MentorMiniProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    // Future: send to AI mentor endpoint
    setInputValue("");
  };

  const handleChipClick = (label: string) => {
    setInputValue(label);
  };

  return (
    <div
      className={cn(
        // Base card
        "relative overflow-hidden rounded-[14px] border border-surface-200 bg-white p-5",
        "shadow-card",
        "animate-fade-up",
        className
      )}
    >
      {/* Top gradient border */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-lr-green-500 to-lr-gold-500"
        aria-hidden="true"
      />

      {/* Title */}
      <h3 className="flex items-center gap-1.5 text-body font-semibold text-surface-900">
        <Bot className="h-4 w-4 text-lr-green-500" aria-hidden="true" />
        AI Mentor
      </h3>

      {/* Message */}
      <p className="mt-2 text-caption leading-relaxed text-surface-500">
        {message}
      </p>

      {/* Input + Send */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Frag mich etwas..."
          className={cn(
            "flex-1 rounded-lg border border-surface-300 bg-surface-50 px-3.5 py-2.5",
            "font-sans text-caption text-surface-900 placeholder:text-surface-400",
            "transition-colors duration-150",
            "focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20"
          )}
          aria-label="Nachricht an den AI Mentor"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className={cn(
            "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg",
            "bg-lr-green-500 text-white",
            "transition-all duration-150",
            "hover:bg-lr-green-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-2"
          )}
          aria-label="Nachricht senden"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Suggestion Chips */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {suggestions.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleChipClick(chip.label)}
            className={cn(
              "rounded-md border border-surface-300 bg-surface-50 px-2.5 py-1",
              "font-sans text-[10px] text-surface-500",
              "transition-all duration-150",
              "hover:border-lr-green-500 hover:text-lr-green-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-1"
            )}
          >
            {chip.icon} {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
