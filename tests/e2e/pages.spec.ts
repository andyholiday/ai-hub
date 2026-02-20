// =============================================================================
// Page Rendering Tests
// Verify that key pages render their forms and content correctly
// =============================================================================

import { test, expect } from "@playwright/test";

test.describe("Page Rendering", () => {
  test("Login-Formular hat E-Mail und Passwort Felder", async ({ page }) => {
    await page.goto("/login");

    // Email field
    const emailInput = page.getByLabel("E-Mail");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    // Password field
    const passwordInput = page.getByLabel("Passwort");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Submit button
    await expect(
      page.getByRole("button", { name: "Anmelden" })
    ).toBeVisible();
  });

  test("Register-Formular hat alle erforderlichen Felder", async ({
    page,
  }) => {
    await page.goto("/register");

    // Name field
    const nameInput = page.getByLabel("Name");
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute("type", "text");

    // Email field
    const emailInput = page.getByLabel("E-Mail");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    // Password field
    const passwordInput = page.getByLabel("Passwort");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Submit button
    await expect(
      page.getByRole("button", { name: "Konto erstellen" })
    ).toBeVisible();
  });

  test("Forgot-Password Seite ist erreichbar und hat E-Mail Feld", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: "Passwort vergessen" })
    ).toBeVisible();

    // Email field
    const emailInput = page.getByLabel("E-Mail");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    // Submit button
    await expect(
      page.getByRole("button", { name: "Link senden" })
    ).toBeVisible();
  });

  test("Login-Seite hat Link zur Registrierung", async ({ page }) => {
    await page.goto("/login");

    const registerLink = page.getByRole("link", {
      name: "Jetzt registrieren",
    });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("Register-Seite hat Link zur Anmeldung", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.getByRole("link", { name: "Jetzt anmelden" });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });
});
