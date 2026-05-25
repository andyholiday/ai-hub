// =============================================================================
// Unit Tests: Modal
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/shared/modal";

describe("Modal", () => {
  it("renders nothing when open=false", () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders children when open=true", () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders the title when provided", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Mein Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Mein Modal")).toBeInTheDocument();
  });

  it("has role=dialog and aria-modal=true", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    await user.click(screen.getByLabelText("Schließen"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    // The backdrop is the aria-hidden absolute div
    const backdrop = container.querySelector("[aria-hidden='true']") as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders footer slot", () => {
    render(
      <Modal open={true} onClose={vi.fn()} footer={<button>Speichern</button>}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole("button", { name: "Speichern" })).toBeInTheDocument();
  });
});
