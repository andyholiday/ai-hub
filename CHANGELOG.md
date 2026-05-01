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

### Known Issues

- **NF01** (Minor) — `src/app/api/profile/route.ts:188-191`:
  `gdpr_erasure_log.deleted_at` UPDATE has no error handling. If the UPDATE
  fails after a successful `deleteUser()`, the audit record remains with
  `deleted_at = NULL` and is indistinguishable from a failed attempt. Tracked
  for Phase 1.
