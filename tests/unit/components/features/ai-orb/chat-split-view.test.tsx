// =============================================================================
// Tests: ChatSplitView (ADR-005 consolidation — useOrbChat as state owner)
//
// Mocks:
//   - useOrbChat: simulates hook state and sendMessage
//   - useOrb: provides minimize, pageContext, orbState, setOrbState
//   - framer-motion: identity wrapper (no animations in tests)
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatSplitView } from "@/components/features/ai-orb/chat-split-view";

// jsdom does not implement scrollIntoView — stub it globally
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// ---------------------------------------------------------------------------
// Mock framer-motion to avoid animation issues in jsdom
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Mock useOrb
// ---------------------------------------------------------------------------

const mockMinimize = vi.fn();
const mockSetOrbState = vi.fn();

vi.mock("@/components/features/ai-orb/orb-provider", () => ({
  useOrb: () => ({
    minimize: mockMinimize,
    pageContext: "Dashboard",
    orbState: "idle",
    setOrbState: mockSetOrbState,
  }),
}));

// ---------------------------------------------------------------------------
// Mock useOrbChat
// ---------------------------------------------------------------------------

const mockSendMessage = vi.fn();

let mockOrbChatState = {
  messages: [] as Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: Date }>,
  sendMessage: mockSendMessage,
  isStreaming: false,
  error: null as string | null,
};

vi.mock("@/components/features/ai-orb/use-orb-chat", () => ({
  useOrbChat: () => mockOrbChatState,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderComponent() {
  return render(<ChatSplitView />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatSplitView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrbChatState = {
      messages: [],
      sendMessage: mockSendMessage,
      isStreaming: false,
      error: null,
    };
    mockSendMessage.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it("renders the dialog with the correct aria-label", () => {
    renderComponent();
    expect(screen.getByRole("dialog", { name: "AI Mentor Command Center" })).toBeInTheDocument();
  });

  it("shows the empty state when no messages", () => {
    renderComponent();
    expect(screen.getByText("Wie kann ich dir helfen?")).toBeInTheDocument();
  });

  it("shows the page context from useOrb", () => {
    renderComponent();
    expect(screen.getByText(/Kontext: Dashboard/)).toBeInTheDocument();
  });

  it("renders user and assistant messages with correct role mapping", () => {
    mockOrbChatState = {
      ...mockOrbChatState,
      messages: [
        { id: "1", role: "user", content: "Hallo", timestamp: new Date() },
        { id: "2", role: "assistant", content: "Wie kann ich helfen?", timestamp: new Date() },
      ],
    };
    renderComponent();
    expect(screen.getByText("Hallo")).toBeInTheDocument();
    expect(screen.getByText("Wie kann ich helfen?")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Send message
  // -------------------------------------------------------------------------

  it("calls sendMessage with trimmed input when send button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByLabelText("Nachricht eingeben");
    await user.type(input, "Test Nachricht");
    await user.click(screen.getByLabelText("Nachricht senden"));

    expect(mockSendMessage).toHaveBeenCalledWith("Test Nachricht");
  });

  it("calls sendMessage on Enter key press", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByLabelText("Nachricht eingeben");
    await user.type(input, "Enter Test{Enter}");

    expect(mockSendMessage).toHaveBeenCalledWith("Enter Test");
  });

  it("clears the input after sending", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByLabelText("Nachricht eingeben");
    await user.type(input, "Test");
    await user.click(screen.getByLabelText("Nachricht senden"));

    expect(input).toHaveValue("");
  });

  it("does not call sendMessage when input is empty or whitespace", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByLabelText("Nachricht eingeben");
    await user.type(input, "   {Enter}");

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Disabled state during streaming
  // -------------------------------------------------------------------------

  it("disables send button while streaming", () => {
    mockOrbChatState = { ...mockOrbChatState, isStreaming: true };
    renderComponent();
    expect(screen.getByLabelText("Nachricht senden")).toBeDisabled();
  });

  it("shows typing indicator while streaming", () => {
    mockOrbChatState = { ...mockOrbChatState, isStreaming: true };
    renderComponent();
    // TypingIndicator renders three dot spans inside the messages area
    const dots = document.querySelectorAll(".ai-orb-typing-dot");
    expect(dots.length).toBeGreaterThan(0);
  });

  it("hides typing indicator when not streaming", () => {
    mockOrbChatState = { ...mockOrbChatState, isStreaming: false };
    renderComponent();
    const dots = document.querySelectorAll(".ai-orb-typing-dot");
    expect(dots.length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Error display
  // -------------------------------------------------------------------------

  it("shows error message when error is set", () => {
    mockOrbChatState = { ...mockOrbChatState, error: "API-Fehler: 500" };
    renderComponent();
    expect(screen.getByRole("alert")).toHaveTextContent("API-Fehler: 500");
  });

  it("does not render error element when error is null", () => {
    renderComponent();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Quick actions
  // -------------------------------------------------------------------------

  it("calls sendMessage when a quick action chip is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText(/Idee bewerten/));
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Close behavior
  // -------------------------------------------------------------------------

  it("calls minimize when backdrop is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    // The backdrop overlay is aria-hidden, find it by its fixed class
    const backdrop = document.querySelector(".bg-black\\/20");
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);

    expect(mockMinimize).toHaveBeenCalled();
  });

  it("calls minimize when close button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText("Chat schließen"));
    expect(mockMinimize).toHaveBeenCalled();
  });

  it("calls minimize on Escape key", () => {
    renderComponent();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockMinimize).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // OrbState sync
  // -------------------------------------------------------------------------

  it("calls setOrbState('thinking') when isStreaming becomes true", () => {
    mockOrbChatState = { ...mockOrbChatState, isStreaming: true };
    renderComponent();
    expect(mockSetOrbState).toHaveBeenCalledWith("thinking");
  });

  it("calls setOrbState('idle') when isStreaming is false", () => {
    mockOrbChatState = { ...mockOrbChatState, isStreaming: false };
    renderComponent();
    expect(mockSetOrbState).toHaveBeenCalledWith("idle");
  });
});
