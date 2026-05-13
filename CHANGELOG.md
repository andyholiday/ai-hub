# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 1/2 — Audit Follow-up Wave 2026-05-13

#### Added

- Migration 00029 + CHECK constraint `ai_providers_provider_key_known` normalisiert
  `chatgpt`-Row auf `openai` und schuetzt vor erneutem Provider-Key-Drift.
- `src/lib/api/handle-role-change-response.ts` — client-seitiger Handler fuer
  `X-Role-Changed: true`-Header; ruft `supabase.auth.refreshSession()` auf
  (schliesst ADR-016 NOP-01).
- `scripts/seed-test-users.mjs` — idempotentes Test-User-Seed-Script mit
  Pagination-Loop, upsert-Logik und Production-Guard.
- `tests/e2e/auth.setup.ts` — Playwright storageState fuer `user.json` und
  `admin.json`.
- `chromium-admin` Playwright-Project mit `storageState: admin.json` und
  `dependencies: [setup]`.
- `AdminUsersTab` gemountet in `/admin/users`.
- Backlog-Link-Stubs fuer `/admin/analytics`, `/admin/content`,
  `/admin/settings`.

#### Changed

- `ChatSplitView` nutzt `useOrbChat`-Hook fuer Chat-State. `setTimeout`-Mock
  entfernt; echter SSE-Streaming-Call an `POST /api/ai/chat`.

#### Fixed

- Live-DB-Konsistenz: `chatgpt`-Row in `ai_providers` auf `openai` normalisiert.
  CHECK-Constraint schuetzt vor weiterem Drift.
- Defensiver Workaround in `src/lib/ai/provider-keys.ts`:
  `TODO(audit-task-1)` bleibt offen bis `feature/phase-1-admin-auth-and-challenges`
  in `main` gemerged ist.
- Playwright-Seed-Script `retries: 2` in CI (war 1) und
  `video: 'retain-on-failure'` (fehlte).

#### Security

- `X-Role-Changed`-Client-Refresh schliesst Mismatch-Fenster bei Admin-Role-Change
  (ADR-016 NOP-01). Siehe
  [docs/quality/REVIEW-2026-05-13-wave-2.md](docs/quality/REVIEW-2026-05-13-wave-2.md).
- Playwright-Seed-Script verweigert Ausfuehrung gegen Prod-DB ohne explizites
  `--allow-production`-Flag oder `SEED_ALLOW_PRODUCTION=1`.

---

### Phase 1/2 — Audit Follow-up (Waves A/B1/B2/C, 2026-05-12)

#### Added

- **ADR-016** — Admin-Role-Source-of-Truth: JWT `app_metadata.role` als
  Fast-Path-Cache in Middleware; `profiles.role` (DB) als autoritaetive Quelle
  fuer Admin-API-Mutations. Mismatch-Guard in `requireAdmin()`.
  Siehe [docs/architecture/adr/ADR-016-admin-role-source-of-truth.md](docs/architecture/adr/ADR-016-admin-role-source-of-truth.md).
- **Best Practices CRUD-API** — 5 Endpunkte (`GET /`, `POST /`,
  `GET /[id]`, `PATCH /[id]`, `DELETE /[id]`) in
  `src/app/api/best-practices/`. Zod-Validierung, RLS-geschuetzt,
  archived-Transition Admin-only.
- **Best Practices UI** — Listen-, Detail- und Create-Seiten nutzen die
  echte API; Demo-Daten entfernt.
- **`challenge_completions`-Tabelle + RLS** — Migration 00028 sichert
  One-Time-XP-Award per `PRIMARY KEY (user_id, challenge_id)`. Route-Handler
  nutzt Upsert mit `ignoreDuplicates: true`.

#### Security

- **JWT/DB-Role-Mismatch-Guard** — `requireAdmin()` vergleicht JWT-Rolle mit
  `profiles.role`; bei Abweichung wird `403 ROLE_SYNC_REQUIRED` zurueckgegeben
  und ein Warning geloggt.
- **`X-Role-Changed`-Header** — `PATCH /api/admin/users` setzt
  `X-Role-Changed: true` nach erfolgreichem Role-Update als Token-Refresh-Signal
  fuer den Admin-UI-Client.
- **PATCH `/api/admin/users` Zod-Validierung** — Verhindert leeren-Role-Bypass;
  `role` muss einem erlaubten Enum-Wert entsprechen.
- **Challenge-Progress server-known events** — Body-Schema von
  `{ progress: number }` auf `{ eventType, entityId }` umgestellt; Client
  kann keinen beliebigen Fortschrittswert mehr senden.
- **Best Practices Zugriffschutz** — `archived`-Transition nur fuer Admins;
  Draft-Visibility nur fuer Eigentuemerins.

#### Changed

- **Challenge-Progress-Body-Schema**: `{ progress: number }` ersetzt durch
  `{ eventType: string, entityId: string }` — server-seitige Ereigniserkennung
  statt client-kontrolliertem Fortschrittswert.

#### Fixed

- **Migration 00025** — `preferences`-Spalte existiert nicht in Production;
  durch `position` ersetzt.
- **Migration 00028** — `CREATE POLICY IF NOT EXISTS` ist kein gueltiges
  Postgres-Syntax; ersetzt durch `DROP POLICY IF EXISTS` + `CREATE POLICY`.
- **19 localStorage-Test-Failures** — `tests/setup.ts`-Polyfill behebt
  fehlende State-Isolation in Playwright-Tests (`T01`).
- **`chat/route.ts`** — Doppelter dynamischer Import von `@/lib/supabase/admin`
  dedupliziert.
- **`provider-keys.ts`** — `TODO(audit-task-1)`-Marker gesetzt fuer
  ausstehende Provider-Key-Normalisierung.
- **Orb-Status-Indicator-Test** — framer-motion-Mock leakt keine
  `drag`-Props mehr auf DOM-Elemente.

---

### Security (Phase 0 — Hardening, Merge-Blocker)

- **0.1 Auth-Hardening** — Server-side JWT validation via `getUser()` instead of
  `getSession()` in `requireAuth()` and `middleware.ts`. Closes OWASP A07.
- **0.2 API-Key-Encryption** — `ai_providers.api_key_encrypted` migrated to
  Supabase Vault (pgsodium). Plaintext keys replaced by Vault UUIDs. RPC
  `get_active_provider_keys()` replaces direct column read. See
  [ADR-003](docs/architecture/ADR-003-api-key-encryption.md).
- **0.4 Admin-Email-Bug** — `auth.admin.listUsers()` with pagination loop
  (`perPage=1000`) replaces fake-mail synthesis. Closes OWASP A01.
- **0.5 Prompt-Injection** — Client-supplied `systemPrompt` no longer accepted in
  `/api/ai/chat`. Closes OWASP A03.
- **0.6 RLS Hardening** — `ai_cost_log` INSERT-policy tightened from
  `WITH CHECK (true)` to `WITH CHECK (auth.uid() = user_id)`.

### Added (Wave 2A — P3.2 Bubble-Spike)

- **P3.2 Proaktive Orb-Bubble** — Regelbasierte Rule-Engine (ts-pattern v5.9,
  kein LLM-Call) mit 8 Trigger-Events (`SECTION_DWELL`, `CODE_BLOCK_VISIBLE`,
  `SEARCH_NO_RESULT`, `INACTIVITY`, `XP_MILESTONE`, `FIRST_AI_CHAT`,
  `DEEP_SCROLL`, `RETURN_VISIT`). Frequency-Cap 1/Session + 3/Woche + 24h
  Cooldown nach Dismiss. BubbleSpeech-Komponente aria-live, ESC-dismissable,
  Framer Motion Animation. Spike-Trigger (5s SECTION_DWELL) fuer
  UX-Validierung mit 5 internen Test-Usern. Feature `proactive-orb-bubble`
  in Registry (defaultEnabled:false, deps:['living-orb']).
  Branch: `feature/v3-pillar3-bubble-spike`. ADR-008.

### Added

- **0.3 GDPR Right-to-Erasure** — `DELETE /api/profile` with hard-delete via
  `auth.admin.deleteUser()`, cascading on profiles + sessions + messages +
  signals. UI confirmation dialog requires typing "LÖSCHEN" exactly. Audit-log
  table `gdpr_erasure_log` (Art. 30 compliance) records all erasure requests.

### Changed (Branding)

- **Repositioning to label-free product** — removed all LR-AI-Hub-specific
  references so the codebase ships as a generic, white-label AI Hub.
- **User-visible (Wave 1):** dropped `BRANDING_LR` preset from
  `src/config/branding.ts`, removed corresponding admin-panel preset card,
  and changed `NEXT_PUBLIC_APP_NAME` from "LR AI Hub" to "AI Hub".
- **Code comments (Wave 2):** scrubbed LR mentions from `next.config.js`,
  `tailwind.config.ts`, `tsconfig.json`, `src/config/sso.ts`.
- **Docs and SQL headers (Wave 3):** replaced "LR AI Hub" with "AI Hub" across
  `ARCHITECTURE.md`, `PROGRESS.md`, `FEATURES.md`, `docs/IMPROVEMENTS.md`,
  `docs/adr/*.md`, `docs/sso-setup-guide.md`, and 11 SQL migration headers.

See [docs/quality/BRANDING-AUDIT-2026-05-01.md](docs/quality/BRANDING-AUDIT-2026-05-01.md)
for the full audit (28 findings, 3 critical).

### Security (Phase 1 — Compliance & Defense-in-Depth)

- **1.1 CSP-Header** — Content-Security-Policy in `next.config.js` with
  whitelisted AI-provider connect-srcs (Anthropic, OpenAI, Google, Groq,
  Mistral) and Supabase. `'unsafe-inline'` as pragmatic compromise for Next.js
  inline scripts; nonce-based CSP deferred to Phase 3.
- **1.5 Rate-Limit-Fallback** — In-memory Map as fallback when Upstash ENV
  vars are absent. Per-instance only — warning log emitted on activation.
- **1.6 Pre-Commit-Hook** — Mistral PAT pattern added to `.husky/pre-commit`
  (`mistral_pat_[a-zA-Z0-9]{32}`).
- **1.7 Cron-Auth-Logging** — `/api/cron` 401 failures are now logged as
  structured JSON (event, ip, user_agent, secret_prefix first 4 chars).
- **1.8 RLS-Cleanup** — `GRANT SELECT ON mentor_signals TO anon` revoked
  (was unintentionally open since migration 00010).
- **1.9 search_path Hardening** — `award_xp()`, `update_login_streak()`, and
  `increment_field()` now have `SET search_path = public, extensions`
  (protection against search-path hijacking).

### Added (Phase 1)

- **1.2 Consent-Banner** — Cookie-free, localStorage-based
  (key `analytics-consent`). Web-Vitals tracking respects the choice.
  Banner has `aria-modal="true"` and focus-trap (A11y compliant).
- **1.3 DPA-Notice in AI-Mentor** — User is informed of external provider
  data processing (GDPR Art. 28 transparency).
- **1.4 ai_chat_messages Retention** — `expires_at` as generated column
  (`created_at + 90 days`). Cleanup via `cleanup_expired_chat_messages()`
  function (manually triggerable; pg_cron schedule optional as DO block).

### Fixed (Phase 0 carry-over)

- **NF01** — `gdpr_erasure_log.deleted_at` UPDATE now has error handling via
  structured logging (audit completeness).
- **F03** — Dead `systemPrompt` field removed from `use-ai-chat.ts` hook
  (field was ignored server-side since 0.5).
- **F05** — `as any` casts removed from `provider-keys.ts`; now imports
  `GeneratedDatabase` from `types.generated.ts`.

### Known Issues

- **L01** (Minor) — `src/lib/api/rate-limit.ts:78`: `inMemoryStore` is
  module-global. Counter state leaks between test contexts in Vitest. Future
  `remaining` assertions will be order-dependent. Fix: export
  `clearInMemoryStore()` test-only helper and add `beforeEach` reset.

### Phase 2 — Funktionale Bugs (2026-05-04)

#### Added

- **2.2 `useOrbChat()`-Hook** — neuer dedizierter Hook kapselt den gesamten
  Nachrichten-Lebenszyklus des Living-Cloud-Mentors (Session-Erstellung,
  Optimistic-UI, ID-Reconciliation, Error-Rollback). Ersetzt simulierten Timeout
  in `chat-panel.tsx`.
  Siehe [docs/features/orb-chat-persistence.md](docs/features/orb-chat-persistence.md).
- **2.2 Konversationskontext an AI-Provider** — `sendMessage` schickt gesamten
  bisherigen Message-State als Kontext an `POST /api/ai/chat` (statt nur die
  aktuelle User-Message). Orb-Antworten sind jetzt sessionbewusst.

#### Changed

- **2.1 Pricing-Layer** — `COST_PER_1K`-Inline-Konstante aus
  `src/app/api/ai/chat/route.ts` extrahiert in `src/lib/ai/pricing.ts`.
  Alle 6 Provider abgedeckt; `AI_MODELS` aus `config.ts` ist nun Single Source
  of Truth fuer Token-Preise.
  Siehe [docs/features/pricing-layer.md](docs/features/pricing-layer.md).
- **2.2 `handleStreamingResponse`** — Signatur um `sessionId?` und
  `userMessageDbId?` erweitert; AI-Antwort wird nach Stream-Ende in
  `ai_chat_messages` persistiert (`onFinish`-Callback).

#### Fixed

- **2.1 Groq + Mistral Abrechnung** — bisher $0-Eintraege in `ai_cost_log` fuer
  Groq und Mistral; jetzt werden korrekte Kosten via `calculateCost()` berechnet
  und in `estimated_cost` geschrieben.
- **2.1 Falsche User-Message bei Persistenz** — `body.messages.find()` durch
  `body.messages.findLast()` ersetzt; persistiert jetzt die neueste User-Message,
  nicht die erste im Array.
- **2.2 Orb-Chat-Persistenz** — `OrbProvider` ignorierte bisher die existierenden
  `ai_chat_sessions`/`ai_chat_messages`-Tabellen vollstaendig (reiner React-State,
  simulierter Timeout). Chat-History ueberlebt jetzt Page-Navigation innerhalb
  einer Browser-Session.

#### Known Issues (Phase 2, offen)

- **Streaming-Token-Tracking** — `promptTokens: 0, completionTokens: 0` im
  Streaming-Pfad fuehrt zu `calculateCost` → `$0`. Streaming-Provider liefern
  Token-Counts nicht im selben Chunk. Fix geplant als `#issue-TBD`.
- **`/api/ai/chat/history`-Route** — Pagination-Stub in `useOrbChat.loadMore()`
  ist ein bewusster No-Op (TODO-Kommentar). Route ist Phase-3-Scope.
