// =============================================================================
// Tests: Orb Status Indicator (ADR-015)
// Verifies that CosmosCompanion applies correct CSS classes and badge text
// for each OrbState.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — isolate CosmosCompanion from Next.js / Framer Motion runtime
// ---------------------------------------------------------------------------

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("framer-motion", () => {
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { drag?: unknown; dragMomentum?: unknown; dragElastic?: unknown; onDragEnd?: unknown; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }
  >(({ children, ...rest }, ref) => (
    <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  ));
  MotionDiv.displayName = "MotionDiv";

  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("@/lib/features/feature-registry", () => ({
  getFeature: () => ({ defaultEnabled: false }),
}));

vi.mock("../../../../../src/components/features/ai-orb/use-orb-idle-state", () => ({
  useOrbIdleState: () => ({ state: "active" }),
}));

vi.mock("../../../../../src/components/features/ai-orb/orb-animation-layer", () => ({
  OrbAnimationLayer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../../../../../src/components/features/ai-orb/celebration-fireworks", () => ({
  CelebrationFireworks: () => null,
}));

// ---------------------------------------------------------------------------
// OrbProvider stub — lets us inject orbState per test
// ---------------------------------------------------------------------------

import { type OrbState } from "@/components/features/ai-orb/orb-provider";

const mockOrbContext = {
  isExpanded: false,
  toggle: vi.fn(),
  tooltipText: "Ich bin fuer dich da!",
  hasNotification: false,
  orbState: "idle" as OrbState,
  setOrbState: vi.fn(),
  pageContext: "Dashboard",
  setPageContext: vi.fn(),
  messages: [],
  addMessage: vi.fn(),
  isTyping: false,
  setIsTyping: vi.fn(),
  setTooltipText: vi.fn(),
  setHasNotification: vi.fn(),
  expand: vi.fn(),
  minimize: vi.fn(),
  bubblePayload: null,
  setBubblePayload: vi.fn(),
};

vi.mock("@/components/features/ai-orb/orb-provider", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/components/features/ai-orb/orb-provider")>();
  return {
    ...original,
    useOrb: () => mockOrbContext,
  };
});

// ---------------------------------------------------------------------------
// System under test — imported after mocks are set up
// ---------------------------------------------------------------------------

import { CosmosCompanion } from "@/components/features/ai-orb/cosmos-companion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderOrb(orbState: OrbState) {
  mockOrbContext.orbState = orbState;
  return render(<CosmosCompanion />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CosmosCompanion — ADR-015 Orb Status Indicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrbContext.orbState = "idle";
  });

  // -------------------------------------------------------------------------
  // Schicht 1: Puls-Klasse
  // -------------------------------------------------------------------------

  it("idle: cosmos-core has no pulse class", () => {
    const { container } = renderOrb("idle");
    const core = container.querySelector(".cosmos-core");
    expect(core).toBeTruthy();
    expect(core?.className).not.toContain("cosmos-core--");
  });

  it("thinking: cosmos-core gets cosmos-core--thinking class", () => {
    const { container } = renderOrb("thinking");
    const core = container.querySelector(".cosmos-core");
    expect(core?.className).toContain("cosmos-core--thinking");
  });

  it("listening: cosmos-core gets cosmos-core--listening class", () => {
    const { container } = renderOrb("listening");
    const core = container.querySelector(".cosmos-core");
    expect(core?.className).toContain("cosmos-core--listening");
  });

  it("energized: cosmos-core gets cosmos-core--energized class", () => {
    const { container } = renderOrb("energized");
    const core = container.querySelector(".cosmos-core");
    expect(core?.className).toContain("cosmos-core--energized");
  });

  it("notification: cosmos-core gets cosmos-core--notification class", () => {
    const { container } = renderOrb("notification");
    const core = container.querySelector(".cosmos-core");
    expect(core?.className).toContain("cosmos-core--notification");
  });

  it("celebration: cosmos-core gets cosmos-core--celebration class", () => {
    const { container } = renderOrb("celebration");
    const core = container.querySelector(".cosmos-core");
    expect(core?.className).toContain("cosmos-core--celebration");
  });

  it("greeting: cosmos-core gets cosmos-core--greeting class", () => {
    const { container } = renderOrb("greeting");
    const core = container.querySelector(".cosmos-core");
    expect(core?.className).toContain("cosmos-core--greeting");
  });

  // -------------------------------------------------------------------------
  // Schicht 2: Ring-Modifier
  // -------------------------------------------------------------------------

  it("idle: cosmos-ring gets cosmos-ring--idle class", () => {
    const { container } = renderOrb("idle");
    const ring = container.querySelector(".cosmos-ring");
    expect(ring?.className).toContain("cosmos-ring--idle");
  });

  it("thinking: cosmos-ring gets cosmos-ring--thinking class", () => {
    const { container } = renderOrb("thinking");
    const ring = container.querySelector(".cosmos-ring");
    expect(ring?.className).toContain("cosmos-ring--thinking");
  });

  it("celebration: cosmos-ring gets cosmos-ring--celebration class", () => {
    const { container } = renderOrb("celebration");
    const ring = container.querySelector(".cosmos-ring");
    expect(ring?.className).toContain("cosmos-ring--celebration");
  });

  // -------------------------------------------------------------------------
  // Schicht 3: Badge-Text (erscheint nach State-Wechsel)
  // -------------------------------------------------------------------------

  it("idle: no status badge rendered", () => {
    renderOrb("idle");
    // Badge should not be present for idle
    const badge = document.querySelector(".cosmos-status-badge-enter");
    expect(badge).toBeNull();
  });

  it("thinking: badge 'Denkt…' appears after state change", () => {
    // Start idle, then switch to thinking to trigger the useEffect
    const { rerender } = render(<CosmosCompanion />);
    mockOrbContext.orbState = "thinking";
    act(() => {
      rerender(<CosmosCompanion />);
    });
    expect(screen.getByText("Denkt…")).toBeTruthy();
  });

  it("listening: badge 'Hört zu…' appears after state change", () => {
    const { rerender } = render(<CosmosCompanion />);
    mockOrbContext.orbState = "listening";
    act(() => {
      rerender(<CosmosCompanion />);
    });
    expect(screen.getByText("Hört zu…")).toBeTruthy();
  });

  it("celebration: badge 'Gratulation!' appears after state change", () => {
    const { rerender } = render(<CosmosCompanion />);
    mockOrbContext.orbState = "celebration";
    act(() => {
      rerender(<CosmosCompanion />);
    });
    expect(screen.getByText("Gratulation!")).toBeTruthy();
  });

  it("greeting: badge 'Willkommen!' appears after state change", () => {
    const { rerender } = render(<CosmosCompanion />);
    mockOrbContext.orbState = "greeting";
    act(() => {
      rerender(<CosmosCompanion />);
    });
    expect(screen.getByText("Willkommen!")).toBeTruthy();
  });

  it("notification: no badge text (notification has no badge per ADR-015)", () => {
    const { rerender } = render(<CosmosCompanion />);
    mockOrbContext.orbState = "notification";
    act(() => {
      rerender(<CosmosCompanion />);
    });
    // No badge for notification state
    const badge = document.querySelector(".cosmos-status-badge-enter");
    expect(badge).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Accessibility: badge is aria-hidden, aria-live block exists
  // -------------------------------------------------------------------------

  it("badge is aria-hidden so screen readers use aria-live instead", () => {
    const { rerender } = render(<CosmosCompanion />);
    mockOrbContext.orbState = "thinking";
    act(() => {
      rerender(<CosmosCompanion />);
    });
    const badge = document.querySelector(".cosmos-status-badge-enter");
    expect(badge?.getAttribute("aria-hidden")).toBe("true");
  });

  it("aria-live polite region is rendered", () => {
    const { container } = renderOrb("idle");
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeTruthy();
  });
});
