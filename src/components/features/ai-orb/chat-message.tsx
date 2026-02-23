// =============================================================================
// Chat Message Component
// Renders individual chat messages for user and AI roles.
// Includes a typing indicator with three pulsing dots.
// =============================================================================

"use client";

import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Bot } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "./orb-provider";

// -----------------------------------------------------------------------------
// Typing Indicator
// -----------------------------------------------------------------------------

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-1.5">
      {/* AI Avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lr-green-500 to-lr-gold-500">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>

      {/* Dots */}
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-lr-green-50 px-4 py-3">
        <span className="ai-orb-typing-dot h-1.5 w-1.5 rounded-full bg-lr-green-500/60" />
        <span
          className="ai-orb-typing-dot h-1.5 w-1.5 rounded-full bg-lr-green-500/60"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="ai-orb-typing-dot h-1.5 w-1.5 rounded-full bg-lr-green-500/60"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Chat Message
// -----------------------------------------------------------------------------

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.role === "ai";

  return (
    <div
      className={cn("flex items-start gap-2.5 px-4 py-1.5", {
        "flex-row-reverse": !isAI,
      })}
    >
      {/* Avatar (AI only) */}
      {isAI && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lr-green-500 to-lr-gold-500">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      {/* Bubble */}
      <div className="flex max-w-[80%] flex-col gap-1">
        <div
          className={cn("rounded-2xl px-3.5 py-2.5 text-body-sm leading-relaxed", {
            // AI bubble
            "rounded-tl-sm border-l-2 border-lr-green-400 bg-lr-green-50 text-surface-800":
              isAI,
            // User bubble
            "rounded-tr-sm bg-surface-100 text-surface-800": !isAI,
          })}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <span
          className={cn("text-[10px] text-surface-400", {
            "pl-1": isAI,
            "pr-1 text-right": !isAI,
          })}
          suppressHydrationWarning
        >
          {format(message.timestamp, "HH:mm", { locale: de })}
        </span>
      </div>
    </div>
  );
}
