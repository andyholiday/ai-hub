// =============================================================================
// Dashboard Tests
// Verify dashboard page loading, layout and key UI elements
// =============================================================================

import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("Dashboard-Seite laedt ohne Server-Fehler", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(500);
  });

  test("Dashboard zeigt Plattform-Branding in Sidebar", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("AI Hub")).toBeVisible();
    await expect(page.getByText("Community Platform")).toBeVisible();
  });

  test("Dashboard hat Hauptnavigation mit allen Menue-Punkten", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const sidebar = page.getByRole("navigation", {
      name: "Hauptnavigation",
    });
    await expect(sidebar).toBeVisible();

    // Verify core navigation items are present
    const expectedItems = [
      "Dashboard",
      "Best Practices",
      "Learn Hub",
      "Community",
      "AI Mentor",
      "Innovation Radar",
      "Leaderboard",
      "Challenges",
    ];

    for (const item of expectedItems) {
      await expect(sidebar.getByText(item)).toBeVisible();
    }
  });

  test("Homepage redirected zum Dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
