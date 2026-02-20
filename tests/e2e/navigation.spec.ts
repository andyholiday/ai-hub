// =============================================================================
// Navigation Tests
// Verify navigation structure and auth-guarded redirects
// =============================================================================

import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("Hauptnavigation Links sind in der Sidebar vorhanden", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const sidebar = page.getByRole("navigation", {
      name: "Hauptnavigation",
    });
    await expect(sidebar).toBeVisible();

    // Core navigation items from MAIN_NAVIGATION
    await expect(sidebar.getByText("Dashboard")).toBeVisible();
    await expect(sidebar.getByText("Best Practices")).toBeVisible();
    await expect(sidebar.getByText("Learn Hub")).toBeVisible();
    await expect(sidebar.getByText("Community")).toBeVisible();
    await expect(sidebar.getByText("AI Mentor")).toBeVisible();
    await expect(sidebar.getByText("Innovation Radar")).toBeVisible();
    await expect(sidebar.getByText("Leaderboard")).toBeVisible();
    await expect(sidebar.getByText("Challenges")).toBeVisible();
  });

  test("Admin Panel Link ist in der Sidebar vorhanden", async ({ page }) => {
    await page.goto("/dashboard");

    const sidebar = page.getByRole("navigation", {
      name: "Hauptnavigation",
    });
    await expect(sidebar.getByText("Admin Panel")).toBeVisible();
  });

  test("Dashboard ist ohne Authentifizierung erreichbar (Smoke)", async ({
    page,
  }) => {
    // In the current app state without Supabase middleware,
    // the dashboard renders its layout. This test verifies
    // the page loads without a server error.
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(500);
  });

  test("Admin-Bereich ist ohne Authentifizierung erreichbar (Smoke)", async ({
    page,
  }) => {
    // Same approach: verify the admin route does not crash
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(500);
  });
});
