// =============================================================================
// DependencyWarningSheet — Unit Tests (Pattern P2.3)
// Tests: alle drei Render-Varianten + ARIA-Attribute + Focus-Trap-Behavior
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DependencyWarningSheet } from '@/components/features/settings/dependency-warning-sheet';
import type { ToggleAction } from '@/lib/features/dependency-types';
import type { FeatureId } from '@/lib/features/types';

// ---------------------------------------------------------------------------
// Mock feature-registry so label lookups work without DB
// ---------------------------------------------------------------------------

vi.mock('@/lib/features/feature-registry', () => ({
  getFeature: (id: string) => {
    const map: Record<string, { label: string }> = {
      'proactive-orb-bubble': { label: 'Proaktive Orb-Bubble' },
      'leaderboard': { label: 'Leaderboard' },
      'community-posts': { label: 'Community-Posts (Ideen)' },
    };
    if (!map[id]) throw new Error(`Unknown: ${id}`);
    return map[id];
  },
}));

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderCascade(onConfirm = vi.fn(), onCancel = vi.fn()) {
  const action: Exclude<ToggleAction, { kind: 'allow' }> = {
    kind: 'cascade-off',
    cascadeIds: ['proactive-orb-bubble'] as FeatureId[],
  };
  return render(
    <DependencyWarningSheet action={action} onConfirm={onConfirm} onCancel={onCancel} />,
  );
}

function renderWarn(onConfirm = vi.fn(), onCancel = vi.fn()) {
  const action: Exclude<ToggleAction, { kind: 'allow' }> = {
    kind: 'warn',
    warnIds: ['leaderboard'] as FeatureId[],
  };
  return render(
    <DependencyWarningSheet action={action} onConfirm={onConfirm} onCancel={onCancel} />,
  );
}

function renderBlocked(onConfirm = vi.fn(), onCancel = vi.fn()) {
  const action: Exclude<ToggleAction, { kind: 'allow' }> = {
    kind: 'blocked',
    blockerIds: ['community-posts'] as FeatureId[],
  };
  return render(
    <DependencyWarningSheet action={action} onConfirm={onConfirm} onCancel={onCancel} />,
  );
}

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe('DependencyWarningSheet — ARIA (alertdialog pattern)', () => {
  it('has role="alertdialog"', () => {
    renderCascade();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    renderCascade();
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to a visible heading', () => {
    renderCascade();
    const dialog = screen.getByRole('alertdialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)).toBeInTheDocument();
  });

  it('has aria-describedby pointing to description text', () => {
    renderCascade();
    const dialog = screen.getByRole('alertdialog');
    const descId = dialog.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    expect(document.getElementById(descId!)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Render variant: cascade-off
// ---------------------------------------------------------------------------

describe('DependencyWarningSheet — cascade-off variant', () => {
  it('renders cascade-off title', () => {
    renderCascade();
    expect(screen.getByText(/mitdeaktiviert/i)).toBeInTheDocument();
  });

  it('renders the cascade feature label', () => {
    renderCascade();
    expect(screen.getByText('Proaktive Orb-Bubble')).toBeInTheDocument();
  });

  it('renders Bestaetigen button', () => {
    renderCascade();
    expect(screen.getByRole('button', { name: /bestaetigen/i })).toBeInTheDocument();
  });

  it('renders Abbrechen button', () => {
    renderCascade();
    expect(screen.getByRole('button', { name: /abbrechen/i })).toBeInTheDocument();
  });

  it('calls onConfirm when Bestaetigen is clicked', async () => {
    const onConfirm = vi.fn();
    renderCascade(onConfirm);
    await userEvent.click(screen.getByRole('button', { name: /bestaetigen/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Abbrechen is clicked', async () => {
    const onCancel = vi.fn();
    renderCascade(vi.fn(), onCancel);
    await userEvent.click(screen.getByRole('button', { name: /abbrechen/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Render variant: warn
// ---------------------------------------------------------------------------

describe('DependencyWarningSheet — warn variant', () => {
  it('renders warn title', () => {
    renderWarn();
    expect(screen.getByText(/betroffen/i)).toBeInTheDocument();
  });

  it('renders the affected feature label', () => {
    renderWarn();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('renders "Trotzdem deaktivieren" button', () => {
    renderWarn();
    expect(screen.getByRole('button', { name: /trotzdem/i })).toBeInTheDocument();
  });

  it('renders Abbrechen button', () => {
    renderWarn();
    expect(screen.getByRole('button', { name: /abbrechen/i })).toBeInTheDocument();
  });

  it('calls onConfirm when "Trotzdem deaktivieren" is clicked', async () => {
    const onConfirm = vi.fn();
    renderWarn(onConfirm);
    await userEvent.click(screen.getByRole('button', { name: /trotzdem/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Abbrechen is clicked', async () => {
    const onCancel = vi.fn();
    renderWarn(vi.fn(), onCancel);
    await userEvent.click(screen.getByRole('button', { name: /abbrechen/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Render variant: blocked
// ---------------------------------------------------------------------------

describe('DependencyWarningSheet — blocked variant', () => {
  it('renders blocked title', () => {
    renderBlocked();
    expect(screen.getByText(/blockiert/i)).toBeInTheDocument();
  });

  it('renders "Bitte zuerst deaktivieren" body text', () => {
    renderBlocked();
    expect(screen.getByText(/bitte zuerst deaktivieren/i)).toBeInTheDocument();
  });

  it('renders the blocker feature label', () => {
    renderBlocked();
    expect(screen.getByText('Community-Posts (Ideen)')).toBeInTheDocument();
  });

  it('renders only a Verstanden button (no Abbrechen for blocked)', () => {
    renderBlocked();
    expect(screen.getByRole('button', { name: /verstanden/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /abbrechen/i })).not.toBeInTheDocument();
  });

  it('calls onCancel when Verstanden is clicked', async () => {
    const onCancel = vi.fn();
    renderBlocked(vi.fn(), onCancel);
    await userEvent.click(screen.getByRole('button', { name: /verstanden/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Focus-Trap behavior
// ---------------------------------------------------------------------------

describe('DependencyWarningSheet — focus trap', () => {
  it('focuses the primary button on mount (cascade-off)', () => {
    renderCascade();
    const btn = screen.getByRole('button', { name: /bestaetigen/i });
    expect(document.activeElement).toBe(btn);
  });

  it('focuses the primary button on mount (warn)', () => {
    renderWarn();
    const btn = screen.getByRole('button', { name: /trotzdem/i });
    expect(document.activeElement).toBe(btn);
  });

  it('focuses the Verstanden button on mount (blocked)', () => {
    renderBlocked();
    const btn = screen.getByRole('button', { name: /verstanden/i });
    expect(document.activeElement).toBe(btn);
  });

  it('Escape key calls onCancel for cascade-off', async () => {
    const onCancel = vi.fn();
    renderCascade(vi.fn(), onCancel);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('Escape key calls onCancel for warn', async () => {
    const onCancel = vi.fn();
    renderWarn(vi.fn(), onCancel);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('Escape key does NOT call onCancel for blocked (no dismiss)', async () => {
    const onCancel = vi.fn();
    renderBlocked(vi.fn(), onCancel);
    // Escape on blocked variant: the handler checks action.kind !== 'blocked'
    // so onCancel should NOT fire
    await userEvent.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });
});
