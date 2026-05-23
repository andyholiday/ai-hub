# Quality Review — Wave 2 (2026-05-13)

**Datum:** 2026-05-13
**Branch-Index:** [docs/BRANCH-INDEX-2026-05-13.md](../BRANCH-INDEX-2026-05-13.md)
**Folge-Audit:** [docs/AUDIT-FOLLOWUP-2026-05-13.md](../AUDIT-FOLLOWUP-2026-05-13.md)

---

## Verdict-Tabelle

| Task | Branch | Commit | Iteration | Verdict |
|------|--------|--------|-----------|---------|
| T2 | `feature/phase-1-role-change-client-refresh` | `33daf9f` | Iter-1 | **GO** |
| T5 | `feature/phase-1-playwright-auth-fixture` | `6592e5d` | Iter-2 | **GO** |

---

## T2 — feature/phase-1-role-change-client-refresh

**Verdict: GO (Iter-1)**

### Reality-Check

- 3 Files:
  - `src/lib/api/handle-role-change-response.ts` (NEU, 22 Zeilen)
  - `src/lib/api/handle-role-change-response.test.ts` (NEU, 52 Zeilen)
  - `src/app/(dashboard)/admin/users/admin-users.tsx` (+4 Zeilen)
- 1 Commit: `33daf9f`

### Findings

Keine Findings. Implementierung entspricht ADR-016 vollstaendig.

### Verifications

- Cross-Check (Lesson aus reflect-log): Helper an beiden PATCH-Callsites in
  `admin-users.tsx` korrekt eingebunden (Zeilen 71 und 135).
- Tests: 248/248 gruen (3 neue Helper-Tests).
- ADR-016 vollstaendig implementiert (NOP-01 geschlossen).

---

## T5 — feature/phase-1-playwright-auth-fixture

**Verdict: GO (Iter-2 nach Fix)**

### Iter-1 Findings

| ID | Schwere | Beschreibung |
|----|---------|--------------|
| F01 | **major** | `chromium-admin` Playwright-Project fehlte. `admin.json` wurde erzeugt aber nie als eigenstaendiges Project genutzt. |
| F02 | minor | `retries: 1` statt `2` in CI-Config. |
| F03 | minor | `video: 'retain-on-failure'` fehlte in `playwright.config.ts`. |
| F04 | minor | `seed-test-users.mjs` hatte (a) `listUsers` ohne Pagination, (b) `update` statt `upsert` fuer profiles, (c) keinen Production-Guard. |

### Iter-2 Fix (Commit `6592e5d`)

| Finding | Status | Massnahme |
|---------|--------|-----------|
| F01 | behoben | `chromium-admin` Project mit `storageState: admin.json` + `dependencies: [setup]` korrekt eingetragen. |
| F02 | behoben | `retries: 2` in CI. |
| F03 | behoben | `video: 'retain-on-failure'` eingefuehrt. |
| F04a | behoben | Pagination-Loop fuer `listUsers`. |
| F04b | behoben | `upsert` mit `onConflict: 'id'` fuer profiles. |
| F04c | behoben | Production-Guard via `--allow-production`-Flag oder `SEED_ALLOW_PRODUCTION=1`-Env. |

### Final-Verifications

- `tsc --noEmit` sauber.
- Delta: 4 Files (5 inkl. `auth.setup.ts`).
- Offener Punkt (User-Aktion): `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`,
  `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` als GitHub-Secrets setzen.
  Siehe [docs/BRANCH-INDEX-2026-05-13.md](../BRANCH-INDEX-2026-05-13.md),
  Abschnitt "Manuelle Folge-Aktionen".
