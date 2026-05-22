# Research: Established Options — Wave 1 Gaps
Date: 2026-05-22 | Researcher sub-agent

Stack baseline: Next.js 14 App Router, `ai` ^4.0.0, `@ai-sdk/anthropic|openai|google` ^1.0.0,
Supabase, `@upstash/ratelimit` ^2.0.8, Vitest ^4.0.18, Node 26.

---

## Topic 1 — AI SDK v4 Tool-Calling: Wiring the Orb to hybrid-search + navigation

### Problem
`CosmosCompanion` / `ChatSplitView` has no tool-use. The Orb must be able to
call `/api/search/hybrid` and emit a navigation intent — without replacing the
existing custom SSE stream in `api/ai/chat/route.ts`.

### Recommendation: Native AI SDK `streamText` + `tool()` — no extra library

`ai` v4 ships `streamText` with first-class `tools` support. The project already
uses it for the custom SSE path, so adding tools costs zero new dependencies.

**Pattern (version-pinned to `ai` ^4.0.0 / `@ai-sdk/anthropic` ^1.0.0):**

```typescript
// NEW: /src/app/api/ai/orb/route.ts  (separate from mentor-chat)
import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { hybridSearchBestPractices } from '@/lib/search/hybrid-search';

export async function POST(req: Request) {
  const { messages, pageContext } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-haiku-20241022'),      // cheapest capable model
    messages,
    abortSignal: req.signal,                              // Topic 3 fix included
    maxSteps: 3,                                          // prevent infinite loops
    tools: {
      searchApp: tool({
        description: 'Search the AI Hub knowledge base for best practices',
        inputSchema: z.object({
          query: z.string().describe('What to search for'),
        }),
        execute: async ({ query }, { abortSignal }) => {
          return hybridSearchBestPractices(
            { query, topK: 5 },
            null,                                         // userId available via closure
          );
        },
      }),
      navigateTo: tool({
        description: 'Navigate the user to a page in the app',
        inputSchema: z.object({
          path: z.enum(['/dashboard', '/best-practices', '/tools', '/community']),
          reason: z.string(),
        }),
        // no execute: client-side tool, model emits intent, client handles it
      }),
    },
  });

  return result.toDataStreamResponse();   // useChat-compatible data protocol
}
```

Client side uses `useChat` from `ai/react` (already in the project). The
`navigateTo` tool has no `execute` — AI SDK passes it through as a tool-call
part; the client reads `data` and calls `router.push(path)`.

**Integration sketch for existing stack:**
1. Add `/api/ai/orb/route.ts` above (new route, does not touch mentor-chat).
2. In `CosmosCompanion`, replace custom SSE fetch with `useChat({ api: '/api/ai/orb' })`.
3. In `onToolCall` callback of `useChat`, handle `navigateTo` client-side.
4. Pass `pageContext` from `setPageContext` (already in Zustand) as initial message context.
5. `SEARCH_NO_RESULT` bubble can now fire based on tool result length.

**Why not a third-party agent library (LangChain, Mastra, etc.)?**
The project is already on the AI SDK. Adding an agent framework would duplicate
routing, streaming, and provider abstraction that `ai` v4 already provides.
LangChain.js (55k stars, MIT) is the plan-B if multi-provider agent graphs are
needed in Wave 2, but it is over-kill here.

**Risks:**
- `hybridSearchBestPractices` uses admin client with known RLS bypass (P0 security
  audit item). Fix that first before exposing it via Orb tool.
- `navigateTo` path enum must stay in sync manually — no compile-time guard.
- `maxSteps: 3` hard cap prevents runaway tool loops but limits chained reasoning.

**Official docs:** https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling

---

## Topic 2 — Global Command Palette / Search UX

### Options

| Library | Stars (May 2026) | Last Release | License | Maintained |
|---|---|---|---|---|
| `cmdk` ^1.1.1 | 12.6k | 2025-03-14 | MIT | Active (now under `dip` org) |
| `kbar` ^0.1.0 | 5k | 2023-10-xx | MIT | Slow (last commit 2023) |
| shadcn/ui `<Command>` | (uses cmdk) | Ongoing | MIT | Active (wraps cmdk) |
| Custom via Radix `<Dialog>` | n/a | n/a | MIT | n/a |

### Recommendation: `cmdk` ^1.1.1 via `shadcn/ui` Command primitive

**Why cmdk over kbar:** kbar has no release since 2023; cmdk has 2025 activity,
uses React 18 `useSyncExternalStore`, and is the foundation for shadcn/ui's
`<Command>` which many Next.js teams adopt. The project already uses Tailwind
+ Radix-style components, so the visual integration is minimal.

`kbar` offers a more opinionated "action registry" pattern that is attractive
for large admin dashboards but is effectively unmaintained.

**Integration sketch:**

```tsx
// src/components/ui/command-palette.tsx
'use client';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // ⌘K / Ctrl+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounced hybrid search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch('/api/search/hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 5 }),
      });
      const json = await res.json();
      setResults(json.data ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return null;

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="App search">
      <Command.Input value={query} onValueChange={setQuery} placeholder="Search…" />
      <Command.List>
        {isPending && <Command.Loading />}
        {results.map((r) => (
          <Command.Item
            key={r.id}
            onSelect={() => {
              startTransition(() => router.push(`/best-practices/${r.id}`));
              setOpen(false);
            }}
          >
            {r.title}
          </Command.Item>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
```

Mount `<CommandPalette />` in the root layout (client component). No App Router
conflict — `Command.Dialog` renders in a portal.

**Risks:**
- `/api/search/hybrid` is currently POST — the audit notes the README wrongly
  documents it as GET, but the implementation is POST. The sketch above is correct.
- The admin-client RLS bypass in `hybrid-search.ts` must be fixed before
  exposing results to any user via this palette.
- cmdk moved from `pacocoursey` to the `dip` GitHub org in 2025 — update
  import paths if you pin to a fork.

**Official docs:** https://cmdk.paco.me / https://github.com/dip/cmdk

---

## Topic 3 — Streaming Cancellation with AbortSignal

### Problem
`handleStreamingResponse` in `api/ai/chat/route.ts` (line 280) uses a manual
`ReadableStream` with a `for await` loop. If the client disconnects, the loop
keeps running, consuming LLM tokens and route-handler CPU.

### Recommendation: Forward `req.signal` to `streamText` + switch to `toDataStreamResponse()`

**No new library needed.** The AI SDK `streamText` accepts `abortSignal` and
stops the upstream LLM call when the signal fires. The `onAbort` callback
handles cleanup (e.g. persisting the partial assistant message to the session).

**Pattern for the existing route:**

```typescript
// In api/ai/chat/route.ts, replace handleStreamingResponse with:
import { streamText, tool } from 'ai';

const result = streamText({
  model: getModelForRouter(router),
  messages: convertToAISDKMessages(messages),
  abortSignal: req.signal,          // client disconnect cancels the LLM call
  onAbort: async ({ steps }) => {
    // Persist whatever was generated before cancellation
    const partial = steps.flatMap(s => s.text).join('');
    if (sessionId && partial) {
      void persistMessage(sessionId, 'assistant', partial);
    }
  },
  onFinish: async ({ text, usage }) => {
    logTokenUsage(provider, model, usage, userId);
    if (sessionId) void persistMessage(sessionId, 'assistant', text);
  },
});

return result.toDataStreamResponse();
```

**Important compatibility note (confirmed in AI SDK docs and GitHub issues):**
`abortSignal` cancellation is **not compatible with stream resumption**
(`resume: true` in `useChat`). The project does not currently use stream
resumption, so this is safe to add now. Document it as a constraint for Wave 2.

**Migration cost:** The current `handleStreamingResponse` is a manual SSE
encoder (~120 lines). Replacing it with `streamText` + `toDataStreamResponse()`
eliminates that code, makes C2PA manifest and session-persistence flow into
`onFinish`, and the client's existing SSE reader continues to work because
`toDataStreamResponse()` emits the same `data:` protocol.

**Risks:**
- The custom `metadata.sessionId` first-chunk pattern (line 289–299) must move
  into `onFinish` / HTTP response headers or a separate pre-flight endpoint.
- Node.js `req.signal` fires on client TCP close; in serverless Vercel deployments
  the function continues running until its timeout even after signal fires unless
  the LLM client respects it. All `@ai-sdk/anthropic|openai|google` providers
  do propagate the abort to their underlying `fetch` calls.

**Official docs:** https://ai-sdk.dev/docs/advanced/stopping-streams

---

## Topic 4 — AI Cost/Budget Enforcement

### Problem
`ai_cost_log` is written (fire-and-forget) but never read for enforcement.
A single user can exhaust the monthly LLM budget. No per-user ceiling exists.

### Recommendation: Postgres-native pre-request guard using `ai_cost_log`

**No new library needed.** The existing Supabase client and the `ai_cost_log`
table are sufficient. The pattern is a pre-flight aggregate query before each
`streamText` call.

**Pattern (add to `api/ai/chat/route.ts` before the streaming response):**

```typescript
// --- Cost guard (add after rate-limit, before streamText) ---
const MONTHLY_USER_COST_LIMIT_USD = Number(process.env.USER_MONTHLY_COST_LIMIT_USD ?? '1.00');

async function checkUserBudget(userId: string): Promise<{ allowed: boolean; spent: number }> {
  const supabase = createAdminClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('ai_cost_log')
    .select('estimated_cost')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const spent = (data ?? []).reduce((sum, r) => sum + Number(r.estimated_cost), 0);
  return { allowed: spent < MONTHLY_USER_COST_LIMIT_USD, spent };
}

// In POST handler:
const { allowed, spent } = await checkUserBudget(userId);
if (!allowed) {
  return NextResponse.json(
    { error: { code: 'BUDGET_EXCEEDED', message: 'Monthly AI budget reached.', spent } },
    { status: 429 }
  );
}
```

**Why not a third-party cost-control service (Helicone, LangFuse, etc.)?**
They are valuable for observability but add external dependencies, SaaS costs,
and data egress. The project already has the schema and Supabase RLS. A
Postgres aggregate query is < 1ms on a table with < 100k rows/month.

**Soft-cap degradation pattern (recommended for UX):**
Instead of hard-blocking at `$1.00`, downgrade the model at `$0.80`:

```typescript
const model = spent > MONTHLY_USER_COST_LIMIT_USD * 0.8
  ? anthropic('claude-3-5-haiku-20241022')    // cheap fallback
  : anthropic('claude-3-5-sonnet-20241022');   // normal
```

**Risks:**
- Fire-and-forget write means a burst of concurrent requests can all pass the
  guard before any cost is logged. Mitigate with Upstash token-bucket per user
  (already installed) as a concurrent-request guard, or use a Postgres
  function with `SELECT FOR UPDATE` on a `user_budget` row.
- `estimated_cost` rounding (`Math.round(x * 1_000_000) / 1_000_000`) means
  sub-microdollar calls are effectively free; acceptable at current model prices.
- No UI feedback today — the client needs a `BUDGET_EXCEEDED` error handler.

**Official refs:**
- https://supabase.com/docs/reference/javascript/select (aggregate pattern)
- https://ai-sdk.dev/docs/ai-sdk-core/settings (maxTokens server-side)

---

## Topic 5 — Vitest jsdom localStorage Under Node 26

### Problem
19 unit tests fail because Node 25+ ships a native Web Storage API. When Node's
`globalThis.localStorage` exists, jsdom's mock is not applied, and test
assertions against `localStorage.getItem` throw or return `undefined`.

### Recommendation: Add `execArgv: ['--no-webstorage']` to `vitest.config.ts`

**Config-only fix — no new dependencies, no test rewrites.**

Current `vitest.config.ts` (line 7-8):
```typescript
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: ["./tests/setup.ts"],
  // ADD THIS:
  execArgv: ['--no-webstorage'],
```

`--no-webstorage` is a Node.js CLI flag that disables the native Web Storage
API. With it absent from `globalThis`, jsdom provides its own
`localStorage`/`sessionStorage` mock as before Node 25.

**Confirmed working:** Vitest GitHub issue #8757 (May 2025) and zenn.dev
article by mima_ita confirm this fixes the issue on Node 25 and 26.

**Alternative (not recommended for CI):** `NODE_OPTIONS=--no-webstorage` env var
works but is invisible to future maintainers and can be accidentally unset.

**Risks:**
- `--no-webstorage` disables Node's native storage globally for the test worker
  process — no impact outside tests.
- If any test intentionally exercises Node's native Web Storage (none do in this
  project), those would need `@vitest/worker` level isolation instead.
- This flag was introduced in Node 22.13 / 23.x. Node < 22 ignores it silently,
  so the config remains backward-compatible.

**Source:** https://github.com/vitest-dev/vitest/issues/8757

---

## Summary Table

| Topic | Recommended approach | New deps | Effort |
|---|---|---|---|
| 1. Orb tool-calling | `streamText` + `tool()` from `ai` ^4 | none | Medium |
| 2. Command palette | `cmdk` ^1.1.1 (or shadcn Command) | `cmdk` (1 pkg) | Small |
| 3. Streaming cancel | `abortSignal: req.signal` + `onAbort` | none | Small |
| 4. Cost cap | Postgres aggregate pre-flight in existing route | none | Small |
| 5. Vitest Node 26 | `execArgv: ['--no-webstorage']` in config | none | Trivial |
