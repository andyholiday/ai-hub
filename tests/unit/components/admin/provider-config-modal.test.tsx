// =============================================================================
// Tests: ProviderConfigModal (m-08 — Provider-Modal E2E-Tests, unit-level via RTL)
//
// Note on test strategy: Playwright e2e tests require a running dev-server with
// authenticated admin session (TEST_ADMIN_EMAIL/PASSWORD + seeded DB).
// Since that environment is not guaranteed in CI without a full DB seed,
// these component-level RTL tests cover the modal interaction contracts instead.
// The existing admin.spec.ts e2e tests cover the browser-level smoke cases.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProviderConfigModal } from "@/components/features/admin/provider-config-modal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INITIAL_VALUES = {
  model: "gpt-4o",
  temperature: "0.7",
  max_tokens: "4096",
  top_p: "0.95",
  endpoint: "https://api.openai.com/v1",
  budget: "50",
};

function renderModal(
  overrides?: Partial<React.ComponentProps<typeof ProviderConfigModal>>,
) {
  const onSave = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();

  const props = {
    isOpen: true,
    providerName: "OpenAI",
    initialValues: INITIAL_VALUES,
    onSave,
    onClose,
    ...overrides,
  };

  const result = render(<ProviderConfigModal {...props} />);
  return { ...result, onSave, onClose };
}

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

describe("ProviderConfigModal — visibility", () => {
  it("renders dialog when isOpen is true", () => {
    renderModal({ isOpen: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Fields present
// ---------------------------------------------------------------------------

describe("ProviderConfigModal — shows expected fields", () => {
  it("renders Modell field pre-filled with initialValues.model", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const modelInput = within(dialog).getByLabelText(/Modell/i);
    expect(modelInput).toHaveValue("gpt-4o");
  });

  it("renders Max Tokens field pre-filled", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText(/Max Tokens/i);
    expect(input).toHaveValue(4096);
  });

  it("renders Top-P field pre-filled", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText(/Top-P/i);
    expect(input).toHaveValue(0.95);
  });

  it("renders Endpoint field pre-filled", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText(/Endpoint/i);
    expect(input).toHaveValue("https://api.openai.com/v1");
  });

  it("renders Temperature field pre-filled", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText(/Temperature/i);
    expect(input).toHaveValue(0.7);
  });
});

// ---------------------------------------------------------------------------
// Cancel / Escape
// ---------------------------------------------------------------------------

describe("ProviderConfigModal — cancel / Escape", () => {
  it("calls onClose when Abbrechen button is clicked", async () => {
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

  it("calls onClose when X button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: /Modal schliessen/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Endpoint cleared → api_endpoint: null in PUT body
// ---------------------------------------------------------------------------

describe("ProviderConfigModal — endpoint cleared sends api_endpoint: null", () => {
  it("sends api_endpoint: null when endpoint field is emptied", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    const dialog = screen.getByRole("dialog");
    const endpointInput = within(dialog).getByLabelText(/Endpoint/i);

    // Clear the endpoint field
    await user.clear(endpointInput);

    await user.click(screen.getByRole("button", { name: /^Speichern$/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ api_endpoint: null }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// No changes → closes without calling onSave
// ---------------------------------------------------------------------------

describe("ProviderConfigModal — no changes submits without API call", () => {
  it("calls onClose without onSave when no values changed", async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: /^Speichern$/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("ProviderConfigModal — validation", () => {
  it("shows error when model field is cleared", async () => {
    const user = userEvent.setup();
    renderModal();

    const dialog = screen.getByRole("dialog");
    const modelInput = within(dialog).getByLabelText(/Modell/i);
    await user.clear(modelInput);

    await user.click(screen.getByRole("button", { name: /^Speichern$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows error when temperature is out of range", async () => {
    const user = userEvent.setup();
    renderModal();

    const dialog = screen.getByRole("dialog");
    const tempInput = within(dialog).getByLabelText(/Temperature/i);
    await user.clear(tempInput);
    await user.type(tempInput, "99");

    await user.click(screen.getByRole("button", { name: /^Speichern$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Save error handling
// ---------------------------------------------------------------------------

describe("ProviderConfigModal — save error", () => {
  it("shows error message and does not close when onSave returns false", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();

    render(
      <ProviderConfigModal
        isOpen
        providerName="OpenAI"
        initialValues={INITIAL_VALUES}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    // Change one field so updates are non-empty
    const dialog = screen.getByRole("dialog");
    const modelInput = within(dialog).getByLabelText(/Modell/i);
    await user.clear(modelInput);
    await user.type(modelInput, "gpt-4o-mini");

    await user.click(screen.getByRole("button", { name: /^Speichern$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
