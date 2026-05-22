# Security & Data-Flow Audit — ai-hub

Date: 2026-05-22 · Framework: OWASP Top 10 (2021) + GDPR data-handling
Scope: RLS, service-role usage, secret exposure, auth, rate-limit/cost, AI surface,
input validation, webhooks. Read-only review — no code modified.

## Findings (sorted by severity)

| Severity | Category | File:line | Issue | Fix |
|----------|----------|-----------|-------|-----|
| **Critical** | A01 Broken Access Control / GDPR | `supabase/migrations/00021_hybrid_search_setup.sql:51-95` + `src/lib/search/hybrid-search.ts:89-100` | `hybrid_search_best_practices` has **no `status='published'` filter** and is invoked via the **service-role admin client** (bypasses RLS). Any authenticated user can retrieve other users' `draft`/`archived` best practices including full `content`. The non-hybrid `match_best_practices` (00003:63) *does* filter `status='published'` — the hybrid path silently regresses that control. Reachable from `POST /api/search/hybrid` and `POST /api/search` (delegates to hybrid when flag on). | Add `WHERE bp.status='published'` to both CTEs and the outer query in the SQL function, OR run search under the user's RLS-scoped client instead of `createAdminClient()`. |
| **High** | A04 Insecure Design (cost) | `src/app/api/ai/chat/route.ts:140-163`, `:224-250` | No zod validation, no cap on `messages.length`, and client-supplied `maxTokens`/`temperature` forwarded unchecked to providers. Only mitigation is 10 req/min. A user can send huge message arrays + large `maxTokens` to amplify provider cost. No per-user/global spend ceiling exists (`ai_cost_log` is written fire-and-forget but never read to enforce a budget). | Add a zod schema: cap `messages` count + total chars, clamp `maxTokens` server-side, clamp `temperature` to [0,2]. Add a daily cost/token ceiling per user backed by `ai_cost_log`. |
| **High** | A04 Insecure Design (cost) | `src/app/api/ai/completion/route.ts:13-40` | Same class: manual checks only, no zod, client-controlled token budget, no cost cap. | Same as above — shared validator + clamp. |
| **Medium** | A07 Auth Failures (rate-limit fail-open) | `src/lib/api/rate-limit.ts:41-45, 218-249` | When Upstash env vars are absent, the limiter falls back to a **per-process in-memory** counter. On multi-instance serverless (Vercel) this is effectively fail-open: aggregate limit = limit × instances. Also applies when Redis errors. The AI/cost ceiling therefore is not reliably enforced in production without Upstash. | Treat missing Upstash in production as a hard config error (fail-closed) or document Upstash as mandatory; alert on `rate_limit_in_memory_fallback`. |
| **Medium** | A08 Integrity (webhook) | `src/app/api/webhooks/supabase/route.ts:13-20` | "Signature verification" is a plain string compare of a **static shared secret** (`x-supabase-signature === SUPABASE_WEBHOOK_SECRET`), not an HMAC over the payload. Comparison is non-constant-time (timing oracle) and the secret is replayable if leaked. Body is also unvalidated. Currently low impact (handler is a no-op TODO), but will become exploitable once handlers act on the payload. | Use HMAC-SHA256 over the raw body with `crypto.timingSafeEqual`; validate payload shape with zod before acting. |
| **Medium** | A09 Logging | `src/app/api/ai/chat/route.ts:257-263`, `src/app/api/search/route.ts:209-213`, `src/lib/api/response.ts` (apiInternalError passes raw `error.message`) | Raw provider/DB error messages are returned to the client (`{ error: message }`). Can leak provider internals, SQL error text, or key-config hints. | Return a generic message to clients; log details server-side only. |
| **Low** | A07 Auth Failures | `src/app/api/gamification/badges/route.ts:20` | GET handler has no `requireAuth` (every sibling gamification/challenge route requires auth). Likely returns the global badge catalogue (low sensitivity) but is inconsistent and unmetered. | Add `requireAuth` for consistency, or confirm intentionally-public. |
| **Low** | A04 Insecure Design | `src/app/api/analytics/vitals/route.ts:55-84` | Unauthenticated, no rate-limit; logs client-supplied web-vital values to server console. Spam/log-flood vector. | Add the `api` rate-limit tier keyed by IP. |
| **Low** | A09 Logging | `src/app/api/cron/route.ts:21-23` | Logs first 4 chars of an attacker's attempted secret. Minor info-leak in logs; benign but unnecessary. | Log only that an attempt occurred, not its prefix. |

## RLS coverage matrix

All 32 application tables have `ENABLE ROW LEVEL SECURITY` with policies. No table left
exposed without policy. Summary of access model:

| Table group | Tables | RLS | Model |
|-------------|--------|-----|-------|
| User content | best_practices, courses, lessons, community_posts, comments, innovation_radar_items | ✅ | author_id = auth.uid() for write; published/own for read; mod/admin override |
| User-private | profiles, ai_chat_sessions, ai_chat_messages, usecase_evaluations, mentor_signals, notifications, user_feature_prefs, user_*_progress, user_challenges, user_badges, user_achievements | ✅ | scoped to owning user_id / auth.uid() |
| Gamification refs | badges, achievements, challenges, learning_paths, learning_path_courses | ✅ | public read, admin write |
| Sensitive/admin | ai_providers, system_prompts, ai_cost_log, feature_flags, audit_logs, gdpr_erasure_log, ai_call_logs | ✅ | `is_admin()`-gated; `ai_providers`/`system_prompts` SELECT admin-only |
| Social | upvotes | ✅ | own |

Notes:
- `is_admin()` / `is_moderator_or_above()` (00001:91-112) are `SECURITY DEFINER`, read
  `profiles.role`. `search_path` hardened in 00019.
- **Caveat:** RLS only protects paths using the anon/SSR client. The `best_practices`
  hybrid-search Critical above bypasses all of this via `createAdminClient()`.

## Service-role (`createAdminClient`) usage — verdict

`createAdminClient()` (uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS) is server-only
(`src/lib/supabase/admin.ts`), never imported by a client component, never behind a
`NEXT_PUBLIC_` var. Used in: all `/api/admin/*` (gated by `requireAdmin`), most
authenticated content/community/learn-hub/challenge routes (each does its own
`requireAuth` + explicit ownership re-check before mutating, e.g. community PUT/DELETE
verify `author_id === userId`), `provider-keys.ts`, `user-prefs.ts`, and
`hybrid-search.ts`. Every reachable use is preceded by an auth check **except**
`hybrid-search` which, although called after `requireAuth`, applies **no row-level
visibility filter** — that is the Critical finding above. All other uses justified.

## Secrets / key handling

- Client bundle only ever sees `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (correct). Service-role key, provider keys, `CRON_SECRET`, `SUPABASE_WEBHOOK_SECRET`
  are server-only env. No secret found imported into a client component.
- Provider keys (ADR-003) stored in **Supabase Vault**; `ai_providers.api_key_encrypted`
  holds a vault UUID reference only. Decrypted server-side via the
  `get_active_provider_keys()` SECURITY DEFINER RPC (00014), fetched with the service-role
  client and cached 60 s in-memory (`provider-keys.ts`). Raw vault UUID never returned to
  callers. Sound.

## Other categories

- **A03 Injection:** No string-concatenated SQL; all DB access via Supabase
  client/parameterised RPCs. XSS sinks (`dangerouslySetInnerHTML` at
  best-practices/[id]:380 and lesson page:359) both wrap content in `sanitizeHtml`
  (DOMPurify allowlist, URI-scheme regex, anchors forced `rel=noopener`). OK.
- **A07 Auth:** `requireAuth`/`requireAdmin` use `getUser()` (server-side JWT round-trip,
  not `getSession`), correct. Role read from JWT `app_metadata.role`, synced from
  `profiles.role` via trigger `sync_role_to_jwt` (00009) — server-controlled,
  not user-writable. Consistent and tamper-resistant.
- **A06 Components:** Not deep-scanned here (separate SCA task); no obvious abandoned dep.
- **AI fallback:** `router.ts` walks a fallback chain on provider failure; privacy-mode
  (ADR-013) hard-routes to Mistral EU and is not overridable by the chain — good. Streaming
  errors are caught and surfaced as an SSE `{error}` event then the stream closes; client
  systemPrompt is intentionally rejected (prompt-injection guard, chat route:30-31, 243).
