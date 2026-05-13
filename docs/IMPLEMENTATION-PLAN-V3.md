# IMPLEMENTATION-PLAN-V3.md

> **AI Hub v3 — Umsetzungsplan**
> **Stand:** 2026-05-07
> **Quelle:** [`docs/pitch-deck-v3.html`](pitch-deck-v3.html) · 6 Subagents · 2 Teams (Stress-Test + New-Direction) · 3 Architects/Explore
> **Methodik:** CORE-R · Multi-Agent-System (Winston-Orchestrator)

---

## 0. Executive Summary

Nach Stress-Test der v2-Picks (2 KILL · 3 DOWNGRADE) liefert v3 eine ehrliche
Strategie in 4 Säulen mit insgesamt **12 Patterns**, die in **4 Wellen**
ausgerollt werden. Erst-Spike ist die **Feature-Registry** (Säule 2),
parallel zum **Bubble-Spike** (Säule 3.2 Layer) für UX-Validierung.

| Säule | Patterns | Aufwand gesamt | Hebel |
|---|---|---|---|
| 01 · Autonome Plattform (LLM-Diät) | 3 (Hybrid Search · LLM-Gate · Encoder-Only) | M+L | −68 % bis −97 % LLM-Cost |
| 02 · Modulares Toggle-System | 3 (Manifest · Settings-UX · Dependency-Graph) | S+M | Bundle-Speed, Feature-Kontrolle |
| 03 · Living Orb v2 | 3 Layer (Wandern · Bubble · Idle-States) | S+M+L | Marken-Effekt, 0 LLM-Calls |
| 04 · Privacy Mode (Light) | 3 (Local Embeddings · EU-Bedrock · C2PA Audit) | S+M | DSGVO-by-default Toggle |

**Gesamtaufwand:** 8–12 Entwicklerwochen sequenziell · 5–7 Wochen mit
Multi-Spawn-Parallelisierung.

---

## 1. Vorbedingungen (Blocking)

| # | Bedingung | Quelle | Status |
|---|---|---|---|
| 1 | Phase 0 Hardening (6 Tasks) gemerged · Quality-Re-Audit ohne Critical | [`docs/IMPROVEMENTS.md`](IMPROVEMENTS.md) Phase 0 | TODO |
| 2 | Phase 1.1 (CSP-Header) + 1.2 (Consent-Banner) | Phase 1 | TODO |
| 3 | Phase 2.1 (Pricing-Layer extrahiert in `src/lib/ai/pricing.ts`) | Phase 2 | ✓ erledigt |
| 4 | Phase 3.1 (`@vitest/coverage-v8` aktiv) — Coverage-Baseline | Phase 3 | TODO |
| 5 | `feature_flags`-Tabelle Schema validiert gegen Toggle-System | Migration `00002_feature_flags.sql` | Prüfen |
| 6 | **ADR-Numerierung bereinigt** — siehe §10 | — | **TODO** |

**Wichtig:** Wenn Phase 0 nicht gemerged ist, muss erst Phase 0 abgeschlossen
werden. Keine v3-Patterns vor Phase-0-Quality-Re-Audit.

> **Hinweis 2026-05-07 (Wave 0):** Migrations-Nummern wurden auf 00020+ verschoben, da 00012–00016 bereits in der Codebase vergeben sind (s. `supabase/migrations/`). Pre-Condition #4 (`@vitest/coverage-v8`) erledigt in `feature/v3-wave0-prep`.

---

## 2. Codebase-Touch-Points (Inventar)

Aus Explore-Agent-Scan (Mai 2026 Stand):

### 2.1 AI / LLM-Schicht
- [`src/lib/ai/router.ts`](../src/lib/ai/router.ts) — Multi-Provider-Router (Claude, OpenAI, Gemini, Groq, Mistral, Copilot)
- [`src/lib/ai/pricing.ts`](../src/lib/ai/pricing.ts) — `calculateCost()`, `getPricingRates()`
- [`src/lib/ai/config.ts`](../src/lib/ai/config.ts) — `AI_MODELS` Map mit Pricing
- [`src/lib/ai/embeddings.ts`](../src/lib/ai/embeddings.ts) — OpenAI `text-embedding-3-small` (1536-d) + FNV-1a Fallback
- [`src/app/api/ai/chat/route.ts`](../src/app/api/ai/chat/route.ts) — Streaming Chat mit Session-Persistenz (ADR-005)
- [`src/lib/api/rate-limit.ts`](../src/lib/api/rate-limit.ts) — Upstash + In-Memory Fallback
- [`src/lib/validators/`](../src/lib/validators/) — 12+ Zod-Schemas
- [`src/lib/utils/sanitize.ts`](../src/lib/utils/sanitize.ts) — DOMPurify

### 2.2 Living Cloud Orb (Existing)
- [`src/components/features/ai-orb/ai-orb.tsx`](../src/components/features/ai-orb/ai-orb.tsx) — Main Orb (64 px, 7 States)
- [`src/components/features/ai-orb/orb-provider.tsx`](../src/components/features/ai-orb/orb-provider.tsx) — React Context, ChatMessage[] History
- [`src/components/features/ai-orb/chat-panel.tsx`](../src/components/features/ai-orb/chat-panel.tsx) — Dynamic Import (SSR: false)
- [`src/components/features/ai-orb/orb-particles.tsx`](../src/components/features/ai-orb/orb-particles.tsx)
- [`src/components/features/ai-orb/use-orb-chat.ts`](../src/components/features/ai-orb/use-orb-chat.ts)
- [`src/components/features/ai-orb/use-orb-page-state.tsx`](../src/components/features/ai-orb/use-orb-page-state.tsx)
- **Animation:** Framer Motion `v11.5.0` (Upgrade auf `12.x` empfohlen für `useScroll`+`useSpring`)

### 2.3 Search & Embedding
- [`src/app/api/ai/search/route.ts`](../src/app/api/ai/search/route.ts) — pgvector Similarity-Suche
- pgvector HNSW-Index auf `best_practices.embedding`
- GIN/Trigram-Indexes auf Tags + Title (FTS)

### 2.4 Settings & Stores (mostly Stubs)
- [`src/stores/`](../src/stores/) — `chat-store.ts`, `notification-store.ts`, `ui-store.ts` sind **0-Zeilen-Stubs** (perfekt für v3)
- [`src/hooks/`](../src/hooks/) — `use-local-storage.ts`, `use-debounce.ts` etc. ebenfalls leer

### 2.5 Supabase-Schema (relevante Tabellen)
| Tabelle | Migration | Status für v3 |
|---|---|---|
| `profiles` | `00001_initial_schema.sql` | bestehend, evtl. ergänzen |
| `feature_flags` | `00002_feature_flags.sql` | **erweitern** für Toggle-Strategien |
| `ai_chat_sessions`, `ai_chat_messages` | bestehend | unverändert |
| `ai_cost_log` | bestehend | erweitern (LLM-Gate-Logging) |
| `user_feature_prefs` | **NEU** | für Pattern 2.2 |
| `ai_call_logs` | **NEU** | für Pattern 1.1 + 1.2 |
| `audit_logs` | **NEU** | für Pattern 4.3 (C2PA) |

### 2.6 Tests & CI
- 19 Vitest-Files unter `tests/` und `src/__tests__/`
- 6 Playwright-Specs unter `tests/e2e/`
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — Lint → Type-Check → Test → Build (Sequential, Fail-Fast, Node 20)
- Husky aktiv (`prepare: "husky"`)

### 2.7 Stack-Versionen aktuell
- Next.js `14.2.35` · React `18.3.0` · TypeScript `5.6.0`
- Tailwind `3.4.0` · Framer Motion `11.5.0` · Zustand `5.0.0`
- Supabase JS `v2.45.0` · Zod `3.23.0`
- ESLint mit `next/core-web-vitals`, `next/typescript`

---

## 3. Patterns-Übersicht (12 Patterns)

### Säule 1 — Autonome Plattform
- **P1.1 Hybrid Search** — Typesense 0.26 + pgvector gte-small Re-Rank · L · −97 % Search-Cost
- **P1.2 LLM-Gate** — FastText/DistilBERT-Classifier vor jedem LLM-Call · M · −68 % LLM-Calls
- **P1.3 Encoder-Only-Microservice** — ModernBERT + Detoxify + NER als ONNX · L · −77 % Mod-Cost

### Säule 2 — Modulares Toggle-System
- **P2.1 Feature-Registry** — TypeScript Single Source of Truth · S · Fundament
- **P2.2 User-Settings-UX** — `useOptimistic` + Server Action + Supabase RLS · M
- **P2.3 Dependency-Graph** — `cascade-off` / `warn-and-allow` / `block` Strategien · M

### Säule 3 — Living Orb v2
- **P3.2 Bubble-Spike** — Rule-Engine, 8 Trigger, kein LLM, max 1/Session · S–M (Spike zuerst!)
- **P3.3 Idle-State-Machine** — XState v5, Micro/Mini/Maxi-Layer, Tageszeit-aware · M
- **P3.1 Wandernder Orb** — Motion v12 useScroll+useSpring + Intersection Observer · M–L

### Säule 4 — Privacy Mode (Light)
- **P4.1 Local Embeddings** — `@xenova/transformers@^2.17.2 (v3 latest; v4 API laeuft unter @huggingface/transformers, pending stabilization)` + all-MiniLM-L6-v2 (22 MB) · M
- **P4.2 EU-Bedrock Provider** — `@aws-sdk/client-bedrock-runtime` eu-central-1 · S–M
- **P4.3 C2PA Audit-Log** — fire-and-forget, Art. 50 Transparenz-Kennzeichnung · S

---

## 4. Wave-Plan · 4 Wellen

### Wave 1 — Fundament (Tag 1–2)
| # | Pattern | Aufwand | Branch |
|---|---|---|---|
| 1 | **P2.1 Feature-Registry** | S · halber Tag | `feature/v3-feature-registry` |

**Ziel:** Single Source of Truth für alle Toggles. Blockt alle weiteren Patterns.

**DoD:** TypeScript-Registry vorhanden, alle Features typisiert, Migration für
`feature_flags.toggle_strategy`-Spalte gemerged, Unit-Test grün.

---

### Wave 2 — Spike + Cost-Wins (Woche 1–2, parallel)

| # | Pattern | Aufwand | Branch | Branch-Basis |
|---|---|---|---|---|
| 2a | **P3.2 Bubble-Spike** | S · 1–2 Tage | `feature/v3-pillar3-bubble-spike` | `feature/v3-feature-registry` |
| 2b | **P1.3 Encoder-Only Quick-POC** | S · 1 Tag | `feature/v3-encoder-only-poc` | `main` |
| 2c | **P1.1 Hybrid Search Setup** | M · 3–5 Tage | `feature/v3-hybrid-search` | `feature/v3-feature-registry` |

**Ziel:** UX-Akzeptanz validieren (P3.2) und Cost-Wins früh sichtbar machen.

**Spike-Review-Gate** für P3.2:
- Akzeptanz-Metrik: Dismiss-Rate < 50 % bei 5 internen Test-Usern
- Bei FAIL: P3.1 (Wandern) wird zurückgestellt, Säule 3 endet bei Idle-States

**DoD Wave 2:**
- P3.2 Spike-Review erteilt GO/NO-GO
- P1.3 Microservice-Endpoint antwortet < 100 ms auf Test-Posts
- P1.1 Typesense-Index gefüllt, Hybrid-Endpoint liefert Ergebnisse ohne LLM-Call

---

### Wave 3 — Erweiterung (Woche 3–4, parallel)

| # | Pattern | Aufwand | Branch | Branch-Basis |
|---|---|---|---|---|
| 3a | **P2.2 User-Settings-UX** | M · 1–2 Tage | `feature/v3-settings-ux` | `feature/v3-feature-registry` |
| 3b | **P1.2 LLM-Gate** | M · 2–3 Tage | `feature/v3-llm-gate` | `main` |
| 3c | **P3.3 Idle-State-Machine** | M · 3–4 Tage | `feature/v3-orb-idle-machine` | `feature/v3-feature-registry` |
| 3d | **P4.1 Local Embeddings** | M · 3 Tage | `feature/v3-local-embeddings` | `feature/v3-feature-registry` |

**Ziel:** Settings-UX live, LLM-Gate misst Reduktion, Idle-States lebendig,
Privacy-Mode-Embeddings vorbereitet.

**DoD Wave 3:** Toggle-UI funktional · `ai_call_logs` zeigt messbare LLM-Reduktion
(Ziel −60 %) · XState-Machine alle 5 States testbar · Worker lädt Modell unter 5 s
nach erstem Caching.

---

### Wave 4 — Integration & Privacy (Woche 5–7)

| # | Pattern | Aufwand | Branch | Branch-Basis |
|---|---|---|---|---|
| 4a | **P2.3 Dependency-Graph** | M · 2 Tage | `feature/v3-dependency-graph` | `feature/v3-settings-ux` |
| 4b | **P3.1 Wandernder Orb** | M–L · 4–6 Tage | `feature/v3-orb-wander` | `feature/v3-orb-idle-machine` |
| 4c | **P1.3 Encoder-Only-Microservice (Production)** | L · 1 Woche | `feature/v3-encoder-only-prod` | `feature/v3-encoder-only-poc` |
| 4d | **P4.2 EU-Bedrock Provider** | S–M · 2 Tage | `feature/v3-bedrock-provider` | `feature/v3-local-embeddings` |
| 4e | **P4.3 C2PA Audit-Log** | S · 1–2 Tage | `feature/v3-c2pa-audit` | `feature/v3-bedrock-provider` |

**DoD Wave 4:** Alle 12 Patterns gemerged · Quality-Audit grün · Privacy-Mode
als opt-in Toggle live · Living Orb v2 vollständig aktivierbar.

---

## 5. Pattern-Details

### 5.1 P2.1 — Feature-Registry · `feature/v3-feature-registry`

**Files create:**
- `src/lib/features/feature-registry.ts` — Single Source of Truth
- `src/lib/features/types.ts` — `FeatureId`, `FeatureConfig`, `ToggleStrategy`
- `src/lib/features/index.ts` — Re-Export

**Files modify:**
- ggf. `src/lib/feature-flags.ts` (falls existing) auf Registry umstellen

**DB-Migration:** `supabase/migrations/00020_feature_registry_strategy.sql`
- `ALTER TABLE feature_flags ADD COLUMN toggle_strategy text` (Enum-Check via CHECK constraint)

**Steps:**
1. `types.ts`: Discriminated Union für `ToggleStrategy = 'cascade-off' | 'warn-and-allow' | 'block'`
2. `feature-registry.ts`: Readonly-Array mit allen Features (forum, leaderboard, ai-mentor, living-orb, innovation-radar, privacy-mode etc.) plus `deps: FeatureId[]`, `userToggleable`, `orgToggleable`, `defaultEnabled`
3. Helper `getFeature(id)`, `validateRegistry()` (DAG topological sort, kein Zyklus)

**Tests:** `tests/unit/features/feature-registry.test.ts` — Zyklus-Detection, alle Features typisiert.

**DoD:** Registry validiert · keine zyklischen Dependencies · TypeScript build grün

---

### 5.2 P3.2 — Bubble-Spike · `feature/v3-pillar3-bubble-spike`

**Files create:**
- `src/lib/orb-rules/trigger-types.ts` — Discriminated Union der Trigger-Events
- `src/lib/orb-rules/rule-engine.ts` — `ts-pattern@5.x` Match-Logik
- `src/lib/orb-rules/cooldown.ts` — localStorage Read/Write
- `src/lib/orb-rules/bubble-copy.ts` — 8 Trigger-Texte (siehe §6)
- `src/components/features/ai-orb/bubble-speech.tsx` — Render-Komponente
- `src/components/features/ai-orb/use-orb-trigger.ts` — Event-Listener-Hook

**Files modify:**
- `src/components/features/ai-orb/orb-provider.tsx` — `BubblePayload` zum Context

**Steps:**
1. `npm i ts-pattern@^5.5`
2. 8 Trigger-Events definieren (siehe §6 für MicroCopy)
3. `cooldown.ts`: max 1 Bubble/Session, 24 h Cooldown nach Dismiss, Frequency-Cap 3/Woche
4. `BubbleSpeech` mit `aria-live="polite"`, `role="status"`, ESC-dismissable
5. **Spike-Trigger temporär:** nach 5 s Seitenaufenthalt fest auf `SECTION_DWELL` triggern
6. Toggle-Gate: nur wenn `living-orb`-Feature aktiv

**Tests:**
- Vitest: Rule-Engine alle 8 Trigger × `canShow=true/false` (16 Cases)
- Vitest: Cooldown-localStorage-Mock
- Playwright: `tests/e2e/orb-bubble.spec.ts` — Page laden, 5 s warten, Bubble erscheint, Dismiss klicken

**Spike-DoD:**
- 5 interne Test-User · Dismiss-Rate < 50 % · qualitatives Feedback positiv → GO
- Sonst NO-GO → Säule 3 endet bei Idle-States

---

### 5.3 P1.1 — Hybrid Search · `feature/v3-hybrid-search`

**Files create:**
- `src/lib/search/typesense-client.ts`
- `src/lib/search/hybrid-search.ts` — RRF-Fusion (Reciprocal Rank Fusion)
- `src/lib/search/index-sync.ts` — Supabase-Realtime → Typesense Sync
- `src/app/api/search/hybrid/route.ts`

**Files modify:**
- `src/app/api/ai/search/route.ts` — Feature-Flag-Guard delegiert an Hybrid

**DB-Migration:** `supabase/migrations/00021_ai_call_logs.sql`
- Tabelle `ai_call_logs(id, user_id, feature, call_type ENUM('llm','hybrid','skipped'), provider, tokens_used, created_at)`
- RLS: `WITH CHECK (user_id = auth.uid())`

**Infrastructure-Decision:** Self-hosted Typesense (Docker auf Railway) vs.
Typesense Cloud — siehe §11 offene Fragen.

**Steps:**
1. Typesense-Container deployen (Decision required)
2. Initial-Indexing: alle `best_practices` + `community_posts` indexieren
3. `hybrid-search.ts`: Top-K via BM25, Re-Rank Top-N via pgvector cosine, RRF-Score `1/(k+rank_bm25) + 1/(k+rank_vec)` mit k=60
4. Realtime-Sync via Supabase-Listener bei INSERT/UPDATE
5. Feature-Flag `hybrid-search` (default off in Wave 2 POC)

**Tests:**
- Vitest: RRF-Score-Berechnung mit Mock-Responses
- Playwright: 10 Test-Suchen → 0 LLM-Calls in `ai_call_logs`, Median-Latenz < 200 ms

---

### 5.4 P1.2 — LLM-Gate · `feature/v3-llm-gate`

**Files create:**
- `src/lib/ai/gate/llm-gate.ts` — Decision-Logik
- `src/lib/ai/gate/complexity-classifier.ts` — FastText-WASM-Wrapper
- `src/lib/ai/gate/types.ts` — `GateDecision`, `ComplexityScore`

**Files modify:**
- `src/lib/ai/router.ts` — Gate-Middleware vor `chat()`
- `src/app/api/ai/chat/route.ts` — Logging via `ai_call_logs` mit `call_type: 'skipped'`

**Steps:**
1. FastText-Modell trainieren mit 500–1000 gelabelten Community-Queries
2. WASM-Bundle in `public/models/fasttext-classifier.wasm` (oder ONNX als Alternative)
3. Decision-Matrix:
   - Query-Länge < 15 Wörter → local
   - Keine Entitäten (PER/ORG) → local
   - Cache-Hit → local
   - "Generiere/Erkläre" → llm
   - User Premium-Tier → gate offen
4. Cold-Start: regelbasiertes Heuristic-Gate (Query-Länge + Keyword-Liste)
   bis Trainingsdaten reichen

**Tests:** 20 Fixture-Anfragen (10 simple → skip, 10 complex → llm), 5 % False-Positive-Cap.

**DoD:** Gate-Entscheidung < 50 ms · `ai_call_logs` zeigt messbare Reduktion.

---

### 5.5 P1.3 — Encoder-Only-Microservice · `feature/v3-encoder-only-prod`

**Wichtig:** Läuft als **separater Microservice** (nicht in Next.js).
Hosting-Decision: Railway / Fly.io / VPS (siehe §11).

**Files create:**
- `src/lib/moderation/onnx-client.ts` — HTTP-Client zum Service
- `src/lib/moderation/content-moderator.ts` — Orchestriert Detoxify + NER + ModernBERT-Tags
- `src/lib/moderation/types.ts`
- `src/app/api/moderation/route.ts` — interner Service-to-Service Endpoint
- `services/onnx-moderator/` — Service-Spec: `README.md`, `openapi.yaml`, `Dockerfile`

**Files modify:**
- `src/app/api/community/posts/route.ts` — POST-Handler ruft `contentModerator.check()` vor INSERT
- `src/app/api/ai/chat/route.ts` — User-Input durch Moderation vor LLM-Gate

**DB-Migration:** `supabase/migrations/00022_moderation_fields.sql`
- `ALTER TABLE community_posts ADD COLUMN moderation_score float, pii_detected boolean`

**Service-Stack (Python):**
- FastAPI + ONNX Runtime 1.19+
- `unitaryai/detoxify` ONNX-Export (Toxicity)
- `dslim/bert-base-NER` (PII)
- `answerdotai/ModernBERT-base` (Tagging)
- Latenz-Budget: < 100 ms p95

**Safety-Default:** Bei Service-Timeout → `moderation_score = 0.0`, alle Posts
passieren. Verhindert Outage-Cascade.

---

### 5.6 P2.2 — User-Settings-UX · `feature/v3-settings-ux`

**Files create:**
- `src/lib/features/user-prefs.ts` — Server-seitige Lese/Schreib-Logik
- `src/app/actions/feature-prefs.ts` — Server Action `toggleFeaturePref()`
- `src/components/features/settings/feature-toggle.tsx` — Switch mit `useOptimistic`
- `src/components/features/settings/feature-settings-page.tsx`

**Files modify:**
- `src/app/(dashboard)/settings/page.tsx` — Feature-Settings-Sektion einbauen

**DB-Migration:** `supabase/migrations/00023_user_feature_prefs.sql`

```sql
CREATE TABLE user_feature_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id text NOT NULL,
  is_enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_id)
);
ALTER TABLE user_feature_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own" ON user_feature_prefs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users update own" ON user_feature_prefs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

**Tests:**
- Vitest: Server-Action persistiert; Unknown-Feature-ID → 400
- Playwright: Toggle klicken → optimistische UI < 100 ms · Reload zeigt persisten State

**Wichtig — React-Version:** `useOptimistic` ist in React 18.3 verfügbar, stabil
ab React 19. Falls Phase 6 (Framework-Sprung) noch nicht abgeschlossen, mit
React 18.3 starten und bei React 19 verifizieren.

---

### 5.7 P3.3 — Idle-State-Machine · `feature/v3-orb-idle-machine`

**Files create:**
- `src/lib/orb-state/idle-machine.ts` — XState v5 `createMachine()`
- `src/lib/orb-state/time-of-day.ts` — `'day' | 'evening' | 'night'`
- `src/components/features/ai-orb/use-orb-idle-state.ts` — `useMachine(idleMachine)`
- `src/components/features/ai-orb/orb-animation-layer.tsx` — Framer-Motion-Renderer

**Stack:** `npm i xstate@^5.18 @xstate/react@^4`

**State-Machine:**
```
States:
  active                   — User interagiert
  idle.breathing           — Loop 3s, Scale 1.0→1.04→1.0
  idle.mini                — Entry alle 45–90s (random), 2s Drift
  idle.maxi                — 5% Chance nach 3min Idle, 4s Easter-Egg
  muted                    — prefers-reduced-motion ODER User-Toggle

Transitions:
  active → idle.breathing      after 15s ohne Activity
  idle.breathing → idle.mini   after random(45_000, 90_000) ms
  idle.mini → idle.breathing   after 2_000 ms
  idle.breathing → idle.maxi   after 180_000 ms · guard: Math.random() < 0.05
  idle.maxi → idle.breathing   after 4_000 ms
  any → active                 on ACTIVITY (mousemove throttled, keydown, scroll)
  any → muted                  on MUTE_TOGGLE / REDUCED_MOTION
  muted → idle.breathing       on UNMUTE_TOGGLE
```

**Tests:**
- Vitest: `createActor(idleMachine).start()`, `vi.useFakeTimers()` für Transitions
- Maxi-Statistik: 1000 `Math.random()`-Runs, Easter-Egg in 3–7 % der Fälle
- Playwright: prefers-reduced-motion-Emulation → keine Scale-Animation

---

### 5.8 P3.1 — Wandernder Orb · `feature/v3-orb-wander`

**Files create:**
- `src/components/features/ai-orb/use-orb-wander.ts` — `useScroll`, `useSpring`, Intersection Observer
- `src/components/features/ai-orb/wander-layer.tsx` — `<motion.div>` Wrapper

**Files modify:**
- `src/components/features/ai-orb/ai-orb.tsx` — WanderLayer als opt-in via Toggle

**Stack-Upgrade:** Framer Motion `v11.5` → `v12.x`

**Steps:**
1. `useScroll()` für ScrollY · `useSpring(targetY, { stiffness: 80, damping: 20 })`
2. Intersection Observer auf `[data-orb-anchor]` Data-Attribute
3. Cursor-Avoidance: `mousemove`-Listener throttled via `requestAnimationFrame`,
   wenn `magnitude < 80px` → Push-Away
4. Dock-Behavior: kein Anchor sichtbar → Spring zurück nach `bottom-right`
5. `prefers-reduced-motion`: Hook gibt `{ x: 0, y: 0 }` zurück

**Constraints:**
- Limit auf max. 3 beobachtete Intersection-Observer-Targets (Safari-Performance)
- Orb verlässt nie Viewport: `Math.max(0, Math.min(window.innerWidth - 64, targetX))`
- `aria-hidden="true"` auf Wander-Layer

---

### 5.9 P2.3 — Dependency-Graph · `feature/v3-dependency-graph`

**Files create:**
- `src/lib/features/dependency-resolver.ts` — Graph-Logik
- `src/lib/features/dependency-types.ts`

**Files modify:**
- `src/components/features/settings/feature-toggle.tsx` — Dependency-Sheet bei Konflikt
- `src/lib/features/feature-registry.ts` — Strategien final ausformulieren

**3 Strategien:**
- `cascade-off` — Abhängige werden mitdeaktiviert (z.B. Leaderboard ohne Gamification)
- `warn-and-allow` — Warning, aber User kann trotzdem deaktivieren
- `block` — Toggle gesperrt solange Abhängiger aktiv

**Tests:**
- Vitest: 100 % Branch-Coverage auf Resolver, alle 3 Strategien
- Playwright: Parent deaktivieren → Cascade-Off visuell sichtbar

---

### 5.10 P4.1 — Local Embeddings · `feature/v3-local-embeddings`

**Files create:**
- `src/lib/ai/workers/embedding.worker.ts` — Web Worker
- `src/lib/ai/local-embeddings.ts` — Client-API
- `src/components/privacy/embedding-load-progress.tsx` — UI

**Stack:** `@xenova/transformers@^2.17.2` (v3 latest stable; v4 API laeuft unter `@huggingface/transformers`, war zum Implementierungszeitpunkt noch nicht stabil)

**Steps:**
1. Worker: `pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')` (22 MB)
2. Cache via Service Worker / Cache API
3. Progress-UI mit `aria-live="polite"`, `role="progressbar"`
4. Privacy-Mode-Toggle aktiviert Worker-Init

**Tests:** Worker gemockt via Vitest; Network-Tab zeigt 0 Requests nach Cache.

---

### 5.11 P4.2 — EU-Bedrock Provider · `feature/v3-bedrock-provider`

**Files create:**
- `src/lib/ai/providers/bedrock.ts` — `@aws-sdk/client-bedrock-runtime`
- `docs/ops/bedrock-iam-setup.md` — IAM-Doku, AVV-Hinweise

**Files modify:**
- `src/lib/ai/router.ts` — `if (privacyMode) → bedrockProvider()`
- `src/lib/ai/pricing.ts` — Bedrock-Preise (Haiku eu-central-1)

**IAM-Minimal-Policy:**
```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "arn:aws:bedrock:eu-central-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
}
```

**Pre-Condition:** AWS-Account mit Bedrock-Zugang in eu-central-1 + Quota-Approval
(1–3 Werktage Vorlauf, siehe §11).

---

### 5.12 P4.3 — C2PA Audit-Log · `feature/v3-c2pa-audit`

**Files create:**
- `src/lib/audit/c2pa-manifest.ts` — `buildManifest()`, `persistManifest()`

**Files modify:**
- `src/app/api/ai/chat/route.ts` — `persistManifest()` fire-and-forget nach Stream-Ende

**DB-Migration:** `supabase/migrations/00024_audit_logs.sql`

```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_hash text NOT NULL,        -- SHA-256(auth.uid())
  model_id text NOT NULL,
  provider text NOT NULL,
  region text NOT NULL,
  privacy_mode boolean NOT NULL DEFAULT false,
  content_hash text NOT NULL,        -- SHA-256 des Response-Texts
  manifest_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Wichtig:** Phase 1 nur Manifest-Schema ohne X.509-Signing. Echtes Signing
als Phase-2-Erweiterung (siehe ADR-006).

---

## 6. Bubble MicroCopy · 8 Trigger (Deutsch)

Aus Architect-2-Output. Tonalität: knapp, persönlich, kein Fragezeichen-Druck,
kein Clippy-Stil.

| # | Trigger | Headline | Body |
|---|---|---|---|
| 1 | `SECTION_DWELL` (30 s auf Sektion) | Da steckt mehr drin. | Dieser Abschnitt hat ein paar Querverbindungen, die nicht sofort sichtbar sind. Frag mich einfach, wenn du tiefer willst. |
| 2 | `CODE_BLOCK_VISIBLE` (>10 s) | Code gefunden. | Ich kann den erklären, Varianten zeigen oder direkt ins Projekt einbauen — sag einfach Bescheid. |
| 3 | `SEARCH_NO_RESULT` | Nichts gefunden — aber vielleicht ich. | Zu '{{query}}' habe ich hier keine Treffer, aber ich kenne das Thema. Stell mir die Frage direkt. |
| 4 | `INACTIVITY` (90 s) | Kurze Pause? | Ich bin noch hier, wenn du weitermachst. Keine Eile. |
| 5 | `XP_MILESTONE` | Level-Up. | Du hast gerade {{xp}} XP überschritten. Gut gemacht — der nächste Schritt wäre {{nextStep}}. |
| 6 | `FIRST_AI_CHAT` | Erster Kontakt. | Du kannst mich alles fragen, was mit dem Projekt zu tun hat. Ich antworte präzise, nicht ausschweifend. |
| 7 | `DEEP_SCROLL` (>80 %, >2 min) | Du hast das Meiste gelesen. | Falls du eine Zusammenfassung oder den nächsten Schritt willst — ich mach das in 30 Sekunden. |
| 8 | `RETURN_VISIT` (>3 Tage) | Wieder da. | Zuletzt warst du bei '{{lastSection}}'. Soll ich dich dort wieder abholen? |

**Anti-Stoerung:** Mute-Toggle, max 1/Session, Frequency-Cap 3/Woche, 24 h
Cooldown nach Dismiss, kein Trigger während Chat geöffnet oder Formular aktiv.

---

## 7. Stack-Erweiterungen (Versions-Pinning Mai 2026)

| Komponente | Package | Version | Verwendung |
|---|---|---|---|
| State-Machine | `xstate` | `^5.18` | P3.3 Idle-Machine |
| State-Machine React | `@xstate/react` | `^4.x` | P3.3 |
| Pattern-Matching | `ts-pattern` | `^5.5` | P3.2 Rule-Engine |
| Local Embeddings | `@xenova/transformers` | `^2.17.2 (v3 latest; v4 API unter @huggingface/transformers, pending stabilization)` | P4.1 |
| AWS Bedrock | `@aws-sdk/client-bedrock-runtime` | `^3.x` | P4.2 |
| Search Engine | Typesense | `0.26+` | P1.1 |
| Encoder Models | ONNX Runtime | `1.19+` | P1.3 (Microservice) |
| Framer Motion | bestehend | Upgrade `12.x` | P3.1 (useScroll/useSpring) |
| Coverage | `@vitest/coverage-v8` | bereits in Phase 3.1 | alle |

---

## 8. Branch-Strategie

```
main
├── feature/v3-feature-registry              [Wave 1]
│   ├── feature/v3-pillar3-bubble-spike      [Wave 2]
│   ├── feature/v3-hybrid-search             [Wave 2]
│   ├── feature/v3-settings-ux               [Wave 3]
│   │   └── feature/v3-dependency-graph      [Wave 4]
│   ├── feature/v3-orb-idle-machine          [Wave 3]
│   │   └── feature/v3-orb-wander            [Wave 4]
│   └── feature/v3-local-embeddings          [Wave 3]
│       └── feature/v3-bedrock-provider      [Wave 4]
│           └── feature/v3-c2pa-audit        [Wave 4]
├── feature/v3-encoder-only-poc              [Wave 2, parallel]
│   └── feature/v3-encoder-only-prod         [Wave 4]
└── feature/v3-llm-gate                      [Wave 3, parallel]
```

**Conventional Commits:**
- `feat(features):` für Säule 2
- `feat(ai):` für Säule 1 LLM-Gate, Embeddings
- `feat(search):` für Hybrid Search
- `feat(moderation):` für Encoder-Only
- `feat(orb):` für Säule 3
- `feat(privacy):` für Säule 4

---

## 9. Rollback-Plan

1. **Sofort:** Feature-Flag in `feature_flags` auf `is_enabled = false`
   (Admin-Panel, kein Deploy nötig)
2. **Branch-Level:** Branch wird nicht gemerged. `main` bleibt sauber.
3. **DB-Migrations:** Alle additive (`ALTER ADD COLUMN`, neue Tabellen) — kein
   Rollback nötig, existierender Code ignoriert sie.
4. **Microservice-Outage (P1.3):** Safety-Default `moderation_score = 0.0`, alle
   Posts passieren. Muss explizit getestet werden.
5. **AWS Bedrock-Outage (P4.2):** Privacy-Mode-Toggle deaktiviert, Router
   fällt auf Default-Provider zurück.

---

## 10. ⚠ ADR-Numerierungs-Konflikt (Pre-Condition!)

Architect-2-Subagent hat ADRs unter `docs/architecture/` geschrieben, **ohne**
das existierende Verzeichnis `docs/architecture/adr/` zu kennen. Dadurch
entstehen Numerierungs-Konflikte:

| Konflikt | Existing | Neu (Architect 2) |
|---|---|---|
| ADR-001 | (in IMPROVEMENTS.md vorgesehen für AI SDK v4) | `ADR-001-living-orb-v2-wandering-layer.md` |
| ADR-003 | `ADR-003-api-key-encryption.md` (existing) | `ADR-003-orb-idle-state-machine-xstate.md` |
| ADR-005 | `adr/ADR-005-orb-chat-session-persistence.md` | `ADR-005-eu-bedrock-llm-provider.md` |

**Action vor Wave 1 Start:**
1. Konsolidiere ADR-Verzeichnisse — entweder alle in `docs/architecture/`
   oder alle in `docs/architecture/adr/` (Empfehlung: das letztere)
2. Numeriere die neu erstellten ADRs um:
   - `ADR-001-living-orb-v2-wandering-layer.md` → **ADR-007**
   - `ADR-002-proactive-bubble-rule-engine.md` → **ADR-008**
   - `ADR-003-orb-idle-state-machine-xstate.md` → **ADR-009**
   - `ADR-004-privacy-mode-local-embeddings.md` → **ADR-010**
   - `ADR-005-eu-bedrock-llm-provider.md` → **ADR-011**
   - `ADR-006-c2pa-audit-log-art50.md` → **ADR-012**
3. Update `docs/architecture/adr/README.md` Index entsprechend

---

## 11. Offene Fragen (Eskalation an User)

1. **Typesense-Hosting** (P1.1) — Self-hosted (Docker auf Railway/eigenem
   Server) vs. Typesense Cloud ($15/Mo)? Beeinflusst Latenz + Kosten.
2. **ONNX-Microservice-Hosting** (P1.3) — Vercel kann ONNX nicht. Optionen:
   Railway, Fly.io, separater VPS. Entscheidung blockiert P1.3-Production.
3. **AWS Bedrock-Account** (P4.2) — Bestehender Account oder neu? Quota-Request
   für eu-central-1 dauert 1–3 Werktage.
4. **React 19 / Next.js 16 für `useOptimistic`** (P2.2) — In React 18.3
   verfügbar, stabil ab React 19. Phase 6 abwarten oder mit 18.3 starten?
5. **LLM-Gate-Schwellwert** (P1.2) — Welche Complexity-Schwelle = "LLM-würdig"?
   Braucht initialen Kalibrierungs-Datensatz aus echten User-Queries.
6. **Bubble-Spike-Akzeptanz-Metrik** (P3.2) — Qualitatives Feedback
   (5 Test-User) oder quantitativ (Dismiss-Rate < X %)?
7. **C2PA X.509-Signing-Timeline** (P4.3) — Phase 1 nur Manifest-Schema. Wann
   echtes Signing nachziehen?
8. **ADR-Numerierung bereinigen** (siehe §10) — Prerequisite vor Wave 1.

---

## 12. Definition of Done — v3 komplett

- [ ] Alle 12 Patterns auf `main` gemerged
- [ ] Quality-Audit ohne Critical/High Findings
- [ ] Coverage ≥ 60 % auf neuen Code-Pfaden
- [ ] Living Orb v2 als opt-in Toggle live (default off in Wave 1, default on
      ab Wave 4 nach Bubble-Spike-GO)
- [ ] Privacy Mode als opt-in Toggle live
- [ ] LLM-Cost-Reduktion in `ai_call_logs` messbar (Ziel: −60 % vs. Baseline)
- [ ] Alle ADRs in `docs/architecture/adr/` konsolidiert
- [ ] [`docs/CHANGELOG.md`](CHANGELOG.md) Eintrag mit `0.2.0` Bump (SemVer minor)
- [ ] Pitch-Deck v3 als interne Doku archiviert (bleibt unter `docs/`)

---

> **Quellen:** Pitch Deck v3 ([`docs/pitch-deck-v3.html`](pitch-deck-v3.html))
> · Stress-Test-Outputs Team 1 (3 Researcher) · New-Direction-Outputs Team 2
> (3 Innovators) · Architect 1 (Säulen 1+2 Plan) · Architect 2 (Säulen 3+4
> Plan, ADRs unter `docs/architecture/`) · Explore-Agent (Codebase-Inventar)
