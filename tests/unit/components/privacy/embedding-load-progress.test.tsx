// =============================================================================
// Unit Tests: EmbeddingLoadProgress
// Covers all 4 render-branches (idle, loading, ready, error) + ARIA.
// Pattern P4.1 | ADR-010
// =============================================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmbeddingLoadProgress } from '@/components/privacy/embedding-load-progress';

describe('EmbeddingLoadProgress', () => {
  it('state="idle" rendert nichts', () => {
    const { container } = render(<EmbeddingLoadProgress state="idle" progress={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('state="loading" rendert einen progressbar mit korrekten ARIA-Attributen', () => {
    render(<EmbeddingLoadProgress state="loading" progress={47} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuenow', '47');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('state="ready" rendert einen Erfolgs-Indikator', () => {
    render(<EmbeddingLoadProgress state="ready" progress={100} />);
    expect(screen.getByText(/Modell geladen/i)).toBeInTheDocument();
  });

  it('state="error" rendert eine Fehlermeldung', () => {
    render(<EmbeddingLoadProgress state="error" progress={0} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/konnte nicht geladen werden/i)).toBeInTheDocument();
  });

  it('loading-Container hat aria-live="polite"', () => {
    const { container } = render(<EmbeddingLoadProgress state="loading" progress={10} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('progress-Wert wird korrekt im sichtbaren Text reflektiert', () => {
    render(<EmbeddingLoadProgress state="loading" progress={47} />);
    expect(screen.getByText(/47%/)).toBeInTheDocument();
  });
});
