// =============================================================================
// Unit Tests: Pagination
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "@/components/shared/pagination";

describe("Pagination", () => {
  it("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders page buttons for small page count", () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Seite 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Seite 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Seite 3")).toBeInTheDocument();
  });

  it("marks current page as aria-current=page", () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Seite 2")).toHaveAttribute("aria-current", "page");
  });

  it("disables previous button on first page", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Vorherige Seite")).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Nächste Seite")).toBeDisabled();
  });

  it("calls onPageChange with the correct page when a page button is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
    await user.click(screen.getByLabelText("Seite 3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange with page+1 when next is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByLabelText("Nächste Seite"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange with page-1 when previous is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByLabelText("Vorherige Seite"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("shows ellipsis for large page ranges", () => {
    render(<Pagination page={5} totalPages={20} onPageChange={vi.fn()} />);
    const ellipsis = screen.getAllByText("…");
    expect(ellipsis.length).toBeGreaterThanOrEqual(1);
  });
});
