// =============================================================================
// Playwright E2E Test Configuration
// =============================================================================

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // ---------------------------------------------------------------------------
  // Test Directory & Matching
  // ---------------------------------------------------------------------------
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",

  // ---------------------------------------------------------------------------
  // Execution Settings
  // ---------------------------------------------------------------------------
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,

  // ---------------------------------------------------------------------------
  // Reporter
  // ---------------------------------------------------------------------------
  reporter: "html",

  // ---------------------------------------------------------------------------
  // Shared Settings for All Projects
  // ---------------------------------------------------------------------------
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  // ---------------------------------------------------------------------------
  // Browser Projects
  // ---------------------------------------------------------------------------
  projects: [
    // Auth-Setup: laueft einmalig vor allen chromium-Tests
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // Haupt-Testlauf mit gespeicherter User-Session
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // ---------------------------------------------------------------------------
  // Web Server - Auto-start dev server
  // ---------------------------------------------------------------------------
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
