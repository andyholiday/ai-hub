// =============================================================================
// Auth Flow Tests
// Verify login, registration forms, validation and navigation between auth pages
// =============================================================================

import { test, expect } from "@playwright/test";

test.describe("Auth Flows", () => {
  test("Login-Seite laedt mit sichtbarem Formular", async ({ page }) => {
    await page.goto("/login");

    // Heading
    await expect(
      page.getByRole("heading", { name: "Anmelden" })
    ).toBeVisible();

    // Form fields
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();

    // Submit button
    await expect(
      page.getByRole("button", { name: "Anmelden" })
    ).toBeVisible();
  });

  test("Register-Seite laedt mit sichtbarem Formular", async ({ page }) => {
    await page.goto("/register");

    // Heading
    await expect(
      page.getByRole("heading", { name: "Registrieren" })
    ).toBeVisible();

    // Form fields
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();

    // Submit button
    await expect(
      page.getByRole("button", { name: "Konto erstellen" })
    ).toBeVisible();
  });

  test("Login mit leeren Feldern zeigt Browser-Validierung (required)", async ({
    page,
  }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel("E-Mail");
    const submitButton = page.getByRole("button", { name: "Anmelden" });

    // Both fields are required via HTML attribute
    await expect(emailInput).toHaveAttribute("required", "");

    const passwordInput = page.getByLabel("Passwort");
    await expect(passwordInput).toHaveAttribute("required", "");

    // Click submit without filling fields - the form should not navigate away
    await submitButton.click();

    // We remain on the login page (browser prevents submission)
    await expect(page).toHaveURL(/\/login/);
  });

  test("Register mit leeren Feldern zeigt Browser-Validierung (required)", async ({
    page,
  }) => {
    await page.goto("/register");

    const nameInput = page.getByLabel("Name");
    const emailInput = page.getByLabel("E-Mail");
    const passwordInput = page.getByLabel("Passwort");

    // All fields are required
    await expect(nameInput).toHaveAttribute("required", "");
    await expect(emailInput).toHaveAttribute("required", "");
    await expect(passwordInput).toHaveAttribute("required", "");

    // Click submit without filling - stays on register page
    await page.getByRole("button", { name: "Konto erstellen" }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("Navigation von Login zu Register ueber Link", async ({ page }) => {
    await page.goto("/login");

    const registerLink = page.getByRole("link", {
      name: "Jetzt registrieren",
    });
    await expect(registerLink).toBeVisible();

    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);

    // Verify we landed on the register page
    await expect(
      page.getByRole("heading", { name: "Registrieren" })
    ).toBeVisible();
  });

  test("Navigation von Register zu Login ueber Link", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.getByRole("link", { name: "Jetzt anmelden" });
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);

    // Verify we landed on the login page
    await expect(
      page.getByRole("heading", { name: "Anmelden" })
    ).toBeVisible();
  });

  test("Login-Seite hat Passwort-vergessen Link", async ({ page }) => {
    await page.goto("/login");

    const forgotLink = page.getByRole("link", {
      name: "Passwort vergessen?",
    });
    await expect(forgotLink).toBeVisible();

    await forgotLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("Passwort-Feld auf Register hat minLength Validierung", async ({
    page,
  }) => {
    await page.goto("/register");

    const passwordInput = page.getByLabel("Passwort");
    await expect(passwordInput).toHaveAttribute("minlength", "8");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});
