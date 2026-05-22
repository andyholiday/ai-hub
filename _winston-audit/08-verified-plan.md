# Codex-Verified Implementation Sequence

Codex (GPT-5.5) pressure-tested the research against the real code. Key corrections:

- **Chat route does NOT use AI SDK `streamText`** — custom `router.chatStream()` + manual SSE
  (`api/ai/chat/route.ts:271-317`, `lib/ai/router.ts:110-135`). `toDataStreamResponse()`/`useChat`
  cannot be dropped in; would break custom SSE client + sessionId first-chunk.
- **cmdk** is correct package (pacocoursey); not currently a dependency.
- **Cost cap** needs a locked reservation RPC, not plain aggregate (writes are fire-and-forget → race).
- **Vitest** flag: prefer documented `--no-experimental-webstorage`; verify Vitest passes execArgv.
- **Proactive bubbles** verified present & safe to wire behind `proactive-orb-bubble` flag.
- **In-browser search**: dimension mismatch — server pgvector 1536-d vs local 384-d → separate index only.
- **navigateTo** must use strict path allowlist (open-redirect risk).
- **Hybrid-search RLS must be fixed FIRST** — nothing search-related ships before it.

## Sequenced (Codex)

1. Fix hybrid-search security (RLS / `status='published'` filter) — blocks all search work.
2. Wire proactive bubbles into `CosmosCompanion` (no AI-SDK dep) — safe now.
3. **Decide chat architecture fork** (unblocks search/abort/cost): keep custom router+SSE (add abort) OR new AI SDK route.
4. Orb search: implement per chosen fork; search security (1) first; strict-enum navigateTo.
5. Cost cap via locked reservation RPC.
6. cmdk after search security + flag enabled.
7. Local privacy search as separate 384-d client index (do not mix with 1536-d server vectors).
