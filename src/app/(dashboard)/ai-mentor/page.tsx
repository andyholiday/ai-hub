// =============================================================================
// AI Mentor Page
// Full-page AI chat interface embedded directly in the page content area.
// Uses the existing OrbProvider context for chat state management.
// =============================================================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { useOrbPageState } from "@/components/features/ai-orb/use-orb-page-state";
import { useOrb } from "@/components/features/ai-orb/orb-provider";
import { ChatMessage, TypingIndicator } from "@/components/features/ai-orb/chat-message";
import { Card } from "@/components/ui/card";
import {
  Send,
  Sparkles,
  BookOpen,
  Lightbulb,
  MessageSquare,
  FileText,
  Zap,
  Flame,
  Trophy,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Quick Action Definitions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    label: "KI-Grundlagen erklaeren",
    icon: BookOpen,
    prompt: "Erklaere mir die wichtigsten KI-Grundlagen fuer meinen Arbeitsalltag.",
  },
  {
    label: "Prompt verbessern",
    icon: Lightbulb,
    prompt: "Hilf mir, einen besseren Prompt zu formulieren.",
  },
  {
    label: "Use-Case bewerten",
    icon: FileText,
    prompt: "Ich habe eine Idee fuer einen KI-Use-Case. Kannst du ihn bewerten?",
  },
  {
    label: "Lernempfehlung",
    icon: Zap,
    prompt: "Welchen Kurs sollte ich als naechstes belegen?",
  },
] as const;

// ---------------------------------------------------------------------------
// Mentor Stats Cards
// ---------------------------------------------------------------------------

const MENTOR_STATS = [
  {
    icon: MessageSquare,
    label: "Gespraeche",
    value: "12",
    color: "text-brand-primary-600",
    bg: "bg-brand-primary-50",
  },
  {
    icon: Flame,
    label: "Streak",
    value: "5 Tage",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Trophy,
    label: "XP verdient",
    value: "240",
    color: "text-brand-accent-600",
    bg: "bg-amber-50",
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIMentorPage() {
  // Set orb to "listening" state while on the AI Mentor page
  useOrbPageState("listening");

  const {
    messages,
    addMessage,
    isTyping,
    setIsTyping,
    setOrbState,
  } = useOrb();

  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;

    addMessage("user", trimmed);
    setInputValue("");
    setOrbState("thinking");

    // Call AI chat API
    setIsTyping(true);

    fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          ...messages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
          { role: "user", content: trimmed },
        ],
        stream: false,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("API error");

        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const json = await res.json();
          const aiContent =
            json.content ||
            json.data?.content ||
            json.choices?.[0]?.message?.content ||
            "Entschuldigung, ich konnte deine Anfrage nicht verarbeiten. Versuche es bitte erneut.";
          addMessage("ai", aiContent);
        } else {
          // Handle streaming text response
          const text = await res.text();
          // Extract content from SSE stream
          const lines = text.split("\n");
          let content = "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                content +=
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.content ||
                  parsed.text ||
                  "";
              } catch {
                content += data;
              }
            }
          }
          addMessage(
            "ai",
            content ||
            "Entschuldigung, ich konnte deine Anfrage nicht verarbeiten."
          );
        }
      })
      .catch(() => {
        addMessage(
          "ai",
          "Entschuldigung, es gab einen Fehler bei der Verbindung zum KI-Service. Bitte versuche es erneut. 🔄"
        );
      })
      .finally(() => {
        setIsTyping(false);
        setOrbState("idle");
      });
  }, [inputValue, isTyping, addMessage, setIsTyping, setOrbState, messages]);

  // Handle quick action click
  const handleQuickAction = useCallback(
    (prompt: string) => {
      setInputValue("");
      addMessage("user", prompt);
      setOrbState("thinking");
      setIsTyping(true);

      fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("API error");
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await res.json();
            const aiContent =
              json.content ||
              json.data?.content ||
              json.choices?.[0]?.message?.content ||
              "Ich helfe dir gerne dabei! Was genau moechtest du wissen?";
            addMessage("ai", aiContent);
          } else {
            const text = await res.text();
            const lines = text.split("\n");
            let content = "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") break;
                try {
                  const parsed = JSON.parse(data);
                  content +=
                    parsed.choices?.[0]?.delta?.content ||
                    parsed.content ||
                    parsed.text ||
                    "";
                } catch {
                  content += data;
                }
              }
            }
            addMessage(
              "ai",
              content || "Ich helfe dir gerne dabei! Was genau moechtest du wissen?"
            );
          }
        })
        .catch(() => {
          addMessage(
            "ai",
            "Entschuldigung, es gab einen Fehler. Bitte versuche es erneut. 🔄"
          );
        })
        .finally(() => {
          setIsTyping(false);
          setOrbState("idle");
        });
    },
    [addMessage, setIsTyping, setOrbState]
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

  const hasMessages = messages.length > 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-surface-900 tracking-tight">
          KI-Mentor
        </h1>
        <p className="mt-2 text-body text-surface-500 max-w-2xl">
          Dein persoenlicher KI-Assistent fuer den Arbeitsalltag. Ich unterstuetze dich bei Fragen, Texten und Konzepten.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MENTOR_STATS.map((stat) => (
          <Card
            key={stat.label}
            className="flex items-center gap-3 p-4"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                stat.bg
              )}
            >
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
              <p className="text-title-sm font-bold text-surface-900">
                {stat.value}
              </p>
              <p className="text-caption text-surface-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Chat Area */}
      <Card className="flex flex-col overflow-hidden shadow-xl shadow-surface-200/40 border-surface-200/60 transition-all duration-300 hover:shadow-2xl hover:shadow-surface-200/50" noPadding>
        {/* Chat Header */}
        <div className="relative shrink-0">
          <div className="h-1 w-full bg-gradient-to-r from-brand-primary-500 via-brand-primary-400 to-brand-accent-500" />
          <div className="flex items-center gap-3 border-b border-surface-100 bg-white/80 px-5 py-3.5 backdrop-blur-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-surface-900">
                AI Mentor Chat
              </span>
              <span className="text-[11px] text-surface-400">
                {isTyping
                  ? "KI denkt nach..."
                  : "Powered by Multi-Provider AI"}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-primary-500" />
              <span className="text-[11px] text-surface-400">Online</span>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FAFBFC] to-white relative" style={{ minHeight: "500px", maxHeight: "65vh" }}>
          {/* Welcome Screen (when no messages) */}
          {!hasMessages && (
            <div className="relative flex flex-col items-center justify-center px-6 py-20 min-h-full overflow-hidden">
              {/* Decorative Ambient Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary-400/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-[20%] -translate-y-1/2 w-[400px] h-[400px] bg-brand-accent-400/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 shadow-xl shadow-brand-primary-500/25 ring-4 ring-white/50 backdrop-blur-sm transition-transform duration-500 hover:scale-110 hover:rotate-3">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="relative font-display text-3xl font-bold text-surface-900 tracking-tight text-center">
                Guten Morgen! Ich bin dein KI-Mentor 👋
              </h2>
              <p className="relative mt-3 w-full max-w-lg text-center text-body text-surface-500">
                Lass uns gemeinsam deinen Arbeitsalltag smarter gestalten. Wähle eine der Aktionen aus oder stelle mir direkt eine Frage.
              </p>

              {/* Quick Actions */}
              <div className="relative mt-12 grid w-full max-w-2xl grid-cols-1 md:grid-cols-2 gap-4">
                {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleQuickAction(prompt)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-surface-200 bg-white p-4",
                      "text-left text-body-sm font-medium text-surface-700",
                      "transition-all duration-200",
                      "hover:border-brand-primary-300 hover:bg-brand-primary-50 hover:text-brand-primary-700 hover:shadow-sm",
                      "focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-1"
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary-50">
                      <Icon className="h-4.5 w-4.5 text-brand-primary-600" />
                    </div>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {hasMessages && (
            <div className="py-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {/* Typing indicator */}
              {isTyping && <TypingIndicator />}

              {/* Scroll anchor */}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Quick Action Chips (shown when there are messages) */}
        {hasMessages && (
          <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-surface-100 bg-surface-50/50 px-5 py-2.5 no-scrollbar">
            {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleQuickAction(prompt)}
                disabled={isTyping}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full",
                  "border border-surface-200 bg-white px-3 py-1.5",
                  "text-xs font-medium text-surface-600",
                  "transition-all duration-150",
                  "hover:border-brand-primary-300 hover:bg-brand-primary-50 hover:text-brand-primary-700",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-1"
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="shrink-0 bg-white/80 backdrop-blur-2xl border-t border-surface-200/60 px-6 py-5">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stelle eine Frage an deinen KI-Mentor..."
              rows={1}
              className={cn(
                "flex-1 resize-none rounded-2xl border border-surface-200 bg-surface-50/50 px-5 py-3.5",
                "text-body text-surface-800 placeholder:text-surface-400",
                "transition-all duration-200 shadow-inner shadow-surface-100/50",
                "focus:border-brand-primary-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-primary-500/10"
              )}
              aria-label="Chat-Nachricht eingeben"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={cn(
                "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl",
                "bg-gradient-to-br from-brand-primary-500 to-brand-primary-600 text-white shadow-lg shadow-brand-primary-500/30",
                "transition-all duration-200",
                "hover:scale-105 hover:shadow-xl hover:shadow-brand-primary-500/40",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-lg",
                "focus-visible:ring-4 focus-visible:ring-brand-primary-500/30 focus-visible:ring-offset-1 focus:outline-none"
              )}
              aria-label="Nachricht senden"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
          <p className="mt-2 text-[10px] text-surface-400">
            KI-Antworten koennen ungenau sein. Ueberpruefe wichtige Informationen.
          </p>
          <p className="mt-1 text-[10px] text-surface-400">
            Deine Eingaben werden an externe AI-Provider (Anthropic, OpenAI, Google, Groq, Mistral) gesendet. Verarbeitung erfolgt nach DPA mit den jeweiligen Anbietern.
          </p>
        </div>
      </Card>
    </div>
  );
}
