// =============================================================================
// Unit Tests: EmptyState
// =============================================================================

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/shared/empty-state";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="Keine Ergebnisse" />);
    expect(screen.getByText("Keine Ergebnisse")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Leer" description="Nichts zu sehen hier." />);
    expect(screen.getByText("Nichts zu sehen hier.")).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    render(<EmptyState title="Leer" />);
    expect(screen.queryByText(/Nichts/i)).not.toBeInTheDocument();
  });

  it("renders the action slot", () => {
    render(<EmptyState title="Leer" action={<button>Hinzufügen</button>} />);
    expect(screen.getByRole("button", { name: "Hinzufügen" })).toBeInTheDocument();
  });

  it("renders the icon slot", () => {
    render(<EmptyState title="Leer" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("does not render icon wrapper when icon is omitted", () => {
    const { container } = render(<EmptyState title="Leer" />);
    // The icon wrapper div should not be present
    expect(container.querySelector("[aria-hidden]")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<EmptyState title="Leer" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
