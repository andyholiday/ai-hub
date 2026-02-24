// =============================================================================
// Admin Panel Tests
// Verify admin page structure, tabs, and access behaviour
// =============================================================================

import { test, expect } from "@playwright/test";

test.describe("Admin Panel", () => {
  test("Admin-Seite laedt ohne Server-Fehler", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(500);
  });

  test("Admin-Seite zeigt Panel-Header mit Titel", async ({ page }) => {
    await page.goto("/admin");

    // The admin page has a heading "Admin Panel"
    await expect(page.getByText("Admin Panel")).toBeVisible();
    await expect(
      page.getByText("Plattform-Konfiguration, KI-Provider und System-Einstellungen")
    ).toBeVisible();
  });

  test("Admin-Tabs Navigation ist vorhanden mit allen Bereichen", async ({
    page,
  }) => {
    await page.goto("/admin");

    // The tablist with aria-label "Admin-Bereiche"
    const tabList = page.getByRole("tablist", { name: "Admin-Bereiche" });
    await expect(tabList).toBeVisible();

    // All 7 tabs from ADMIN_TABS
    await expect(tabList.getByRole("tab", { name: "KI-Provider" })).toBeVisible();
    await expect(tabList.getByRole("tab", { name: "Benutzer" })).toBeVisible();
    await expect(tabList.getByRole("tab", { name: "Analytics" })).toBeVisible();
    await expect(tabList.getByRole("tab", { name: "Gamification" })).toBeVisible();
    await expect(tabList.getByRole("tab", { name: "Content" })).toBeVisible();
    await expect(tabList.getByRole("tab", { name: "System" })).toBeVisible();
    await expect(tabList.getByRole("tab", { name: "Branding" })).toBeVisible();
  });

  test("KI-Provider Tab ist standardmaessig aktiv", async ({ page }) => {
    await page.goto("/admin");

    const tabList = page.getByRole("tablist", { name: "Admin-Bereiche" });
    const providerTab = tabList.getByRole("tab", { name: "KI-Provider" });

    await expect(providerTab).toHaveAttribute("aria-selected", "true");
  });

  test("Tab-Wechsel aendert aria-selected Status", async ({ page }) => {
    await page.goto("/admin");

    const tabList = page.getByRole("tablist", { name: "Admin-Bereiche" });

    // Click on "Benutzer" tab
    const usersTab = tabList.getByRole("tab", { name: "Benutzer" });
    await usersTab.click();
    await expect(usersTab).toHaveAttribute("aria-selected", "true");

    // The previous tab should no longer be selected
    const providerTab = tabList.getByRole("tab", { name: "KI-Provider" });
    await expect(providerTab).toHaveAttribute("aria-selected", "false");
  });
});
