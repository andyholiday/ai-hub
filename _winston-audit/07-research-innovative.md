# Winston Innovative Research — Orb Agentic + Proactive Patterns

**Date:** 2026-05-22  
**Scope:** Next.js 14 AI Hub · Vercel AI SDK v4 · Supabase+pgvector · @xenova/transformers · XState v5 · Framer-Motion

---

## Idea Table

| # | Idea | Reward | Risk | Adoption Barrier | Stack Fit | Verdict |
|---|------|--------|------|-----------------|-----------|---------|
| 1 | AI SDK `streamText` + `tools` for agentic Orb (search, navigate, summarize as server-side tools; `useChat` `toolInvocations` for client rendering of results) | HIGH | LOW | LOW — SDK already in package.json, tools API is stable in AI SDK v4 | Perfect: existing chat route, existing `/api/search`, XState can track tool-call states | **KEEP** |
| 2 | In-browser semantic search via existing `LocalEmbeddingService` + `voy-search` WASM (HNSW, 75 KB gzipped) as a privacy-mode fallback index over pre-fetched best-practice titles/excerpts | HIGH | MEDIUM | LOW — `@xenova/transformers` already running in a Worker; voy-search on npm, MIT | Perfect for privacy-mode users; `LocalEmbeddingService` already has the Worker scaffolding | **KEEP** |
| 3 | Signal-composited proactive nudges: wire existing `useOrbTrigger` + `decideBubble` into `CosmosCompanion` using IntersectionObserver (SECTION_DWELL, CODE_BLOCK_VISIBLE), scroll-depth sensor (DEEP_SCROLL), gamification events (XP_MILESTONE), and Page Visibility API (RETURN_VISIT) — all client-only signals, zero LLM calls | HIGH | LOW | LOW — rule-engine, cooldowns, BubbleSpeech, XState actor all exist; wiring cost only | Perfect: `useMentorSignals` + `useOrbTrigger` + existing trigger types cover all 8 signals | **KEEP** |
| 4 | Generative UI via `streamUI` / RSC render inside Orb chat: search results, radar cards, badge toasts rendered as streamed React components | MEDIUM | MEDIUM | MEDIUM — `streamUI` is AI SDK RSC feature; requires `"use server"` action path; adds RSC complexity to already-complex Orb state | Partial: existing RSC pages but Orb is client-component; bridging requires server action + AI RSC provider | **MAYBE** |
| 5 | `voy-search` WASM + IndexedDB persistence for full client-side RAG (embed best-practices client-side, persist index to IndexedDB, query locally) | MEDIUM | MEDIUM | MEDIUM — cold index-build cost (~4-8 s for 100+ items on first load); index sync strategy needed | Good for privacy mode; overlaps idea #2 but adds persistence across sessions | **MAYBE** |
| 6 | XState v5 spawned child actor for proactive nudge scheduling — replaces setTimeout-soup in `useOrbTrigger` with a proper state machine per trigger type | LOW | LOW | LOW — team already uses XState v5; idle-machine pattern already there | Clean architectural fit but purely a refactor, not a new capability. No new reward vs. wiring the existing hook | **DROP** |
| 7 | EmbeddingGemma (Google, 308 M params, <200 MB RAM) as on-device embedding model replacement for `all-MiniLM-L6-v2` | LOW | HIGH | HIGH — not yet in @xenova/transformers stable release as of May 2026; 200 MB cold download; 384-dim model already sufficient for this corpus size | Would require swapping out `embedding.worker.ts`; no measurable benefit for <10 K doc corpus | **DROP** |
| 8 | Rust/WASM custom vector search (edgevec, hnswlib-wasm) replacing voy-search | LOW | MEDIUM | HIGH — edgevec is a single-author repo with no stable release; hnswlib-wasm requires manual HNSW param tuning | voy-search or even a flat cosine scan (corpus <500 items) is sufficient; no performance case | **DROP** |
| 9 | Voice interface spike (Web Speech API / WebRTC) for Orb interaction | LOW | HIGH | HIGH — spike directory exists (`spikes/`) but is marked TABU; latency, EU privacy constraints, and WASM TTS model size make this net-negative for EU-first platform | Conflicts with privacy-mode constraint; no LLM voice model available via Mistral EU | **DROP** |

---

## Detail: KEEP Ideas

### KEEP-1 — AI SDK Tool-Use: Agentic Orb

**Mechanism:** Add 3 server-side tools to the existing `/api/ai/chat` `streamText` call:
- `searchApp(query: string)` — calls `hybridSearchBestPractices` internally, returns top-5 results
- `navigateTo(page: string)` — returns a structured navigation object the client renders
- `summarizePage(pageContext: string)` — calls the existing page-briefing logic

On the client, `useChat`'s `toolInvocations` renders inline result cards instead of plain text. The Orb's `orbState` switches to `"thinking"` during tool execution via `onToolCall`, back to `"idle"` on result.

**Why unconventional:** Most chat integrations treat the LLM as a pure text box. Giving the Orb structured tool-call awareness makes it an actual in-app agent — the user can type "find me a best practice about TypeScript generics" and get rendered cards, not a paragraph.

**Risk-Level:** LOW — `tools` in `streamText` is stable API in AI SDK v4 (`ai@^4.0.0`). The search route, session persistence (ADR-005), and chat route already exist. No new dependencies.

**Reward-Level:** HIGH — directly closes the audit's "Orb kann App durchsuchen: Nein" gap with minimal new code.

**POC time:** 2-3 hours (add tool definitions to chat route + client `toolInvocations` renderer).

**Refs:** [AI SDK Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) · [Chatbot Tool Calling UI](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-with-tool-calling) · [Multi-Step Loop Control](https://ai-sdk.dev/docs/agents/loop-control)

---

### KEEP-2 — In-Browser Semantic Search (Privacy-Mode Fast Path)

**Mechanism:** When `privacyMode=true`, instead of calling `/api/search` (which calls Mistral EU for embeddings), pre-fetch a lightweight manifest of best-practice titles + excerpts on page load, embed the user query via the already-running `LocalEmbeddingService` Worker, and run cosine similarity in-memory. For corpus <500 items a flat O(n) scan is under 2 ms. For >500 items, add `voy-search` (75 KB gzipped, MIT, HNSW) to get sub-millisecond search.

**Why unconventional:** The Worker and embedding model are already spinning up anyway (for moderation spike). Re-using the same Worker for search removes a full server round-trip for privacy-mode users and makes `SEARCH_NO_RESULT` bubble fire-able without any API call.

**Risk-Level:** MEDIUM — `voy` (tantaraio/voy) has 1.1 K stars but is WIP/no stable release. Mitigation: for <500 items skip voy entirely and use a 15-line flat cosine scan (zero new dependencies).

**Reward-Level:** HIGH — closes "Orb kann App durchsuchen: Nein" for the privacy-mode segment; zero marginal cost; enables `SEARCH_NO_RESULT` bubble.

**POC time:** 1.5 hours (flat cosine scan variant, no voy dependency, proven inside existing Worker).

**Refs:** [Building a Privacy-Preserving RAG System in the Browser](https://www.sitepoint.com/browser-based-rag-private-docs/) · [Scaling AI on a Budget: Moving RAG Embeddings to the Frontend](https://medium.com/@basiak.dariusz/scaling-ai-on-a-budget-moving-rag-embeddings-to-the-frontend-1aa31996a63d)

---

### KEEP-3 — Signal-Composited Proactive Nudges (Zero New Dependencies)

**Mechanism:** Wire 5 currently-dead signal sources into the existing `useOrbTrigger` + `decideBubble` + `BubbleSpeech` chain, then import the hook inside `CosmosCompanion`:

| Signal | Source | Already built? |
|--------|--------|---------------|
| `SECTION_DWELL` | IntersectionObserver on `[data-orb-section]` | Yes — in useOrbTrigger |
| `INACTIVITY` | mousemove/keydown throttle | Yes — in useOrbTrigger |
| `CODE_BLOCK_VISIBLE` | IntersectionObserver on `<pre>` / `[data-code-block]` | Hook exists, emitter missing |
| `DEEP_SCROLL` | scroll event, scrollDepth % threshold | Hook exists, emitter missing |
| `SEARCH_NO_RESULT` | fired from search result callback | Hook exists, emitter missing |
| `XP_MILESTONE` | fired from gamification badge event | Hook exists, emitter missing |
| `RETURN_VISIT` | `localStorage` lastVisit diff on mount | Hook exists, emitter missing |
| `FIRST_AI_CHAT` | fired after first chat session created | Hook exists, emitter missing |

The only missing piece is mounting `useOrbTrigger` in `CosmosCompanion` and passing `bubblePayload` to `BubbleSpeech`. The rule-engine, cooldowns, and copy are all tested and shipped.

**Why unconventional:** Most platforms add new infrastructure for proactive AI. Here, 100% of the infrastructure is already built — the innovation is purely the wiring discipline and the signal-composition pattern (multiple sensor hooks feeding one rule engine).

**Risk-Level:** LOW — pure TypeScript wiring, no new deps, existing tests cover the rule engine.

**Reward-Level:** HIGH — directly closes "Orb proaktiv: Nein (live)" with near-zero new code risk.

**POC time:** 1 hour (import hook, pass payload to BubbleSpeech, add 3 IntersectionObserver emitters).

**Refs:** [AI UX Patterns: Nudges (ShapeofAI)](https://www.shapeof.ai/patterns/nudges) · [Signal-Driven Proactive AI Engagement](https://alhena.ai/blog/smart-nudges-proactive-ai-engagement-ecommerce/)

---

## Recommendation

Spike in this order:

1. **KEEP-3 first** (1 h, zero risk): mount `useOrbTrigger` in `CosmosCompanion`, wire `BubbleSpeech`. Instant visible impact, validates the full proactive pipeline end-to-end before any agentic work.
2. **KEEP-1 second** (2-3 h, low risk): add `searchApp` tool to chat route. This is the most impactful capability gap in the audit and maps directly to existing infrastructure.
3. **KEEP-2 third** (1.5 h, flat cosine variant, zero new deps): add privacy-mode in-browser search. Avoids `voy` WIP status entirely by using a flat cosine scan for the current corpus size.

MAYBE-4 (Generative UI / `streamUI`) is worth a separate spike only after KEEP-1 is shipped and the team has validated whether plain `toolInvocations` card rendering is sufficient. `streamUI` adds RSC complexity that is hard to justify before that baseline exists.

---

## Rejected Candidates (Audit Trail)

| Idea | Rejection Reason |
|------|-----------------|
| EmbeddingGemma (KEEP-7) | Not in stable @xenova release; 200 MB download; no measurable quality gain for <10 K docs |
| Rust/WASM custom vector (KEEP-8) | edgevec is sole-author, no stable release; hnswlib-wasm needs manual tuning; flat scan sufficient |
| Voice interface (KEEP-9) | Existing spike marked TABU; EU privacy constraints; no Mistral EU voice model |
| XState child actor for triggers (KEEP-6) | Pure refactor, zero new capability; adds complexity before wiring even works |
