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

### Known Issues

- **NF01** (Minor) — `src/app/api/profile/route.ts:188-191`:
  `gdpr_erasure_log.deleted_at` UPDATE has no error handling. If the UPDATE
  fails after a successful `deleteUser()`, the audit record remains with
  `deleted_at = NULL` and is indistinguishable from a failed attempt. Tracked
  for Phase 1.
