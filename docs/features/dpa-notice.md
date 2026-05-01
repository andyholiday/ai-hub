# DPA Notice (AI-Mentor)

## Status

Active

## Owner

knowledge-agent (stub), developer-agent (implementation)

## Summary

Inline notice in the AI-Mentor UI informing users that their prompts are
processed by external AI providers (Anthropic, OpenAI, Google, Groq, Mistral).
Required under GDPR Art. 28 (processor transparency).

## Usage

The notice renders inside `src/app/(dashboard)/ai-mentor/page.tsx`. It is
static text — no user interaction required, no dismissal state stored.

## Scope

Covers all providers currently routed through `src/lib/ai/router.ts`:
Anthropic, OpenAI, Google, Groq, Mistral.

## Tests

No dedicated unit tests (static UI element). Covered implicitly by
Playwright smoke tests when they run against the AI-Mentor route.

## History

2026-05-01 — Phase 1, Wave 1. Initial implementation (task 1.3).
GDPR Art. 28 transparency requirement.

## Related Decisions

No formal ADR. Compliance requirement from Phase 1 roadmap entry 1.3 in
[docs/IMPROVEMENTS.md](../IMPROVEMENTS.md).
