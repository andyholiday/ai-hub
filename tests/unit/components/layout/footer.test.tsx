// =============================================================================
// Unit Tests: Footer
// =============================================================================

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/footer";

describe("Footer", () => {
  it("renders the copyright notice", () => {
    render(<Footer />);
    expect(screen.getByText(/AI Hub/)).toBeInTheDocument();
  });

  it("renders default links", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Datenschutz" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Impressum" })).toBeInTheDocument();
  });

  it("renders custom links", () => {
    render(<Footer links={[{ label: "Kontakt", href: "/kontakt" }]} />);
    expect(screen.getByRole("link", { name: "Kontakt" })).toHaveAttribute("href", "/kontakt");
  });

  it("renders no nav when links array is empty", () => {
    render(<Footer links={[]} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("has footer landmark role", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Footer className="mt-8" />);
    expect(container.firstChild).toHaveClass("mt-8");
  });
});
