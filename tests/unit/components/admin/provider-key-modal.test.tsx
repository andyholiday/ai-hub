// =============================================================================
// Tests: ProviderKeyModal (F01 audit)
// Verifies open/close behaviour, password input type, mutation call with
// plaintext key, field clearing after save, and modal close on success.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProviderKeyModal } from "@/components/features/admin/provider-key-modal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderModal(overrides?: Partial<React.ComponentProps<typeof ProviderKeyModal>>) {
  const onSave = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();

  const props = {
    isOpen: true,
    providerName: "OpenAI",
    hasKey: false,
    onSave,
    onClose,
    ...overrides,
  };

  const result = render(<ProviderKeyModal {...props} />);
  return { ...result, onSave, onClose };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProviderKeyModal — visibility", () => {
  it("renders when isOpen is true", () => {
    renderModal({ isOpen: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("ProviderKeyModal — input type", () => {
  it("renders the API key input as type='password'", () => {
    renderModal();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test: element guaranteed by render
    const input = document.getElementById("provider-api-key-input")!;
    expect(input).toHaveAttribute("type", "password");
  });

  it("has autocomplete='off' on the key input", () => {
    renderModal();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test: element guaranteed by render
    const input = document.getElementById("provider-api-key-input")!;
    // React renders autoComplete as lowercase autocomplete in the DOM
    expect(input).toHaveAttribute("autocomplete", "off");
  });
});

describe("ProviderKeyModal — button labels", () => {
  it("shows 'API-Key setzen' in title when hasKey is false", () => {
    renderModal({ hasKey: false });
    expect(screen.getByText(/API-Key setzen/i)).toBeInTheDocument();
  });

  it("shows 'API-Key ändern' in title when hasKey is true", () => {
    renderModal({ hasKey: true });
    expect(screen.getByText(/API-Key ändern/i)).toBeInTheDocument();
  });
});

describe("ProviderKeyModal — cancel / Escape", () => {
  it("calls onClose when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: /Abbrechen/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the X button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: /schließen/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("ProviderKeyModal — submit", () => {
  it("calls onSave with the plaintext key on submit", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test: element guaranteed by render
    const input = document.getElementById("provider-api-key-input")!;
    await user.type(input, "sk-myplaintextkey");

    await user.click(screen.getByRole("button", { name: /Key speichern/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("sk-myplaintextkey");
    });
  });

  it("closes modal after successful save", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test: element guaranteed by render
    const input = document.getElementById("provider-api-key-input")!;
    await user.type(input, "sk-myplaintextkey");

    await user.click(screen.getByRole("button", { name: /Key speichern/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("does not call onSave when input is empty", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    // Submit button is disabled when field is empty — clicking should do nothing
    const submitBtn = screen.getByRole("button", { name: /Key speichern/i });
    expect(submitBtn).toBeDisabled();

    await user.click(submitBtn);

    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows error and does not close when onSave returns false", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();

    render(
      <ProviderKeyModal
        isOpen
        providerName="OpenAI"
        hasKey={false}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test: element guaranteed by render
    const input = document.getElementById("provider-api-key-input")!;
    await user.type(input, "sk-badkey");

    await user.click(screen.getByRole("button", { name: /Key speichern/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
