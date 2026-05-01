# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Fixed (Phase 2 — in Bearbeitung)

- TODO: 2.1 Pricing-Layer — `COST_PER_1K` aus `route.ts` extrahiert in
  `src/lib/ai/pricing.ts`; Groq + Mistral korrekt abgerechnet.
  Siehe [docs/features/pricing-layer.md](docs/features/pricing-layer.md).
- TODO: 2.2 Orb-Chat-Persistenz — `OrbProvider` laedt/speichert Messages in
  `ai_chat_sessions` / `ai_chat_messages` via `useOrbChat()`-Hook.
  Siehe [docs/features/orb-chat-persistence.md](docs/features/orb-chat-persistence.md).
