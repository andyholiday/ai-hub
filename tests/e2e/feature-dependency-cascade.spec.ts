// =============================================================================
// E2E: Feature Dependency Cascade (Pattern P2.3)
// Tests: cascade-off flow — living-orb deaktivieren zeigt DependencyWarningSheet,
//        Confirm deaktiviert living-orb + proactive-orb-bubble.
//
// FIXME(Wave-4-Auth-Fixture-Voraussetzung):
//   Diese Tests erfordern eine authentifizierte Session in Playwright.
//   Voraussetzung: globales auth.setup.ts mit TEST_USER_EMAIL + TEST_USER_PASSWORD
//   als CI-Secrets + test.use({ storageState: 'playwright/.auth/user.json' }).
//   Bis dahin werden alle Scenarios mit test.skip() markiert.
//
//   Implementierungsplan wenn Auth-Fixture verfuegbar:
//   1. test.use({ storageState: 'playwright/.auth/user.json' })
//   2. Setup: beide Features aktivieren via /dashboard/settings
//   3. Toggle living-orb OFF -> DependencyWarningSheet sichtbar
//   4. Confirm -> beide Toggles deaktiviert (UI-State-Check)
//   5. Reload -> State persistiert (DB-Verify via UI)
//
//   Referenz: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
//   GitHub-Issue: Wave-4-Backlog — "E2E auth fixture fuer dependency-cascade.spec.ts"
// =============================================================================

import { test, expect } from '@playwright/test';

const SETTINGS_PATH = '/dashboard/settings';

// ---------------------------------------------------------------------------
// Smoke: Seite erreichbar ohne 5xx (kein Auth noetig)
// ---------------------------------------------------------------------------

test.describe('Feature Dependency Cascade — smoke', () => {
  test('settings page antwortet ohne 5xx', async ({ page }) => {
    const response = await page.goto(SETTINGS_PATH);
    expect(response?.status()).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Cascade-off flow (FIXME: erfordert Auth-Fixture aus Wave-4)
// ---------------------------------------------------------------------------

test.describe('Feature Dependency Cascade — cascade-off flow', () => {
  // FIXME(Wave-4-Auth-Fixture-Voraussetzung): test.skip entfernen wenn
  // playwright/.auth/user.json via auth.setup.ts vorhanden ist.

  test.skip('living-orb toggle-off zeigt DependencyWarningSheet', async ({ page }) => {
    await page.goto(SETTINGS_PATH);

    // Erwarte: living-orb Toggle sichtbar und aktiv
    const orbToggle = page.getByRole('switch', { name: /living orb/i });
    await expect(orbToggle).toBeVisible();
    await expect(orbToggle).toBeChecked();

    // Toggle OFF klicken
    await orbToggle.click();

    // DependencyWarningSheet soll erscheinen
    const sheet = page.getByRole('alertdialog');
    await expect(sheet).toBeVisible();

    // Cascade-Liste soll proactive-orb-bubble erwaehnen
    await expect(sheet.getByText(/proaktive orb-bubble/i)).toBeVisible();
  });

  test.skip('cascade confirm deaktiviert beide Features', async ({ page }) => {
    await page.goto(SETTINGS_PATH);

    const orbToggle = page.getByRole('switch', { name: /living orb/i });
    await orbToggle.click();

    const sheet = page.getByRole('alertdialog');
    await expect(sheet).toBeVisible();

    // Confirm klicken
    await sheet.getByRole('button', { name: /bestaetigen/i }).click();

    // Sheet soll verschwunden sein
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Beide Toggles sollen deaktiviert sein
    await expect(page.getByRole('switch', { name: /living orb/i })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: /proaktive orb-bubble/i })).not.toBeChecked();
  });

  test.skip('cascade cancel behaelt urspruenglichen Zustand', async ({ page }) => {
    await page.goto(SETTINGS_PATH);

    const orbToggle = page.getByRole('switch', { name: /living orb/i });
    await orbToggle.click();

    const sheet = page.getByRole('alertdialog');
    await expect(sheet).toBeVisible();

    // Cancel klicken
    await sheet.getByRole('button', { name: /abbrechen/i }).click();

    // Sheet soll verschwunden sein
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // living-orb soll noch aktiv sein
    await expect(page.getByRole('switch', { name: /living orb/i })).toBeChecked();
  });

  test.skip('blocked variant zeigt nur Verstanden-Button', async ({ page }) => {
    // Setup: ai-mentor deaktivieren waehrend living-orb aktiv ist
    // (living-orb haengt von ai-mentor ab, ai-mentor hat strategy 'block')
    await page.goto(SETTINGS_PATH);

    const aiMentorToggle = page.getByRole('switch', { name: /ai mentor/i });
    await aiMentorToggle.click();

    const sheet = page.getByRole('alertdialog');
    await expect(sheet).toBeVisible();

    // Nur Verstanden-Button, kein Abbrechen-Button
    await expect(sheet.getByRole('button', { name: /verstanden/i })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /abbrechen/i })).not.toBeVisible();
  });
});
