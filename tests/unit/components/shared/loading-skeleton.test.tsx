// =============================================================================
// Unit Tests: LoadingSkeleton / Skeleton
// =============================================================================

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, LoadingSkeleton } from "@/components/shared/loading-skeleton";

describe("Skeleton", () => {
  it("renders a hidden placeholder element", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("applies rounded-full class when rounded=true", () => {
    const { container } = render(<Skeleton rounded />);
    expect(container.firstChild).toHaveClass("rounded-full");
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="w-24 h-4" />);
    expect(container.firstChild).toHaveClass("w-24", "h-4");
  });
});

describe("LoadingSkeleton", () => {
  it("renders aria-busy container", () => {
    render(<LoadingSkeleton />);
    expect(screen.getByLabelText("Wird geladen...")).toHaveAttribute("aria-busy", "true");
  });

  it("renders the default 3 skeleton lines", () => {
    const { container } = render(<LoadingSkeleton />);
    // Each Skeleton has aria-hidden; count children of the flex-1 div
    const lines = container.querySelectorAll("[aria-hidden='true']");
    expect(lines.length).toBe(3);
  });

  it("renders the requested number of lines", () => {
    const { container } = render(<LoadingSkeleton lines={5} />);
    const lines = container.querySelectorAll("[aria-hidden='true']");
    expect(lines.length).toBe(5);
  });

  it("renders avatar skeleton when showAvatar=true", () => {
    const { container } = render(<LoadingSkeleton showAvatar />);
    // With avatar: 1 avatar + 3 lines = 4 aria-hidden elements
    const lines = container.querySelectorAll("[aria-hidden='true']");
    expect(lines.length).toBe(4);
  });
});
