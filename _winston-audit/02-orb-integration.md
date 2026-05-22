# Orb Integration Audit (Cosmos Companion)

Scope: `src/components/features/ai-orb/*`, `src/lib/orb-rules/*`, `src/lib/orb-state/*`,
`src/lib/search/*`, `/api/ai/chat`, `/api/search`, dashboard layout, ADR-005/007/008/009.
Read-only audit — no code changed.

---

## 1. Integration Map (what is actually mounted & wired)

| Component / Hook | Mounted? | Where | Notes |
| --- | --- | --- | --- |
| `OrbProvider` | YES | `src/app/(dashboard)/layout.tsx:31` | Wraps all `(dashboard)` routes. `initialContext="Dashboard"`. |
| `CosmosCompanion` | YES (the live orb) | `layout.tsx:17-23,56` (lazy, `ssr:false`) | Renders on every dashboard route except `/ai-mentor` (`cosmos-companion.tsx:150`). |
| `ChatSplitView` | YES | `cosmos-companion.tsx:32-35,163` | The chat UI when orb expands. |
| `useOrbIdleState` (XState) | YES | `cosmos-companion.tsx:98` | Gated by `getFeature("orb-idle-state").defaultEnabled` (`:97`). |
| `AiOrb` | **NO (dead)** | exported `index.ts:12`, never rendered | Old orb. Only place that renders `ChatPanel` + `WanderLayer`. |
| `ChatPanel` | **NO (dead via AiOrb)** | `ai-orb.tsx:242` only | The only consumer of `useOrbChat` (persistence). |
| `WanderLayer` / `useOrbWander` | **NO (dead via AiOrb)** | `ai-orb.tsx:252` only | ADR-007 wander layer never reaches the live orb. |
| `useOrbTrigger` | **NO** | defined `use-orb-trigger.ts`, never imported anywhere | Proactive bubble trigger hook is orphaned. |
| `BubbleSpeech` | **NO** | defined `bubble-speech.tsx`, never rendered | Proactive bubble UI is orphaned. |
| `useOrbChat` (ADR-005 persistence) | **NO (dead via ChatPanel)** | only `chat-panel.tsx:102` | Live orb does NOT use it. |
| `useOrbPageState` / `OrbPageState` | PARTIAL | `/ai-mentor` page `:88`; `dashboard-content.tsx:21` | Only sets orb *animation* state, not page context text. |

Page-context: `setPageContext` is **never called anywhere** (grep: only the
provider definition). `pageContext` stays `"Dashboard"` for the whole session.

---

## 2. Verdicts

### Q1 — Is the orb FULLY integrated app-wide? → **PARTIAL**

- Mounted app-wide: YES, via `(dashboard)/layout.tsx:56` on all dashboard routes
  (hidden only on `/ai-mentor`, `cosmos-companion.tsx:150`).
- Knows page context: **NO**. `setPageContext` is never invoked
  (`orb-provider.tsx:124` init only). The chat banner always reads "Dashboard".
  `usePathname` in `cosmos-companion.tsx:79` is used *only* to hide on `/ai-mentor`,
  not to feed context.
- Chat persists to `ai_chat_sessions` / `ai_chat_messages`: **server is ready,
  client is NOT**. The route fully supports it (`/api/ai/chat/route.ts:51-117`
  `resolveSession`/`persistMessage`, ADR-005). BUT the live UI never sends a
  `sessionId` and uses non-streaming:
  - `chat-split-view.tsx:142-146` posts `{ messages, stream: false }` — no
    `sessionId`, so `resolveSession` never runs (it only runs when a `userMessage`
    exists *and* persistence path is hit — actually it does create a session, but
    the metadata `sessionId` is only emitted on the streaming path
    `route.ts:289-299`; non-streaming `:241` returns the result without persisting
    the session id back to the client, and assistant persistence at `:343` is
    gated on `sessionId &&` inside the *stream* helper only).
  - `/ai-mentor` page `:127,:143,:208,:220` also posts `stream: false`, no
    `sessionId`.
  - `useOrbChat` (the hook that *does* send `sessionId` and reconcile IDs,
    `use-orb-chat.ts:123`) is wired only into the dead `ChatPanel`.
  - Net effect: chat history is **not persisted/replayed in the live orb**;
    messages live only in React state (`orb-provider.tsx:126` / `addMessage`).

### Q2 — Can the orb SEARCH the app? → **NO** (confirms Winston's finding)

- Nothing in `ai-orb/`, `orb-rules/`, `orb-state/` imports `/api/search`,
  `hybridSearch`, or `hybrid-search`. Grep for `hybridSearch|/api/search|hybrid-search`
  outside the search module returns only the feature-flag registry entries
  (`src/lib/features/types.ts:25`, `feature-registry.ts:140`).
- `/api/ai/chat/route.ts` does **no RAG, no tool-calling, no retrieval**. It
  validates messages, optional LLM-gate (`:194`), then streams the provider
  (`router.chatStream`, `:301`). The orb cannot read app content.
- There is **no global search UI anywhere**: grep for
  `SearchBar|GlobalSearch|CommandPalette|cmdk` and a `*search*/page.tsx` route both
  return nothing. `/api/search` + `/api/search/hybrid` + `lib/search/hybrid-search.ts`
  exist as backend-only endpoints with no client caller in the app.
- The `SEARCH_NO_RESULT` trigger (`trigger-types.ts:11`, `bubble-copy.ts:24`) has
  copy written but can never fire — there is no search box to emit it, and even the
  trigger hook is unmounted.

### Q3 — Can the orb PROACTIVELY interact? → **NO (in the live orb)** / PARTIAL (engine built but unwired)

- Rule engine is real & complete: `rule-engine.ts:25` `decideBubble` exhaustively
  matches all 8 trigger kinds via `ts-pattern`; cooldown gate
  (`cooldown.ts:77` `canShowBubble`: session-cap, 24h dismiss, 3/week, form-active);
  copy for all 8 triggers (`bubble-copy.ts`). All pure, unit-testable.
- **But the orb that ships (`CosmosCompanion`) never imports `useOrbTrigger` or
  renders `BubbleSpeech`.** `setBubblePayload`/`bubblePayload` exist in context
  (`orb-provider.tsx:65-67,132`) but are never set or read by any rendered UI.
- Which triggers *could* fire if the hook were mounted (`use-orb-trigger.ts`):
  - `SECTION_DWELL` spike timer at 5s (`:48-55`) — fires on a hardcoded
    `'spike-default'` section. **This is a spike stub, not production logic.**
  - `INACTIVITY` 90s timer (`:61-92`) — wired to real DOM events.
  - `SECTION_DWELL` 30s via IntersectionObserver on `[data-orb-section]` (`:95-127`)
    — works only if pages add `data-orb-section` attributes (none found in scope).
  - The other 5 triggers (`CODE_BLOCK_VISIBLE`, `SEARCH_NO_RESULT`, `XP_MILESTONE`,
    `FIRST_AI_CHAT`, `DEEP_SCROLL`, `RETURN_VISIT`) have **no emitter** anywhere —
    copy + types only.
  - Hook has `firedRef` = at most ONE bubble per page mount.
- Idle/animation proactivity DOES work in the live orb: `useOrbIdleState`
  (`cosmos-companion.tsx:98`) drives the XState `idleMachine` (breathing / mini /
  maxi easter-egg / muted, `idle-machine.ts`). This is the only proactive behaviour
  actually reaching the user. It is purely cosmetic (no message, no bubble).
- Data feeding rules: only raw browser events (mousemove/keydown/scroll) and
  `localStorage`. No XP, no search, no AI-chat-count, no return-visit data is wired
  in — so XP_MILESTONE / FIRST_AI_CHAT / RETURN_VISIT can never be constructed.

---

## 3. Gap List

| # | Gap (what's missing) | File(s) | Effort |
| --- | --- | --- | --- |
| G1 | Proactive bubble fully unwired — `useOrbTrigger` + `BubbleSpeech` not mounted in `CosmosCompanion`; `bubblePayload` context never set/read. | `cosmos-companion.tsx`, `use-orb-trigger.ts`, `bubble-speech.tsx`, `orb-provider.tsx:132` | M |
| G2 | Live chat does NOT persist (ADR-005): UI sends no `sessionId`, uses `stream:false`; persistence hook `useOrbChat` only reaches dead `ChatPanel`. | `chat-split-view.tsx:142`, `ai-mentor/page.tsx:127,208`, `use-orb-chat.ts` | M |
| G3 | Orb has zero search/RAG capability; `/api/ai/chat` does no retrieval, no tool-use; no client ever calls `/api/search`. | `api/ai/chat/route.ts`, `lib/search/*` | L |
| G4 | No global search UI in the app at all (no SearchBar/CommandPalette/route). `SEARCH_NO_RESULT` trigger can never fire. | (missing) | L |
| G5 | Page context never updated — `setPageContext` never called; banner stuck on "Dashboard". | `orb-provider.tsx`, all pages | S |
| G6 | Dead component `AiOrb` (+ its `ChatPanel`, `WanderLayer`/`useOrbWander`, ADR-007 wander) shipped but never rendered. | `ai-orb.tsx`, `chat-panel.tsx`, `wander-layer.tsx`, `use-orb-wander.ts` | S (delete) |
| G7 | 5 of 8 triggers have no emitter (CODE_BLOCK_VISIBLE, XP_MILESTONE, FIRST_AI_CHAT, DEEP_SCROLL, RETURN_VISIT); SECTION_DWELL needs `[data-orb-section]` attrs not present. | `use-orb-trigger.ts`, pages | M |
| G8 | Spike stub still in place: hardcoded 5s `'spike-default'` SECTION_DWELL trigger. | `use-orb-trigger.ts:48-55` | S |
| G9 | Chat history pagination unimplemented — `/api/ai/chat/history` endpoint does not exist; `loadMore` is a no-op, `hasMore` always false. | `use-orb-chat.ts:67-81` | M |

---

## 4. TODO / Stub / "Phase 3" / "Future Work" Inventory (orb subsystem)

- `use-orb-chat.ts:11-12` — "Supabase Realtime-Sync (Future Work)", "localStorage-Session-Bindung (Future Work)".
- `use-orb-chat.ts:67` — "Phase 3: isLoadingMore and hasMore will be driven by /api/ai/chat/history".
- `use-orb-chat.ts:78` — "TODO: Phase 3 — implement /api/ai/chat/history endpoint with paginated query" (loadMore no-op).
- `use-orb-trigger.ts:9,48-55` — Spike trigger: hardcoded 5s `'spike-default'` SECTION_DWELL "fuer initiale Validierung".
- `use-orb-trigger.ts:17` — test override hook `__SPIKE_TRIGGER_DELAY_MS__`.
- `api/ai/chat/route.ts:201` — "TODO Wave 4 P2.2 (Settings/Subscription): tier durch echte Subscription-Logik ersetzen" (tier hardcoded free/premium by role).
- `api/ai/chat/route.ts:348-350` — "TODO(Wave-5): privacyMode aus user_feature_prefs server-side resolve"; `PRIVACY_MODE_PLACEHOLDER_WAVE5 = false` hardcoded.
- `api/ai/chat/route.ts:379-380` — `userMessageDbId` "reserviert fuer kuenftige Reply-Threading-Logik" (unused, `void`).
- `api/search/hybrid/route.ts:72` — "TODO(Wave-3, P2.2): user/org-Prefs aus user_feature_prefs pruefen statt nur defaultEnabled".
- `lib/search/hybrid-search.ts:25` — comment: ai_call_logs in migration 00021 but "noch nicht in den" (types) — schema/type drift note.

Dead/unused orb code: `AiOrb` (`ai-orb.tsx`), `ChatPanel` (`chat-panel.tsx`),
`WanderLayer` (`wander-layer.tsx`) + `useOrbWander` (`use-orb-wander.ts`),
`useOrbTrigger` (`use-orb-trigger.ts`), `BubbleSpeech` (`bubble-speech.tsx`) — all
unreferenced by the mounted `CosmosCompanion`.

---

## 5. ADR Promise vs Implementation

- **ADR-005 (chat persistence):** Server route implements it; **client never uses
  it in the live orb** → effectively not delivered to users.
- **ADR-007 (living orb v2 / wandering layer):** Implemented in `useOrbWander` +
  `WanderLayer`, but only consumable via dead `AiOrb`; the shipped `CosmosCompanion`
  uses drag-to-dock, not the wander layer → **not delivered**.
- **ADR-008 (proactive bubble rule engine):** Engine, cooldown, copy, types all
  built and tested; **never mounted** (no `useOrbTrigger`/`BubbleSpeech` in live
  orb) → **not delivered**. Spike trigger still present.
- **ADR-009 (idle state machine):** Implemented AND wired into the live orb
  (`cosmos-companion.tsx:98`, feature-flagged) → **delivered** (the one proactive
  feature that actually ships).
