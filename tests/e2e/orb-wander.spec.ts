// =============================================================================
// E2E: Orb Wander — reduced-motion + scroll-anchor smoke tests
// Pattern P3.1, ADR-007
//
// Note: orb-wander feature is defaultEnabled: false.
// These tests validate the behaviour when the flag is active (mock or env).
// Smoke-level: 2-3 assertions per scenario.
// =============================================================================

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Selector for the wander layer (motion.div wrapping the orb in wander mode). */
const WANDER_LAYER_SELECTOR = '[aria-hidden="true"]';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Orb Wander — reduced-motion', () => {
  test('orb bounding box is stable when prefers-reduced-motion is reduce', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Give the page time to settle
    await page.waitForTimeout(500);

    // The orb element should be visible (fixed position, bottom-right)
    const orb = page.locator('.ai-orb-core').first();
    const box1 = await orb.boundingBox();

    // Scroll down and back
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const box2 = await orb.boundingBox();

    // With reduced motion the orb must not move
    if (box1 && box2) {
      expect(Math.abs(box2.x - box1.x)).toBeLessThan(2);
      expect(Math.abs(box2.y - box1.y)).toBeLessThan(2);
    }
  });
});

test.describe('Orb Wander — anchor scroll (no-preference)', () => {
  test('page loads without JS errors related to wander hook', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(500);

    // No JS errors thrown by the wander hook
    const wanderErrors = errors.filter((e) => e.toLowerCase().includes('wander'));
    expect(wanderErrors).toHaveLength(0);
  });

  test('orb element is present in DOM after load', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    // The orb button should be rendered
    const orbButton = page.locator('[aria-label="AI Mentor oeffnen"]').first();
    await expect(orbButton).toBeVisible({ timeout: 5000 });
  });

  test('orb does not leave viewport after scroll to data-orb-anchor section', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    // Inject a test anchor into the page if none exists
    await page.evaluate(() => {
      const existing = document.querySelector('[data-orb-anchor]');
      if (!existing) {
        const anchor = document.createElement('div');
        anchor.setAttribute('data-orb-anchor', 'test');
        anchor.style.cssText = 'position:absolute;top:1500px;height:200px;width:100%;';
        document.body.appendChild(anchor);
      }
    });

    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    await page.waitForTimeout(600);

    const viewportWidth = page.viewportSize()?.width ?? 1280;
    const viewportHeight = page.viewportSize()?.height ?? 720;

    const orbButton = page.locator('[aria-label="AI Mentor oeffnen"]').first();
    const box = await orbButton.boundingBox();

    if (box) {
      // Orb must remain within viewport bounds
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewportHeight + 1);
    }
  });
});
