# Branch-Index — 2026-05-13

Dieses Dokument erfasst die fuenf Feature-Branches, die im Zuge der
Audit-Follow-up-Arbeit (Wave 2026-05-13) erstellt und committet wurden.

**Vorgaenger-Index:** [docs/BRANCH-INDEX-2026-05-12.md](BRANCH-INDEX-2026-05-12.md)

---

## feature/phase-1-provider-key-cleanup

**Letzter Commit:** `4df595b`
`feat(db): normalize chatgpt->openai provider key with CHECK constraint (00029)`

**Inhalt:** Migration 00029 normalisiert den `ai_providers`-Row von `chatgpt`
auf `openai`. CHECK-Constraint `ai_providers_provider_key_known` schuetzt vor
erneutem Drift. Prod-DB applied.

**Quality-Review:** [docs/quality/REVIEW-2026-05-13-wave-1.md](quality/REVIEW-2026-05-13-wave-1.md)

---

## feature/phase-1-role-change-client-refresh

**Letzter Commit:** `33daf9f`
`feat(admin): client-side X-Role-Changed handler with session refresh (ADR-016)`

**Inhalt:** `src/lib/api/handle-role-change-response.ts` (NEU) — Helper wertet
`X-Role-Changed: true`-Response-Header aus und ruft `supabase.auth.refreshSession()`
auf. Tests. Wiring in `admin-users.tsx` an beiden PATCH-Callsites. Schliesst
NOP-01 aus [docs/AUDIT-FOLLOWUP-2026-05-12.md](AUDIT-FOLLOWUP-2026-05-12.md).

**ADR-Referenz:** [docs/architecture/adr/ADR-016-admin-role-source-of-truth.md](architecture/adr/ADR-016-admin-role-source-of-truth.md)

**Quality-Review:** [docs/quality/REVIEW-2026-05-13-wave-2.md](quality/REVIEW-2026-05-13-wave-2.md)

---

## feature/phase-1-orb-chat-consolidation

**Letzter Commit:** `7b597bc`
`refactor(orb): consolidate ChatSplitView onto useOrbChat hook`

**Inhalt:** `ChatSplitView` auf `useOrbChat`-Hook migriert. `setTimeout`-Mock
entfernt. Echter SSE-Streaming-Call an `POST /api/ai/chat`. 19 neue Tests
in `chat-split-view.test.tsx`.

**Quality-Review:** [docs/quality/REVIEW-2026-05-13-wave-3.md](quality/REVIEW-2026-05-13-wave-3.md)

---

## feature/phase-1-playwright-auth-fixture

**Letzter Commit:** `6592e5d`
`fix(test): F01 admin playwright project + F02/F03/F04 config and seed hardening`

**Inhalt:** `scripts/seed-test-users.mjs` (idempotent, Production-Guard),
`tests/e2e/auth.setup.ts` (Playwright storageState fuer `user.json` +
`admin.json`), `playwright.config.ts` mit zwei `chromium`-Projects
(`chromium-user`, `chromium-admin`) plus `setup`-Project-Dependency.

**Quality-Review:** [docs/quality/REVIEW-2026-05-13-wave-2.md](quality/REVIEW-2026-05-13-wave-2.md)

---

## feature/phase-2-admin-subroutes

**Letzter Commit:** `f901955`
`feat(admin): mount admin-users component and convert subroute stubs to backlog references`

**Inhalt:** `admin/users/page.tsx` mountet `AdminUsersTab` (Named Export).
`admin/analytics/page.tsx`, `admin/content/page.tsx`, `admin/settings/page.tsx`
sind TODO-Stubs mit Backlog-Link.

**Quality-Review:** [docs/quality/REVIEW-2026-05-13-wave-1.md](quality/REVIEW-2026-05-13-wave-1.md)

---

## Querverweise

- Vorgaenger-Index: [docs/BRANCH-INDEX-2026-05-12.md](BRANCH-INDEX-2026-05-12.md)
- Quality-Reviews Wave 1: [docs/quality/REVIEW-2026-05-13-wave-1.md](quality/REVIEW-2026-05-13-wave-1.md)
- Quality-Reviews Wave 2: [docs/quality/REVIEW-2026-05-13-wave-2.md](quality/REVIEW-2026-05-13-wave-2.md)
- Quality-Reviews Wave 3: [docs/quality/REVIEW-2026-05-13-wave-3.md](quality/REVIEW-2026-05-13-wave-3.md)
- Audit-Followup: [docs/AUDIT-FOLLOWUP-2026-05-13.md](AUDIT-FOLLOWUP-2026-05-13.md)
- CHANGELOG: [CHANGELOG.md](../CHANGELOG.md)

---

## Manuelle Folge-Aktionen

### T1 — TODO(audit-task-1)-Marker in `src/lib/ai/provider-keys.ts`

Der `TODO(audit-task-1)`-Marker im defensiven COALESCE-Workaround muss
entfernt werden, sobald `feature/phase-1-admin-auth-and-challenges` in `main`
gemerged wird (der TODO-Kommentar lebt nur auf diesem Branch).

**Merge-Reihenfolge:** `feature/phase-1-admin-auth-and-challenges` zuerst
mergen, danach `feature/phase-1-provider-key-cleanup`. Beim Merge des
zweiten Branches den TODO-Kommentar entfernen. Cross-Branch-Konflikt erwartet
— manuell aufloesen.

### T5 — CI-Secrets (User-Aktion erforderlich)

Die folgenden GitHub-Secrets muessen manuell gesetzt werden, bevor der
Playwright-Auth-Fixture in CI laeuft:

- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`
- `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`

Danach lokal ausfuehren:

```bash
node scripts/seed-test-users.mjs
```

### T5 — Stale Playwright-Asserts auf anderen Branches

`tests/e2e/orb-bubble.spec.ts` enthaelt `/dashboard/best-practices`-Asserts
auf ungemerged Branches. Diese Asserts muessen bei Merge der betroffenen
Branches mitkorrigiert werden.
