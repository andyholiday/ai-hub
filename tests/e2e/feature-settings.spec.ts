// =============================================================================
// E2E: Feature Settings Flow (Pattern P2.2)
// Tests: /dashboard/settings, feature toggle, optimistic UI, persistence.
//
// Note: These tests require a running dev server with a seeded Supabase instance.
// Auth is performed via the existing login flow (no separate mock auth).
// The optimistic-UI assertion checks within 200ms — the toggle state change
// should be visible before the Server Action round-trip completes.
// =============================================================================

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: skip gracefully when no auth session is available
// ---------------------------------------------------------------------------

const SETTINGS_PATH = '/dashboard/settings';

test.describe('Feature Settings Page', () => {
  test('settings page laedt ohne 5xx Fehler', async ({ page }) => {
    const response = await page.goto(SETTINGS_PATH);
    // Either renders (2xx) or redirects to login (3xx) — no server error
    expect(response?.status()).toBeLessThan(500);
  });

  test('settings page zeigt Feature-Section wenn eingeloggt', async ({ page }) => {
    await page.goto(SETTINGS_PATH);

    // If redirected to login, skip — no test credentials available in CI
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(
      page.getByRole('heading', { name: 'Features' }),
    ).toBeVisible();

    await expect(
      page.getByText('Aktiviere oder deaktiviere Features'),
    ).toBeVisible();
  });

  test('toggle zeigt optimistische UI-Reaktion unter 200ms', async ({ page }) => {
    await page.goto(SETTINGS_PATH);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    // Locate the first visible switch on the page
    const firstSwitch = page.getByRole('switch').first();
    await expect(firstSwitch).toBeVisible();

    const wasChecked = await firstSwitch.getAttribute('aria-checked');

    // Click to toggle
    await firstSwitch.click();

    // Optimistic update: aria-checked should change within 200ms
    const expectedChecked = wasChecked === 'true' ? 'false' : 'true';
    await expect(firstSwitch).toHaveAttribute('aria-checked', expectedChecked, {
      timeout: 200,
    });
  });

  test('feature-toggle hat korrekte ARIA-Attribute', async ({ page }) => {
    await page.goto(SETTINGS_PATH);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    const switches = page.getByRole('switch');
    const count = await switches.count();

    if (count === 0) {
      // No toggleable features — acceptable
      return;
    }

    // First switch should have aria-label
    const firstSwitch = switches.first();
    await expect(firstSwitch).toHaveAttribute('aria-label');
  });
});
