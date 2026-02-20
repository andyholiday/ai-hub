// =============================================================================
// Smoke Tests
// Verify that critical pages load and render basic content
// =============================================================================

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("Homepage laedt und redirected zum Dashboard", async ({ page }) => {
    await page.goto("/");
    // Homepage redirects to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Dashboard zeigt Logo und Plattform-Titel", async ({ page }) => {
    await page.goto("/dashboard");
    // Sidebar contains the LR brand mark and platform name
    await expect(page.getByText("AI Hub")).toBeVisible();
    await expect(page.getByText("Community Platform")).toBeVisible();
  });

  test("Login-Seite ist erreichbar", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
  });

  test("Register-Seite ist erreichbar", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Registrieren" })
    ).toBeVisible();
  });

  test("404-Seite zeigt 'Seite nicht gefunden'", async ({ page }) => {
    await page.goto("/eine-seite-die-nicht-existiert");
    await expect(page.getByText("Seite nicht gefunden")).toBeVisible();
  });
});
