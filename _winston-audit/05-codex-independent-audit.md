# Codex (GPT-5.5) — Independent Audit

> Read-only second-opinion audit, run in parallel to Winston's own sub-agents.
> Codex could not write this file itself (read-only sandbox); Winston persisted it.

**Totals:** 2 Critical · 3 High · 4 Medium · 3 Low

## CRITICAL

- **Hybrid search bypasses RLS, exposes unpublished best practices** — `src/lib/search/hybrid-search.ts:89`
  Authenticated users routed to a service-role RPC; SQL function omits the
  `status = 'published' OR author_id = auth.uid()` filter → leaks unpublished content.
  *(Confirmed independently by Winston's security sub-agent.)*
- **Client-supplied system messages reach providers** — `src/app/api/ai/chat/route.ts:27`
  Route accepts `role:"system"` from client and forwards to LLM providers → prompt injection.
  *(VERIFIED by Winston: validation at line 157 whitelists "system"; line 166 maps & forwards all
  messages. The "rejected" comment only guards a separate top-level `systemPrompt` field — NOT
  system-role array entries. Winston security sub-agent was misled by the comment.)*

## HIGH

- **Streaming cancellation not wired to provider fetches** — `chat/route.ts:280`
  `ReadableStream` has no `cancel()` handler; disconnected clients leave upstream LLM calls
  running (cost leak + resource drain).
- **LLM gate is not a real quota/cost cap** — `chat/route.ts:193`
  Env-flagged, heuristic-only; enforces no budget/quota before expensive provider calls.
- **Mounted Orb uses non-persistent chat path** — `cosmos-companion.tsx:163`
  Dashboard mounts `CosmosCompanion` → `ChatSplitView` using in-memory `OrbProvider` messages
  instead of `useOrbChat()` persistence. Chat history lost on unmount.

## MEDIUM

- **Proactive Orb bubble subsystem built but not mounted** — `use-orb-trigger.ts:25`
- **Orb cannot search the app end-to-end** — `chat-split-view.tsx:142` (no Orb code calls search)
- **Hybrid search feature flag ignores user/org settings** — `api/search/hybrid/route.ts:70` (TODO)
- **Provider test endpoint ignores DB-stored provider keys** — `api/admin/providers/test/route.ts:52`
  Uses `getAIRouter()` instead of `getAIRouterWithDBKeys()`.

## LOW (doc drift)

- README:524 advertises `GET /api/search`; implementation is `POST` only.
- README:207 claims rate-limit tiers `ai/search/write/read`; code defines `ai/search/api/auth`.
- ARCHITECTURE.md:536 says `<AiOrb>` + `<ChatPanel>` mounted; actual is `CosmosCompanion` + `ChatSplitView`.
