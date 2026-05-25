# Winston — Consolidated Audit (Wave 1)

Date: 2026-05-22 · Branch: `feature/winston-audit-improvements-2026-05-22`
Sources: 01 functional · 02 orb · 03 visual/ux/a11y · 04 security · 05 codex (independent)

## Headline answers to Andre's questions

| Question | Verdict |
|---|---|
| Funktioniert alles? | **Fast.** type-check ✅, lint ✅, prod build ✅ (31 pages). 19 unit tests fail — env-only (jsdom/localStorage on Node 26). Playwright can't run (no chromium + no keys). **Zero hard code blockers.** |
| Optisch perfekt? | **7/10.** Strong, modern design system. Held back by real defects: dark-mode non-functional, duplicate `<h1>` per page, contrast failures, 13 empty placeholder component files, reduced-motion gap in JS orb animation. |
| Orb voll integriert? | **Nein.** Mounted everywhere but: no page-context, chat uses a non-persistent dead path, much built-but-unwired code. |
| Orb kann App durchsuchen? | **Nein — gar nicht.** No Orb code calls search; no global search UI exists anywhere in the app. Backend (`/api/search`, hybrid-search) has no client caller. |
| Orb proaktiv? | **Nein (live).** Rule-engine + cooldown fully built & tested but never rendered; bubbles never fire. Only the cosmetic XState idle animation ships. |

## P0 — Security (fix first)

| Sev | Issue | File |
|---|---|---|
| CRITICAL | Hybrid search bypasses RLS via admin client + SQL omits `status='published'` filter → any user reads others' draft/archived best-practices | `lib/search/hybrid-search.ts:89`, `migrations/00021_hybrid_search_setup.sql:51-95` |
| HIGH | Client `role:"system"` messages forwarded to providers → prompt injection (comment misleadingly claims rejection) | `api/ai/chat/route.ts:157,166` |
| HIGH | No streaming `cancel()` → upstream LLM keeps running on client disconnect (cost/resource leak) | `api/ai/chat/route.ts:280` |
| HIGH | No AI cost ceiling; chat/completion lack zod; client `maxTokens`/`temperature` unchecked; `ai_cost_log` written but never enforced | `api/ai/chat`, `api/ai/completion` |
| MED | Rate-limit fails OPEN (in-memory) when Upstash env missing | `lib/api/rate-limit` |
| MED | Webhook uses static-token equality (not constant-time / real HMAC) | `api/webhooks/supabase` |
| MED | Provider test endpoint ignores DB/Vault keys (`getAIRouter` not `getAIRouterWithDBKeys`) | `api/admin/providers/test/route.ts:52` |
| LOW | `gamification/badges` GET no `requireAuth`; `analytics/vitals` unauth+unmetered; cron logs secret prefix | various |

**Confirmed safe:** all 32 tables have RLS; no provider secret in client bundle (anon key only); provider keys in Supabase Vault behind SECURITY DEFINER RPC; `/api/admin/*` role-gated; ownership re-checks on mutations; DOMPurify on user content; privacy-mode hard-routes to Mistral EU.

## P0/P1 — AI Orb (the centerpiece gap)

1. **Search capability missing entirely** (NEW capability, not a fix): build a global search + wire the Orb to it (RAG/tool-use over `/api/search/hybrid`). `SEARCH_NO_RESULT` bubble can never fire today.
2. **Proactive bubbles not delivered**: `useOrbTrigger` + `BubbleSpeech` never imported by mounted `CosmosCompanion`; `bubblePayload` never set/read. Only INACTIVITY + SECTION_DWELL have emitters; one is a hardcoded `'spike-default'` stub. 5 of 8 triggers have no data source.
3. **Chat not persisted in live Orb**: `ChatSplitView` posts `{messages, stream:false}` with no `sessionId`; ADR-005 persistence (fully implemented server-side) is exercised only by the dead `ChatPanel`.
4. **No page context**: `setPageContext` never called; banner stuck on "Dashboard".
5. **Dead/unwired code** (ADRs 005/007/008 built, not delivered): `AiOrb`, `ChatPanel`, `WanderLayer`+`useOrbWander`, `useOrbTrigger`, `BubbleSpeech`. Only ADR-009 idle machine is wired.

## P0/P1 — Visual / UX / A11y

| Pri | Issue |
|---|---|
| P0 | Dark mode non-functional: `theme-provider.tsx` empty, never mounted, 67 files hardcode `bg-white`; `site.ts` advertises `darkMode:true` |
| P0 | Duplicate `<h1>` on every page (shell Header h1 + page h1) — broken outline |
| P0 | Contrast failures: `surface-400` (~1.9:1), `surface-500` (~2.8:1) used as text < WCAG AA |
| P1 | 13 empty 0-byte placeholder components in `shared/*` + providers; each page reinvents skeleton/empty state |
| P1 | Reduced-motion gap: mounted `cosmos-companion.tsx` runs framer-motion without `useReducedMotion()`; orb drag-only, no keyboard reposition |

## Functional / Reliability

- 19 failing tests are env-only (fixable in vitest config: provide localStorage to jsdom under Node 26) — worth fixing so CI is green.
- Playwright needs `npx playwright install chromium` + test env; document or stub.
- Hybrid search flag ignores user/org settings (TODO in code).

## Doc drift (low but should fix for the final docs)

- README `GET /api/search` (actually POST); rate-limit tier names wrong; ARCHITECTURE.md describes old `<AiOrb>`+`<ChatPanel>` mount.

## Scope implication

Per Andre: implement **everything**. This splits into:
- **Track A — Security hardening** (P0 first).
- **Track B — Orb: deliver what's built + add search capability** (the big one).
- **Track C — Visual/UX/a11y polish.**
- **Track D — Test/CI hygiene + doc-drift fixes.**
- **Track E — Innovative improvements** (Wave 2 research → Codex-verified).
- **Final — per-feature md docs + comprehensive user-facing HTML.**
