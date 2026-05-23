// =============================================================================
// Playwright E2E — Orb Bubble Spike Flow (Pattern P3.2)
// Testet: Bubble erscheint nach 5s, ESC dismissed, Reload zeigt keine Bubble
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Orb Bubble — Spike Flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Override spike delay to 100ms for fast tests (no waitForTimeout needed)
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__SPIKE_TRIGGER_DELAY_MS__ = 100;
    });

    // Leere localStorage/sessionStorage vor jedem Test
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Bubble erscheint nach 5s und ist per ESC dismissbar', async ({ page }) => {
    await page.goto('/best-practices');

    // Bubble muss sichtbar sein (role="status" mit aria-live)
    const bubble = page.getByRole('status');
    await expect(bubble).toBeVisible({ timeout: 2_000 });

    // ESC druecken — Bubble verschwindet
    await page.keyboard.press('Escape');
    await expect(bubble).not.toBeVisible({ timeout: 2_000 });
  });

  test('Nach Dismiss: Bubble erscheint nach Reload nicht mehr (Session-Cap)', async ({ page }) => {
    await page.goto('/best-practices');

    const bubble = page.getByRole('status');
    await expect(bubble).toBeVisible({ timeout: 2_000 });

    // Dismiss per Schliessen-Button
    await page.getByRole('button', { name: 'Bubble schließen' }).click();
    await expect(bubble).not.toBeVisible({ timeout: 2_000 });

    // Reload — Session-Cap aktiv, Bubble darf nicht erscheinen
    await page.reload();

    // Bubble darf nicht sichtbar sein
    const bubbleAfterReload = page.getByRole('status');
    // role="status" ist im DOM (aria-live container), aber ohne sichtbaren Inhalt
    // Wir pruefen dass kein Text-Inhalt sichtbar ist
    await expect(bubbleAfterReload).not.toContainText('steckt mehr drin', { timeout: 1_000 });
  });
});
