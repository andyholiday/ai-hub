// =============================================================================
// Unit Tests: SearchBar
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/shared/search-bar";

describe("SearchBar", () => {
  it("renders with the provided value", () => {
    render(<SearchBar value="hello" onChange={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toHaveValue("hello");
  });

  it("calls onChange when the user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("shows clear button when value is non-empty", () => {
    render(<SearchBar value="test" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Suche leeren")).toBeInTheDocument();
  });

  it("does not show clear button when value is empty", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText("Suche leeren")).not.toBeInTheDocument();
  });

  it("calls onChange with empty string when clear is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);
    await user.click(screen.getByLabelText("Suche leeren"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("calls onSubmit when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchBar value="query" onChange={vi.fn()} onSubmit={onSubmit} />);
    await user.type(screen.getByRole("searchbox"), "{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("query");
  });

  it("calls onChange with empty string on Escape", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="query" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "{Escape}");
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("applies custom placeholder", () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Filtern…" />);
    expect(screen.getByPlaceholderText("Filtern…")).toBeInTheDocument();
  });

  it("is disabled when disabled=true", () => {
    render(<SearchBar value="" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });
});
