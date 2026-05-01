# IMPROVEMENTS.md — Verbesserungs-Roadmap AI Hub

> **Stand:** 2026-04-30
> **Quelle:** Konsolidierte Outputs aus 4 parallelen Sub-Agent-Reviews
> (Architect, Researcher, Innovator, Quality) plus 3 abgeschlossene POC-Spikes.
> **Status der App:** Phase 1–7 abgeschlossen, im `_archiv/`. Kein Live-Gang
> ohne Phase 0 dieses Plans.

---

## Lese-Reihenfolge

Dieses Dokument ist als **sequenzielle Roadmap** gemeint. Jede Phase setzt die
vorherige voraus. Phasen 0–3 sind Pflicht vor erneutem Live-Gang, 4–6 sind
Modernisierung, 7–9 sind Innovation.

**Aufwand-Skala:** S = halber Tag, M = 1–3 Tage, L = 1+ Woche.

---

## Phase 0 — Hardening (Merge-Blocker)

Ohne diese Fixes ist die App weder sicher noch DSGVO-konform.

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 0.1 | `requireAuth()` und `middleware.ts` von `getSession()` auf `getUser()` umstellen — Session-Cookie kann sonst gefälscht werden | S | Quality (Critical, OWASP A07) |
| 0.2 | API-Keys verschlüsseln: `ai_providers.api_key_encrypted` ist Plaintext. Lösung: Supabase Vault oder `pgcrypto.pgp_sym_encrypt` mit Decrypt-Wrapper im Read-Pfad | S–M | Architect + Quality (Critical, OWASP A02) |
| 0.3 | DSGVO Right-to-Erasure: `DELETE /api/profile` plus UI-Button im User-Profil | M | Quality (Critical, GDPR Art. 17) |
| 0.4 | Mock-Email-Bug entfernen: `src/app/api/admin/users/route.ts:27` baut Fake-Mails aus `full_name`, statt `auth.admin.listUsers()` zu nutzen | S | Quality (High, OWASP A01) |
| 0.5 | `systemPrompt`-Feld aus Client-Input entfernen oder auf DB-Whitelist beschränken — sonst Prompt-Injection möglich | S | Quality (High, OWASP A03) |
| 0.6 | `ai_cost_log`-INSERT-Policy fixen: aktuell `WITH CHECK (true)`, jeder kann fremde Logs schreiben. Auf `WITH CHECK (user_id = auth.uid())` setzen | S | Quality (High, RLS) |

**Definition of Done Phase 0:** Alle 6 Fixes gemerged, Quality-Re-Audit ohne Critical-Findings.

---

## Phase 1 — Compliance & Defense-in-Depth

Hardening, das die App rechtlich und sicherheitstechnisch absichert.

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 1.1 | CSP-Header in `next.config.js` (`script-src 'self'`, `style-src`, `connect-src`) | S | Quality (High, OWASP A05) |
| 1.2 | Consent-Banner vor Web-Vitals-Tracking — `src/lib/analytics/web-vitals.ts:80-98` sendet ohne Opt-in | M | Quality (Major, GDPR Art. 6/13) |
| 1.3 | DPA-Hinweis im AI-Mentor-UI: "Deine Prompts gehen an Anthropic/OpenAI/Google/Groq/Mistral" | S | Quality (Major, GDPR Art. 28) |
| 1.4 | Retention-Policy für `ai_chat_messages`: `expires_at`-Spalte plus Cron-Cleanup (analog `mentor_signals`) | S | Quality (Major, GDPR Art. 5) |
| 1.5 | In-Memory-Fallback für Rate-Limiting wenn Upstash nicht konfiguriert (`src/lib/api/rate-limit.ts:151-157`) | S | Quality (Medium, OWASP A04) |
| 1.6 | Pre-Commit-Hook: Mistral-API-Key-Pattern ergänzen | S | Quality (Medium) |
| 1.7 | Cron-Auth-Failures strukturiert loggen (`src/app/api/cron/route.ts:16`) — heute stille 401 | S | Quality (Medium, OWASP A09) |
| 1.8 | `GRANT SELECT ON mentor_signals TO anon` entfernen — Migration 00010:104, kosmetisch aber Risiko-Reduktion | S | Quality (RLS) |
| 1.9 | `SECURITY DEFINER`-Funktionen mit `SET search_path = public` versehen: `award_xp()`, `update_login_streak()`, `increment_field()` | S | Quality (RLS Medium) |

---

## Phase 2 — Funktionale Bugs

Echte Defekte, die User wahrnehmen oder das Geschäft beschädigen.

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 2.1 | Pricing-Layer extrahieren: `COST_PER_1K`-Konstante aus `src/app/api/ai/chat/route.ts:217` raus, in neuen `src/lib/ai/pricing.ts`. Groq + Mistral ergänzen — heute werden 2 von 6 Providern (33 %) nicht abgerechnet | M | Architect (Top-3) |
| 2.2 | Orb-Chat-Persistenz: `OrbProvider` lädt/speichert Messages in `ai_chat_sessions`/`ai_chat_messages`. Tabellen existieren, Frontend ignoriert sie aktuell | M | Architect (Top-3, ADR-005) |

---

## Phase 3 — Test-Coverage

Ohne Coverage-Messung sind alle weiteren Refactorings Blindflug.

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 3.1 | `@vitest/coverage-v8` installieren, `npm run test:coverage` aktivieren | S | Quality |
| 3.2 | Tests ergänzen für ungetestete kritische Pfade: `/api/admin/**`, `/api/webhooks/**`, `/api/cron`, `(auth)/callback`, `requireAuth()`, `requireAdmin()`, `provider-keys.ts` mit Cache-Logik | L | Quality |

---

## Phase 4 — Foundation-Updates (low risk)

Pflanzt die Basis für die großen Framework-Sprünge in Phase 6.

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 4.1 | ESLint 8 → 9 mit Flat Config (`eslint.config.mjs`). Wird für Next 16 sowieso Pflicht. Codemod `next-lint-to-eslint-cli` verfügbar | S | Researcher (Welle 1) |
| 4.2 | Zod 3 → 4 evaluieren via Subpath-Import `zod/v4` — 14× schnellere Validierung, 2,3× kleineres Bundle | S | Researcher (Welle 1) |
| 4.3 | Tailwind 3.4 → 4 mit Codemod `@tailwindcss/upgrade`. PostCSS-Plugin: `tailwindcss` → `@tailwindcss/postcss`. CSS-First-Config (`@theme`) | M | Researcher (Welle 2) |
| 4.4 | `@supabase/ssr` 0.5 → 0.10 — Cookie-Fixes | S | Researcher (Welle 2) |

---

## Phase 5 — Architektur-Sanierung

Strukturelle Probleme, die mit jedem Feature schlimmer werden.

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 5.1 | Custom-AI-Router durch AI-SDK `streamText()` ersetzen — eigener `ReadableStream` + Fallback-Chain in `src/lib/ai/router.ts` (~500 LOC) ist Duplikat des SDK | L | Architect + Researcher |
| 5.2 | Monorepo-Migration (pnpm workspaces): `apps/lr/`, `apps/opensource/`, `packages/ai-core/`, `packages/ui/`, `packages/db/` — beendet Drift zwischen den zwei fast identischen Repos | L | Architect (ADR-002) |
| 5.3 | Polymorphe `comments`/`upvotes` durch separate FK-Tabellen ersetzen (`best_practice_comments`, `post_comments` etc.) — heute keine referentielle Integrität | M | Architect (ADR-004) |
| 5.4 | `increment_field()` (Migration 00001:1199) durch typsichere Alternativen ersetzen — dynamisches `EXECUTE %I` mit String-Argumenten ist SQL-Injection-Risiko | S | Architect |
| 5.5 | Denormalisierte Counter (`upvotes_count`, `comments_count`, `views_count`) durch SQL-Views oder materialisierte Sichten ersetzen — Trigger-Sync nicht garantiert | M | Architect |

---

## Phase 6 — Major Framework-Sprünge

High risk, high reward. Codemods decken ~70 % der Breaking Changes.

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 6.1 | **Next.js 14.2 → 16 + React 18.3 → 19.2** (zusammen). Migrations: `middleware.ts` → `proxy.ts`, async `cookies()`/`headers()`/`params`/`searchParams`, Turbopack default, Node 20.9+, `next lint` entfernt, Image-Defaults geändert, Parallel-Routes brauchen `default.js`. Codemod: `@next/codemod` | L | Researcher (Welle 3) |
| 6.2 | **AI SDK v4 → v6**: `UIMessage`/`ModelMessage`-Split, Tool-Definition `parameters` → `inputSchema`, `result` → `output`, SSE-Streaming, ToolLoopAgent, MCP stabil. Codemod: `@ai-sdk/codemod upgrade` | L | Researcher (Welle 4) |

---

## Phase 7 — Performance (möglich nach Phase 6)

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 7.1 | Edge Runtime für Chat-Routes — Spike `spikes/edge-streaming/` validiert die DB-REST-Strategie. Migrations-Plan dort dokumentiert | M | Innovator + Spike 3 |
| 7.2 | Cache Components / PPR aktivieren (`cacheComponents: true`, ersetzt `experimental.ppr` aus älteren Next-Versionen) | S | Innovator |
| 7.3 | React Compiler einschalten — stabil mit Next 16 + React 19.2 | S | Innovator |

---

## Phase 8 — Innovation mit hohem Differenzierungspotenzial

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 8.1 | Mem0 Persistent Memory — KI erinnert sich session-übergreifend. Spike `spikes/mem0/` ist code-fertig, braucht nur Keys (OpenAI + Mem0 Free-Tier) | M | Innovator (Top-3) + Spike 1 |
| 8.2 | Generative UI im Orb (`streamUI` aus AI SDK) — KI streamt React-Komponenten (Cards, Buttons) statt Markdown | M | Innovator |
| 8.3 | Hybrid BM25 + Vector Search für Best Practices — Supabase Hybrid Search (RRF über `ts_rank` + pgvector cosine) oder ParadeDB | M | Innovator |
| 8.4 | LLM-Adaptive Lernpfade im `learn-hub` — nach abgeschlossenem Kurs personalisierter Vorschlag via bestehenden Router | S | Innovator |
| 8.5 | Sqrt-weighted Reputation statt linearer XP in `src/lib/gamification/xp.ts` — fairere Dynamik bei > 500 Usern | S | Innovator |

---

## Phase 9 — Optionale Erweiterungen

| # | Task | Aufwand | Quelle |
|---|---|---|---|
| 9.1 | Voice-Mode für Living Cloud (OpenAI Realtime + WebRTC). Spike `spikes/voice-realtime/` fertig, braucht Realtime Beta-Access | M | Innovator + Spike 2 |
| 9.2 | R3F/WebGL-Orb als progressives Enhancement — Audio-reaktive Wellen-Animation. Fallback: bestehender CSS-Orb | M | Innovator |
| 9.3 | ElectricSQL Offline-First für Best-Practice-Drafts | M | Innovator |

---

## Bewusst ausgeschlossen (nicht updaten/ändern)

| Package / Idee | Grund |
|---|---|
| `zustand@5` | aktuell stable, kein neuerer Major |
| `framer-motion@11` | stabil, keine Major-Breaking-Changes in Sicht |
| `@upstash/ratelimit@2`, `@upstash/redis@1` | produktions-stabil |
| `lucide-react`, `@playwright/test` | aktiv maintained |
| `vitest@4` | bereits aktuell |
| Bun-Runtime für Build/Tests | kein messbarer Vorteil für dieses Projekt |
| View Transitions API | kein Safari-Support, geringer Reward |

---

## Daumenregel zum Abarbeiten

| Bereich | Phasen | Geschätzte Dauer |
|---|---|---|
| Pflicht vor Live-Gang | 0–3 | 2–3 Sprints |
| Modernisierung | 4–6 | 3–5 Sprints |
| Innovation | 7–9 | rolling, parallel zur normalen Entwicklung |

---

## Anhang — POC-Spike-Status (Stand 2026-04-30)

| Spike | Pfad | Code | Live-Test | Verdict |
|---|---|---|---|---|
| Mem0 | `lr-ai-hub/spikes/mem0/` | ✅ kompiliert | ❌ Keys fehlen | INCONCLUSIVE |
| Voice | `lr-ai-hub/spikes/voice-realtime/` | ✅ build clean | ❌ Realtime Beta-Access fehlt | INCONCLUSIVE |
| Edge | `lr-ai-hub/spikes/edge-streaming/` | ✅ live getestet | ⚠️ Vercel-Deploy fehlt | try-more (positiv) |

Detaillierte Verdicts in den jeweiligen `VERDICT.md`-Dateien.

---

## Anhang — Architect-ADR-Skizzen

Aus dem Architect-Review, bisher nicht als formale ADRs persistiert:

- **ADR-001:** AI SDK v4 als einheitliche Provider-Abstraktionsschicht (siehe Phase 5.1)
- **ADR-002:** Monorepo-Strategie für ai-hub und ai-hub-opensource (siehe Phase 5.2)
- **ADR-003:** API-Key-Encryption für `ai_providers`-Tabelle (siehe Phase 0.2)
- **ADR-004:** Polymorphe Entities durch FK-Tabellen-Design ersetzen (siehe Phase 5.3)
- **ADR-005:** Orb-Chat-Session-Persistenz (siehe Phase 2.2)

Bei Phase 5/6-Start: Volle ADRs in `docs/architecture/` schreiben (Architect-Skill `adr-writing`).
