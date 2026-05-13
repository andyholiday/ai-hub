// =============================================================================
// Playwright Auth Setup
// Loggt Test-User via UI ein und speichert storageState fuer wiederverwendbare
// Auth-Sessions in nachgelagerten Tests.
//
// Ausfuehren: wird automatisch als 'setup'-Project vor chromium-Tests gestartet.
// Erfordert laufenden Dev-Server und geseedete Test-User.
//
// Benoetigt ENV:
//   TEST_USER_EMAIL, TEST_USER_PASSWORD
//   TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
// =============================================================================

import { test as setup, expect } from "@playwright/test";
import path from "path";

// ---------------------------------------------------------------------------
// Pfade fuer StorageState
// ---------------------------------------------------------------------------
export const USER_AUTH_FILE = path.join(
  __dirname,
  ".auth",
  "user.json"
);
export const ADMIN_AUTH_FILE = path.join(
  __dirname,
  ".auth",
  "admin.json"
);

// ---------------------------------------------------------------------------
// Env-Validierung
// ---------------------------------------------------------------------------
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[auth.setup] ENV-Variable '${name}' ist nicht gesetzt. ` +
        `Bitte in .env.local oder CI-Secrets setzen.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: Login via UI
// ---------------------------------------------------------------------------
async function loginViaUI(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  storageStatePath: string
): Promise<void> {
  await page.goto("/login");

  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();

  // Nach erfolgreichem Login landet man auf /dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  await page.context().storageState({ path: storageStatePath });
}

// ---------------------------------------------------------------------------
// Setup: User
// ---------------------------------------------------------------------------
setup("authenticate as user", async ({ page }) => {
  const email = requireEnv("TEST_USER_EMAIL");
  const password = requireEnv("TEST_USER_PASSWORD");
  await loginViaUI(page, email, password, USER_AUTH_FILE);
});

// ---------------------------------------------------------------------------
// Setup: Admin
// ---------------------------------------------------------------------------
setup("authenticate as admin", async ({ page }) => {
  const email = requireEnv("TEST_ADMIN_EMAIL");
  const password = requireEnv("TEST_ADMIN_PASSWORD");
  await loginViaUI(page, email, password, ADMIN_AUTH_FILE);
});
