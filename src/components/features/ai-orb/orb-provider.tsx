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
  useEffect,
  useMemo,
  useRef,
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

export type OrbState =
  | "idle"
  | "thinking"
  | "notification"
  | "celebration"
  | "greeting"
  | "listening"
  | "energized";

/** States that auto-reset to idle after a timeout */
const TRANSIENT_STATES: ReadonlySet<OrbState> = new Set([
  "celebration",
  "greeting",
]);

/** Duration in ms before transient states reset to idle */
const TRANSIENT_RESET_MS = 3_000;

/** Human-readable tooltip labels per orb state (German) */
export const ORB_STATE_LABELS: Record<OrbState, string> = {
  idle: "Ich bin fuer dich da!",
  thinking: "Die KI denkt nach...",
  notification: "Ich habe etwas fuer dich!",
  celebration: "Gratulation!",
  greeting: "Willkommen zurueck!",
  listening: "Ich hoere zu...",
  energized: "Du bist auf Feuer!",
};

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
  const [orbState, setOrbStateInternal] = useState<OrbState>("idle");
  const [pageContext, setPageContext] = useState(initialContext);
  // Initialize with empty array so the premium welcome screen is shown
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [tooltipText, setTooltipText] = useState(
    "Ich habe einen Tipp fuer dich!"
  );
  const [hasNotification, setHasNotification] = useState(false);

  // Auto-reset timer ref for transient states (celebration, greeting)
  const transientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOrbState = useCallback((state: OrbState) => {
    // Clear any existing transient timer
    if (transientTimerRef.current) {
      clearTimeout(transientTimerRef.current);
      transientTimerRef.current = null;
    }

    setOrbStateInternal(state);

    // Update tooltip to match the new state
    setTooltipText(ORB_STATE_LABELS[state]);

    // If the new state is transient, schedule auto-reset to idle
    if (TRANSIENT_STATES.has(state)) {
      transientTimerRef.current = setTimeout(() => {
        setOrbStateInternal("idle");
        setTooltipText(ORB_STATE_LABELS.idle);
        transientTimerRef.current = null;
      }, TRANSIENT_RESET_MS);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (transientTimerRef.current) {
        clearTimeout(transientTimerRef.current);
      }
    };
  }, []);

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
      setOrbState,
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
