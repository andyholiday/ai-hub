// =============================================================================
// Tests: ChatSplitView.callChatApi (F03 — Wave 4 Fix-Pass Iter-2)
//
// Covers:
//   Test 1: Happy-Path — User tippt + sendet, fetch mit korrektem Body, Antwort gerendert
//   Test 2: Error-Path — fetch antwortet 503 mit { error: { message } }, deutscher Error-Text
//   Test 3: Quick-Action-Chip Click triggert send
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must be set up before importing ChatSplitView
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => {
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      variants?: unknown;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
    }
  >(({ children, ...rest }, ref) => (
    <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  ));
  MotionDiv.displayName = "MotionDiv";

  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

vi.mock("@/components/features/ai-orb/chat-message", () => ({
  ChatMessage: ({
    message,
  }: {
    message: { id: string; role: string; content: string };
  }) => <div data-testid={`msg-${message.role}`}>{message.content}</div>,
  TypingIndicator: () => <div data-testid="typing-indicator" />,
}));

// ---------------------------------------------------------------------------
// OrbProvider mock — controllable per test
// ---------------------------------------------------------------------------

import type { OrbState } from "@/components/features/ai-orb/orb-provider";

const mockMessages: Array<{ id: string; role: "user" | "ai"; content: string; timestamp: Date }> = [];
const mockOrb = {
  minimize: vi.fn(),
  messages: mockMessages,
  addMessage: vi.fn((role: "user" | "ai", content: string) => {
    mockMessages.push({ id: `msg-${Date.now()}`, role, content, timestamp: new Date() });
  }),
  isTyping: false,
  setIsTyping: vi.fn(),
  pageContext: "Dashboard",
  orbState: "idle" as OrbState,
};

vi.mock("@/components/features/ai-orb/orb-provider", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/components/features/ai-orb/orb-provider")>();
  return {
    ...original,
    useOrb: () => mockOrb,
  };
});

// ---------------------------------------------------------------------------
// System under test — imported after mocks
// ---------------------------------------------------------------------------

import { ChatSplitView } from "@/components/features/ai-orb/chat-split-view";

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

function mockFetchOk(content: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ message: { content } }),
      }),
    ),
  );
}

function mockFetchError(status: number, errorMessage: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        status,
        json: () =>
          Promise.resolve({ error: { code: "PROVIDER_FAILED", message: errorMessage } }),
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatSplitView — callChatApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockMessages array in-place
    mockMessages.splice(0, mockMessages.length);
    // jsdom does not implement scrollIntoView — stub it globally
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Test 1: Happy-Path
  // -------------------------------------------------------------------------

  it("sendet Nachricht und ruft fetch mit korrektem Body auf", async () => {
    mockFetchOk("Das ist eine Testantwort");

    render(<ChatSplitView />);

    const input = screen.getByRole("textbox", { name: /Nachricht eingeben/i });
    const sendButton = screen.getByRole("button", { name: /Nachricht senden/i });

    fireEvent.change(input, { target: { value: "Hallo KI" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/ai/chat");

    const body = JSON.parse(init.body as string) as {
      messages: Array<{ role: string; content: string }>;
      stream: boolean;
    };
    expect(body.stream).toBe(false);
    expect(body.messages.at(-1)).toMatchObject({ role: "user", content: "Hallo KI" });
  });

  it("zeigt die AI-Antwort nach erfolgreichem fetch an", async () => {
    mockFetchOk("Ich bin die KI-Antwort");

    render(<ChatSplitView />);

    const input = screen.getByRole("textbox", { name: /Nachricht eingeben/i });
    fireEvent.change(input, { target: { value: "Frage" } });
    fireEvent.click(screen.getByRole("button", { name: /Nachricht senden/i }));

    await waitFor(() => {
      // addMessage muss zweimal aufgerufen worden sein: user + ai
      expect(mockOrb.addMessage).toHaveBeenCalledTimes(2);
    });

    expect(mockOrb.addMessage).toHaveBeenNthCalledWith(1, "user", "Frage");
    expect(mockOrb.addMessage).toHaveBeenNthCalledWith(2, "ai", "Ich bin die KI-Antwort");
  });

  // -------------------------------------------------------------------------
  // Test 2: Error-Path — 503 mit { error: { message } }
  // -------------------------------------------------------------------------

  it("zeigt deutschen Error-Text wenn fetch 503 zurueckliefert", async () => {
    mockFetchError(503, "Der KI-Dienst ist gerade ausgelastet. Bitte versuche es gleich erneut.");

    render(<ChatSplitView />);

    const input = screen.getByRole("textbox", { name: /Nachricht eingeben/i });
    fireEvent.change(input, { target: { value: "Fehlertest" } });
    fireEvent.click(screen.getByRole("button", { name: /Nachricht senden/i }));

    await waitFor(() => {
      expect(mockOrb.addMessage).toHaveBeenCalledTimes(2);
    });

    // Zweiter addMessage-Aufruf muss deutschen Error-Text mit "Entschuldigung" enthalten
    const [, errorContent] = mockOrb.addMessage.mock.calls[1] as [string, string];
    expect(errorContent).toMatch(/Entschuldigung/);
    expect(errorContent).toContain("Der KI-Dienst ist gerade ausgelastet");
  });

  // -------------------------------------------------------------------------
  // Test 3: Quick-Action-Chip Click triggert send
  // -------------------------------------------------------------------------

  it("Quick-Action-Chip Click sendet die Chip-Beschriftung als Nachricht", async () => {
    mockFetchOk("Chip-Antwort");

    render(<ChatSplitView />);

    // "🎯 Idee bewerten" ist der erste Chip (QUICK_ACTIONS[0])
    const chip = screen.getByRole("button", { name: /Idee bewerten/i });
    fireEvent.click(chip);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.messages.at(-1)?.content).toContain("Idee bewerten");
  });
});
