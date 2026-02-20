// =============================================================================
// AI Orb Provider
// React Context for managing the AI Orb state across the application.
// Handles minimized/expanded state, chat messages, and page context.
// =============================================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type MessageRole = "user" | "ai";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export type OrbState = "idle" | "thinking" | "notification" | "celebration";

interface OrbContextValue {
  /** Whether the chat panel is expanded */
  isExpanded: boolean;
  /** Toggle between orb (minimized) and chat panel (expanded) */
  toggle: () => void;
  /** Explicitly expand the chat panel */
  expand: () => void;
  /** Explicitly minimize to the orb */
  minimize: () => void;
  /** Current orb animation state */
  orbState: OrbState;
  /** Update the orb animation state */
  setOrbState: (state: OrbState) => void;
  /** Current page context string shown in the context banner */
  pageContext: string;
  /** Update the page context */
  setPageContext: (context: string) => void;
  /** Chat message history */
  messages: ChatMessage[];
  /** Add a new message to the chat */
  addMessage: (role: MessageRole, content: string) => void;
  /** Whether the AI is currently "typing" */
  isTyping: boolean;
  /** Set the typing indicator */
  setIsTyping: (typing: boolean) => void;
  /** Tooltip text shown on hover */
  tooltipText: string;
  /** Set custom tooltip text */
  setTooltipText: (text: string) => void;
  /** Whether to show the notification dot */
  hasNotification: boolean;
  /** Set notification dot visibility */
  setHasNotification: (has: boolean) => void;
}

// -----------------------------------------------------------------------------
// Default demo messages
// -----------------------------------------------------------------------------

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    role: "ai",
    content: "Hi Sarah! Was moechtest du heute lernen?",
    timestamp: new Date(Date.now() - 120_000),
  },
  {
    id: "msg-2",
    role: "user",
    content: "Zeig mir den besten Prompt Engineering Kurs",
    timestamp: new Date(Date.now() - 60_000),
  },
  {
    id: "msg-3",
    role: "ai",
    content:
      "Ich empfehle dir den Kurs 'Advanced Prompt Engineering'. Du bist zu 72% durch dein aktuelles Modul.",
    timestamp: new Date(Date.now() - 30_000),
  },
];

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const OrbContext = createContext<OrbContextValue | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface OrbProviderProps {
  children: ReactNode;
  /** Optional initial page context */
  initialContext?: string;
}

export function OrbProvider({
  children,
  initialContext = "Dashboard",
}: OrbProviderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [pageContext, setPageContext] = useState(initialContext);
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [tooltipText, setTooltipText] = useState(
    "Ich habe einen Tipp fuer dich!"
  );
  const [hasNotification, setHasNotification] = useState(false);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
    setHasNotification(false);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
    setHasNotification(false);
  }, []);

  const minimize = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const addMessage = useCallback((role: MessageRole, content: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const value = useMemo<OrbContextValue>(
    () => ({
      isExpanded,
      toggle,
      expand,
      minimize,
      orbState,
      setOrbState,
      pageContext,
      setPageContext,
      messages,
      addMessage,
      isTyping,
      setIsTyping,
      tooltipText,
      setTooltipText,
      hasNotification,
      setHasNotification,
    }),
    [
      isExpanded,
      toggle,
      expand,
      minimize,
      orbState,
      pageContext,
      messages,
      addMessage,
      isTyping,
      tooltipText,
      hasNotification,
    ]
  );

  return <OrbContext.Provider value={value}>{children}</OrbContext.Provider>;
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useOrb(): OrbContextValue {
  const context = useContext(OrbContext);
  if (!context) {
    throw new Error("useOrb must be used within an <OrbProvider>");
  }
  return context;
}
