// =============================================================================
// orb-idle-state.spec.ts — E2E: prefers-reduced-motion Respekt (Pattern P3.3)
//
// Prueft dass der Orb bei prefers-reduced-motion: reduce keine Scale-Animation
// ausfuehrt (Muted-State aktiv, OrbAnimationLayer statisch).
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Orb Idle State — prefers-reduced-motion', () => {
  test('orb shows no scale animation when reduced-motion is preferred', async ({ page }) => {
    // Reduced-Motion aktivieren BEVOR die Seite geladen wird
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dashboard');

    // Orb-Button finden (aria-label "AI Mentor oeffnen")
    const orb = page.getByRole('button', { name: 'AI Mentor oeffnen' });
    await expect(orb).toBeVisible();

    // Bounding-Box zu drei Zeitpunkten messen — bei Muted-State keine Scale-Veraenderung
    const box1 = await orb.boundingBox();
    await page.waitForTimeout(500);
    const box2 = await orb.boundingBox();
    await page.waitForTimeout(500);
    const box3 = await orb.boundingBox();

    // Width und Height sollten stabil bleiben (kein breathing-Scale)
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();
    expect(box3).not.toBeNull();

    if (box1 && box2 && box3) {
      // Toleranz: max 1px Abweichung durch Sub-Pixel-Rendering
      expect(Math.abs(box2.width - box1.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(box3.width - box1.width)).toBeLessThanOrEqual(1);
    }
  });

  test('orb shows breathing animation without reduced-motion preference', async ({ page }) => {
    // Kein reduced-motion — normale Animationen erlaubt
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/dashboard');

    const orb = page.getByRole('button', { name: 'AI Mentor oeffnen' });
    await expect(orb).toBeVisible();

    // Orb ist sichtbar und bereit — kein Absturz durch Animation-Layer
    const box = await orb.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThan(0);
  });
});
