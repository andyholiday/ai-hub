// =============================================================================
// Unit Tests: consent-banner.tsx — M03 ARIA + focus-trap
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentBanner } from "@/components/consent-banner";

function renderBanner() {
  return render(<ConsentBanner />);
}

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

describe("ConsentBanner — visibility", () => {
  it("renders when no consent is stored", () => {
    renderBanner();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when consent is already stored", () => {
    localStorage.setItem("analytics-consent", "granted");
    renderBanner();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes (M03)
// ---------------------------------------------------------------------------

describe("ConsentBanner — ARIA attributes (M03)", () => {
  it("has role='dialog'", () => {
    renderBanner();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has aria-modal='true'", () => {
    renderBanner();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to a heading element", () => {
    renderBanner();
    const dialog = screen.getByRole("dialog");
    const labelledById = dialog.getAttribute("aria-labelledby");
    expect(labelledById).toBeTruthy();
    expect(document.getElementById(labelledById!)).toBeInTheDocument();
  });

  it("has aria-describedby pointing to the description element", () => {
    renderBanner();
    const dialog = screen.getByRole("dialog");
    const describedById = dialog.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById!)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Focus management (M03)
// ---------------------------------------------------------------------------

describe("ConsentBanner — focus management (M03)", () => {
  it("moves focus to the first button on mount", () => {
    renderBanner();
    const rejectButton = screen.getByRole("button", { name: /ablehnen/i });
    expect(document.activeElement).toBe(rejectButton);
  });

  it("cycles focus forward: last button → first button on Tab", async () => {
    const user = userEvent.setup();
    renderBanner();

    const acceptButton = screen.getByRole("button", { name: /akzeptieren/i });
    acceptButton.focus();
    await user.tab();

    const rejectButton = screen.getByRole("button", { name: /ablehnen/i });
    expect(document.activeElement).toBe(rejectButton);
  });

  it("cycles focus backward: first button → last button on Shift+Tab", async () => {
    const user = userEvent.setup();
    renderBanner();

    const rejectButton = screen.getByRole("button", { name: /ablehnen/i });
    rejectButton.focus();
    await user.tab({ shift: true });

    const acceptButton = screen.getByRole("button", { name: /akzeptieren/i });
    expect(document.activeElement).toBe(acceptButton);
  });
});

// ---------------------------------------------------------------------------
// Button actions
// ---------------------------------------------------------------------------

describe("ConsentBanner — button actions", () => {
  it("stores 'granted' and hides banner on Akzeptieren", async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole("button", { name: /akzeptieren/i }));

    expect(localStorage.getItem("analytics-consent")).toBe("granted");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stores 'denied' and hides banner on Ablehnen", async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole("button", { name: /ablehnen/i }));

    expect(localStorage.getItem("analytics-consent")).toBe("denied");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does NOT close on Escape key (consent is mandatory)", async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
