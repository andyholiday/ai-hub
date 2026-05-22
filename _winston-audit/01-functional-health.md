# Functional Health Audit — ai-hub

Date: 2026-05-22
Repo: `/Users/andreja/Documents/0.Projekte/web_ai_hub/ai-hub`
Stack: Next.js 14.2.35 (App Router, `typedRoutes`) + Supabase. Node v26.0.0, npm 11.12.1.
Mode: READ/RUN-ONLY. No source modified. No real env keys available.

## Summary Verdict: PARTIALLY WORKING

The application is fundamentally healthy: it type-checks cleanly, lints cleanly, and
produces a successful production build of 31 pages. The only failures are **environment
/ test-harness issues**, not product defects:

- 19 of 549 unit tests fail because the vitest jsdom environment does not expose a
  global `localStorage` under Node 26.
- The Playwright E2E suite cannot run because (a) Chromium browser binaries are not
  installed, and (b) the auto-started dev server crashes on every request due to missing
  Supabase env keys.

No blocker is rooted in the application code itself.

## Per-Command Results

| Command | Status | Key Numbers | Notes |
|---|---|---|---|
| `npm run type-check` (`tsc --noEmit`) | PASS | 0 errors | Clean exit 0. |
| `npm run lint` (`next lint`) | PASS | 0 warnings, 0 errors | "No ESLint warnings or errors". |
| `npm run test` (`vitest run`) | FAIL | 530 passed / 19 failed (549 total); 44/46 files pass | 2 suites fail on `localStorage` undefined — environmental, see below. |
| `npm run build` (`next build`) | PASS | 31 pages, exit 0 | Compiled successfully; type+lint validated inside build. 1 webpack cache warning only. |
| `npx playwright test` | CANNOT RUN | 48 tests in 11 files (parse OK) | Blocked: no browser binaries + dev server crashes without Supabase env. |

## Build Detail

- "Compiled successfully", then "Linting and checking validity of types" passed, then
  "Generating static pages (31/31)".
- Route mix: static (`○`) marketing/app pages + dynamic (`ƒ`) API routes and
  `[param]` pages. Largest first-load JS: `/dashboard` 178 kB, `/learn-hub` 156 kB,
  `/login` 155 kB, `/register` 153 kB. Shared baseline 87.7 kB. Middleware 72.8 kB.
- Only warning (non-blocking):
  `<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (133kiB) impacts
  deserialization performance (consider using Buffer instead and decode when needed)`

## Failure Detail

### 1. Unit tests — 19 failures (environmental)

Two suites fail, all with the same root cause — `localStorage` is `undefined` in the
test global scope:

- `tests/unit/components/consent-banner.test.tsx` — 12/12 failed
- `tests/unit/lib/analytics/web-vitals.test.ts` — 7/7 failed

Representative errors:

```
TypeError: Cannot read properties of undefined (reading 'clear')
 ❯ tests/unit/components/consent-banner.test.tsx:15:16
     14| beforeEach(() => {
     15|   localStorage.clear();
       |                ^

TypeError: Cannot read properties of undefined (reading 'clear')
 ❯ tests/unit/lib/analytics/web-vitals.test.ts:40:33
     40|   beforeEach(() => localStorage.clear());

TypeError: Cannot read properties of undefined (reading 'mockRestore')
 ❯ tests/unit/lib/analytics/web-vitals.test.ts:78:15
     78|     beaconSpy.mockRestore();   // cascades from the earlier localStorage throw
```

Node also emitted, once per worker:

```
ExperimentalWarning: localStorage is not available because --localstorage-file was not provided.
```

Root cause: `vitest.config.ts` sets `environment: "jsdom"` with `setupFiles:
["./tests/setup.ts"]`, and `tests/setup.ts` only imports `@testing-library/jest-dom/vitest`.
Under Node 26, the global `localStorage` is not provided by the vitest jsdom environment.
(Verified directly: a raw `new JSDOM("", { url: "http://localhost" })` *does* expose
`window.localStorage`, so this is the vitest-jsdom global wiring under Node 26 — not the
app code.) These two suites are the only ones that rely on a global `localStorage`; the
other 44 files (530 tests) pass.

### 2. Playwright E2E — cannot run (environmental)

`npx playwright test --list` succeeds and enumerates **48 tests in 11 files** (admin,
auth, dashboard, feature-dependency-cascade, feature-settings, navigation, orb-*, pages,
smoke), so the config and specs are valid. Execution is blocked by two environment gaps:

1. **No browser binaries** — `~/Library/Caches/ms-playwright` does not exist. Requires
   `npx playwright install chromium`.
2. **Dev server crashes without env** — `playwright.config.ts` auto-starts
   `webServer: { command: "npm run dev", url: "http://localhost:3000" }`. With no
   Supabase keys, every request throws in middleware:

```
[WebServer] ⨯ Error: Your project's URL and Key are required to create a Supabase client!
    at createServerClient (@supabase/ssr/dist/module/createServerClient.js:13:15)
    at createMiddlewareClient (src/lib/supabase/middleware.ts:19:87)
    at Object.middleware [as handler] (src/middleware.ts:36:116)
```

The run was killed via a 90s wrapper timeout (macOS has no `timeout`/`gtimeout`); no
long-lived server was left running (port 3000 confirmed free afterward).

## Blockers vs. Environment-Only

**Hard blockers (application code):** None found. type-check, lint, and production build
all pass.

**Environment-only (not code defects):**
- Unit test `localStorage` failures — vitest jsdom global not wired under Node 26.
  Fixable via test config (e.g. provide `--localstorage-file`, polyfill `localStorage`
  in `tests/setup.ts`, or pin a Node/jsdom combo) without touching app source.
- Playwright cannot run — needs `npx playwright install chromium` AND real Supabase env
  vars so the dev server can boot. Cannot be exercised statically.

**Cannot run statically (need env / live Supabase):**
- All Playwright E2E (dev server requires Supabase URL + key).
- Root-level helper scripts `set-admin.mjs`, `test-*.mjs`, `update-gemini-key.mjs` and
  `npm run supabase:*` tasks all require a live/local Supabase + keys.
