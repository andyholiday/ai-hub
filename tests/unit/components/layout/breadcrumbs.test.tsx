// =============================================================================
// Unit Tests: Breadcrumbs
// =============================================================================

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders nothing for an empty items array", () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nav with aria-label=Breadcrumb", () => {
    render(<Breadcrumbs items={[{ label: "Home", href: "/" }]} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders all item labels", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Kurse", href: "/learn-hub" },
          { label: "Lektion 1" },
        ]}
      />
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Kurse")).toBeInTheDocument();
    expect(screen.getByText("Lektion 1")).toBeInTheDocument();
  });

  it("renders a link for items with href (non-last)", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Aktuell" },
        ]}
      />
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("marks the last item as aria-current=page", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Seite" },
        ]}
      />
    );
    expect(screen.getByText("Seite")).toHaveAttribute("aria-current", "page");
  });

  it("does not render the last item as a link", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Letzte", href: "/letzte" },
        ]}
      />
    );
    // Last item should NOT be a link even if href is provided
    expect(screen.queryByRole("link", { name: "Letzte" })).not.toBeInTheDocument();
  });
});
