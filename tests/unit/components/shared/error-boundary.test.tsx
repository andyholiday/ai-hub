// =============================================================================
// Unit Tests: ErrorBoundary
// =============================================================================

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "@/components/shared/error-boundary";

// Suppress console.error noise from intentional throws
const suppressError = vi.spyOn(console, "error").mockImplementation(() => {});
afterEach(() => suppressError.mockClear());

// A component that throws when `shouldThrow` is true
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test-Fehler");
  return <p>Alles gut</p>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Alles gut")).toBeInTheDocument();
  });

  it("renders default fallback on error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Etwas ist schiefgelaufen")).toBeInTheDocument();
  });

  it("shows the error message in default fallback", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Test-Fehler")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={(err) => <div>Custom: {err.message}</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom: Test-Fehler")).toBeInTheDocument();
  });

  it("shows retry button in default fallback", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /erneut versuchen/i })).toBeInTheDocument();
  });
});
