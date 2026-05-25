# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Part B — Project Context

## Project: ai-hub

Next.js 14 + React 18 + Supabase AI-Hub-Plattform. Multi-Provider AI-Routing
über sieben Provider: Gemini (Default), Claude, OpenAI, Copilot, Groq,
Mistral, OpenRouter (Aggregator, freier Nvidia-Nemotron-Default).
Production-Stand seit 2026-05-25 reflektiert post-merge alle Wave-1..11
Security-Iter, ADR-016 JWT-DB-Guard, NOP-07 server-side Mentor-Prompt,
Best-Practices CRUD, RAG, Budget-Cap, c2pa-Audit-Trail.

## Layout

- `src/` — App-Code (Next.js App Router)
- `supabase/migrations/` — DB-Schema + RLS-Policies (00001–00037 + 99999)
- `tests/` — Vitest (~924 grün) + Playwright E2E
- `spikes/` — **TABU**: isolierte POCs (mem0, voice-realtime, edge-streaming),
  nicht modifizieren

## Conventions

- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`)
- Branch-Pattern: `feature/<phase>-<slug>` (z.B. `feature/phase-0-app-security`)
- Keine Force-Pushes auf `main`
- Roadmap: `docs/IMPROVEMENTS.md` (9 Phasen)

## Deployment

- Vercel: Production auf https://ai-hub-cyan-five.vercel.app
  (Project `ancreat1985-6630s-projects/ai-hub`), Auto-Deploy auf main-Push.
- Supabase: Project `ziwqxnzsrnyhzhsircqh` (Frankfurt, EU); Migrations via
  `supabase db push --include-all` nach `supabase link --project-ref …`.
- Env-Vars in Vercel-Dashboard; Provider-API-Keys über Admin-UI in
  Supabase Vault statt env (siehe `getAIRouterWithDBKeys`).

## Active Work

Production-Cycle. Nächste Schwerpunkte: Phase-3+ Roadmap aus
`docs/IMPROVEMENTS.md`, orchestriert via Winston-Multi-Agent-System.
