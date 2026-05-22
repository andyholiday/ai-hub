# Architektur-Dokumentation -- AI Hub

> Technische Architektur der KI-Community-Plattform.

**Version:** 0.1.0 | **Stand:** 2026-02-21

---

## Inhaltsverzeichnis

- [System-Uebersicht](#system-uebersicht)
- [Datenfluss](#datenfluss)
- [Multi-Provider AI Router](#multi-provider-ai-router)
- [Supabase Schema](#supabase-schema)
- [Ordnerstruktur](#ordnerstruktur)
- [Komponenten-Architektur](#komponenten-architektur)
- [API-Architektur](#api-architektur)
- [Sicherheitsarchitektur](#sicherheitsarchitektur)

---

## System-Uebersicht

```
+===========================================================================+
|                          AI HUB - Systemarchitektur                       |
+===========================================================================+

+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|     Browser       |       |    Next.js 14     |       |    Supabase       |
|    (Client)       +-------> (App Router)      +------->   (Cloud)        |
|                   |  HTTP |                   | SQL   |                   |
| - React 18       |       | - Server Comp.    |       | - PostgreSQL 15   |
| - Zustand Stores |       | - API Routes (31) |       | - Auth (JWT)      |
| - Framer Motion  |       | - Middleware       |       | - pgvector        |
| - Tailwind CSS   |       | - Zod Validation  |       | - 29 Tabellen     |
| - Living Cloud   |       | - Rate Limiting   |       | - 50+ RLS         |
|                   |       |                   |       | - Realtime        |
+-------------------+       +--------+----------+       +-------------------+
                                     |
                                     | API Calls
                                     |
                    +----------------+----------------+
                    |                                  |
           +--------v--------+              +---------v---------+
           |                 |              |                   |
           |   AI Router     |              |   Upstash Redis   |
           |                 |              |                   |
           | - Fallback Chain|              | - Rate Limiting   |
           | - Cost Tracking |              | - 4 Tiers         |
           | - Streaming     |              | - Sliding Window  |
           |                 |              |                   |
           +--------+--------+              +-------------------+
                    |
       +------------+------------+-----------+
       |            |            |           |
  +----v---+  +----v---+  +----v---+  +----v----+
  | Gemini |  | OpenAI |  | Claude |  | Copilot |
  |  API   |  |  API   |  |  API   |  | (Azure) |
  | (Std.) |  |  (#2)  |  |  (#3)  |  |  (#4)   |
  +--------+  +--------+  +--------+  +---------+
```

---

## Datenfluss

### Typischer Request-Lifecycle

```
1. USER ACTION
   Browser (React Client)
        |
        | HTTP Request (mit Supabase Auth Cookie)
        v
2. MIDDLEWARE
   src/middleware.ts
   - Auth Check (getUser())
   - Route Protection
   - Redirect Logic
        |
        v
3. API ROUTE
   src/app/api/[...]/route.ts
   - requireAuth() / requireAdmin()
   - Zod Schema Validation
   - Rate Limit Check (Upstash)
        |
        v
4. BUSINESS LOGIC
   src/lib/[feature]/
   - AI Router (fuer KI-Features)
   - Supabase Client Queries
   - XP/Achievement Checks
        |
        v
5. DATABASE
   Supabase Cloud (PostgreSQL)
   - RLS Policy Check
   - Query Execution
   - Trigger-Ausfuehrung
        |
        v
6. RESPONSE
   - apiSuccess() / apiError() Pattern
   - Konsistentes JSON-Format
   - Error Codes + Nachrichten
        |
        v
7. CLIENT UPDATE
   - Zustand Store Update
   - UI Re-Render
   - Optimistic Updates (wo angebracht)
```

### AI Chat Datenfluss (Streaming)

```
User Input
    |
    v
/api/ai/chat (POST)
    |
    +-- requireAuth()
    +-- Rate Limit Check (Tier: ai)
    +-- Zod Validation
    |
    v
AI Router
    |
    +-- Primary Provider (Gemini)
    |       |
    |       +-- [Erfolg] --> Streaming Response
    |       |
    |       +-- [Fehler] --> Fallback zu OpenAI
    |                           |
    |                           +-- [Erfolg] --> Streaming Response
    |                           |
    |                           +-- [Fehler] --> Fallback zu Claude
    |                                               |
    |                                               +-- ... (bis Copilot)
    |
    +-- Cost Logging (fire-and-forget)
    |       |
    |       v
    |   ai_cost_log Tabelle
    |   (provider, tokens, cost, feature)
    |
    v
Streaming Response --> Client
    |
    v
Chat Panel / AI Mentor Page
    - Token-by-Token Rendering
    - Orb wechselt zu "thinking" State
```

### Semantic Search Datenfluss

```
Suchanfrage
    |
    v
/api/search (GET)
    |
    +-- Rate Limit Check (Tier: search)
    |
    v
Embedding-Service
    |
    +-- OpenAI text-embedding-3-small
    |       |
    |       +-- [Fehler] --> Lokaler Fallback
    |
    v
pgvector Query
    |
    +-- match_documents() RPC Function
    +-- Cosine Similarity
    +-- Top-K Ergebnisse
    |
    v
Ranked Results --> Client
```

---

## Multi-Provider AI Router

### Architektur-Diagramm

```
+========================================================================+
|                        AI ROUTER (src/lib/ai/router.ts)                |
+========================================================================+
|                                                                        |
|   +------------------+                                                 |
|   | RouterConfig     |  Provider-Reihenfolge, Timeouts, Retry-Logic   |
|   +--------+---------+                                                 |
|            |                                                           |
|            v                                                           |
|   +------------------+                                                 |
|   | AIRouter Class   |  Singleton, Lazy Init, ensureInitialised()     |
|   |                  |                                                 |
|   | - providers Map  |  Map<AIProvider, IAIProvider>                   |
|   | - config         |  RouterConfig                                   |
|   | - chatCompletion |  Primary + Fallback-Chain                      |
|   | - healthCheck    |  Provider-Verfuegbarkeit                       |
|   +--------+---------+                                                 |
|            |                                                           |
|            | IAIProvider Interface                                      |
|            |                                                           |
|   +--------v-----------------------------------------------------+    |
|   |                    Provider-Implementierungen                 |    |
|   |                                                               |    |
|   |  +-----------+  +-----------+  +-----------+  +-----------+  |    |
|   |  |  Gemini   |  |  OpenAI   |  |  Claude   |  |  Copilot  |  |    |
|   |  | Provider  |  | Provider  |  | Provider  |  | Provider  |  |    |
|   |  |           |  |           |  |           |  |           |  |    |
|   |  | @ai-sdk/  |  | @ai-sdk/  |  | @ai-sdk/  |  | Custom    |  |    |
|   |  | google    |  | openai    |  | anthropic |  | Azure     |  |    |
|   |  +-----------+  +-----------+  +-----------+  +-----------+  |    |
|   +---------------------------------------------------------------+    |
|                                                                        |
+========================================================================+

Fallback-Chain (Standard):
  [1] Gemini --> [2] OpenAI --> [3] Claude --> [4] Copilot

Features:
  - Streaming (Token-by-Token)
  - Health Check pro Provider
  - Cost Tracking (Tokens + geschaetzte Kosten)
  - Auto-Fallback bei Fehler
  - Konfigurierbar ueber Admin-Panel (DB: ai_providers)
```

### Provider Interface

```typescript
interface IAIProvider {
  id: AIProvider;
  name: string;
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  streamChatCompletion(request: ChatCompletionRequest): AsyncGenerator<StreamChunk>;
  healthCheck(): Promise<boolean>;
}
```

### AI-Services

| Service | Datei | Beschreibung |
|---------|-------|-------------|
| **AI Router** | `src/lib/ai/router.ts` | Routing + Fallback |
| **Gemini Provider** | `src/lib/ai/providers/gemini.ts` | Google Gemini API |
| **OpenAI Provider** | `src/lib/ai/providers/openai.ts` | OpenAI API |
| **Claude Provider** | `src/lib/ai/providers/claude.ts` | Anthropic Claude API |
| **Copilot Provider** | `src/lib/ai/providers/copilot.ts` | Azure OpenAI API |
| **Embeddings** | `src/lib/ai/embeddings.ts` | text-embedding-3-small |
| **Auto-Tagger** | `src/lib/ai/auto-tagger.ts` | Automatische Tag-Vergabe |
| **Use-Case Evaluator** | `src/lib/ai/use-case-evaluator.ts` | 5-Dimensionen-Bewertung |
| **Config** | `src/lib/ai/config.ts` | Router-Konfiguration |
| **Types** | `src/lib/ai/types.ts` | TypeScript-Interfaces |
| **Prompts** | `src/lib/ai/prompts/` | System-Prompts |

---

## Supabase Schema

### Schema-Uebersicht (29 Tabellen)

```
+========================================================================+
|                     SUPABASE SCHEMA (PostgreSQL 15)                    |
+========================================================================+

  AUTHENTIFIZIERUNG                    COMMUNITY
  +------------------+                 +------------------+
  | auth.users       |<----+          | community_posts  |
  +------------------+     |          +------------------+
         |                 |          | post_comments    |
         v                 |          +------------------+
  +------------------+     |          | post_likes       |
  | profiles         |-----+          +------------------+
  +------------------+     |          | user_badges      |
  | - full_name      |     |          +------------------+
  | - avatar_url     |     |          | badges           |
  | - role           |     |          +------------------+
  | - xp_total       |     |
  | - level          |     |
  +------------------+     |
                           |
  GAMIFICATION             |          LEARN-HUB
  +------------------+     |          +------------------+
  | achievements     |     +----------| courses          |
  +------------------+     |          +------------------+
  | user_achievements|     |          | lessons          |
  +------------------+     |          +------------------+
  | challenges       |     |          | quizzes          |
  +------------------+     |          +------------------+
  | user_challenges  |     |          | user_lesson_     |
  +------------------+     |          |   progress       |
  | xp_log           |     |          +------------------+
  +------------------+     |          | course_          |
                           |          |   certificates   |
                           |          +------------------+
  LERNPFADE                |
  +------------------+     |          KI-SYSTEM
  | learning_paths   |     |          +------------------+
  +------------------+     +----------| ai_providers     |
  | learning_path_   |     |          +------------------+
  |   courses        |     |          | system_prompts   |
  +------------------+     |          +------------------+
  | user_learning_   |     |          | ai_cost_log      |
  |   path_progress  |     |          +------------------+
  +------------------+     |          | usecase_         |
                           |          |   evaluations    |
                           |          +------------------+
  SUCHE & CONTENT          |
  +------------------+     |          INNOVATION RADAR
  | content_         |     |          +------------------+
  |   embeddings     |     +----------| radar_topics     |
  +------------------+     |          +------------------+
  | best_practices   |     |          | topic_votes      |
  +------------------+     |          +------------------+
  | best_practice_   |     |
  |   tags           |     |
  +------------------+     |
                           |
  SYSTEM                   |
  +------------------+     |
  | feature_flags    |     |
  +------------------+     |
  | notifications    |-----+
  +------------------+
  | activity_log     |
  +------------------+
```

### Migrationen (chronologisch)

| Nr. | Datei | Beschreibung | Tabellen |
|-----|-------|-------------|----------|
| 1 | `00001_initial_schema.sql` | Grundschema (~50kB) | profiles, community_posts, post_comments, post_likes, badges, user_badges, best_practices, best_practice_tags, courses, lessons, quizzes, challenges, user_challenges, xp_log, course_certificates, ai_providers, system_prompts, ai_cost_log, usecase_evaluations, radar_topics, topic_votes, notifications, activity_log, feature_flags |
| 2 | `00002_feature_flags.sql` | Feature-Flag-System | feature_flags (erweitert) |
| 3 | `00003_semantic_search.sql` | pgvector + Embeddings | content_embeddings, match_documents() RPC |
| 4 | `00004_learn_hub.sql` | Lern-Fortschritt | user_lesson_progress, Auto-Trigger |
| 5 | `00005_fix_linter_warnings.sql` | search_path Fix + RLS | 15x SET search_path, 2x RLS Policy |
| 6 | `00006_learning_paths.sql` | Lernpfade | learning_paths, learning_path_courses, user_learning_path_progress |
| 7 | `00007_advanced_gamification.sql` | Achievements & Streaks | achievements, user_achievements, longest_streak |

### Wichtige DB-Elemente

| Typ | Anzahl | Beispiele |
|-----|--------|----------|
| **Tabellen** | 29 | profiles, community_posts, courses, ai_providers |
| **RLS Policies** | 50+ | Nutzer sehen nur eigene Daten, Admins sehen alles |
| **Functions** | 15 | update_xp(), match_documents(), calculate_level() |
| **Triggers** | 10 | Auto-Profil bei Registrierung, XP-Update, Lesson-Progress |
| **Views** | 3 | Leaderboard, User-Stats, Kurs-Fortschritt |
| **Extensions** | 2 | pgvector (Vektoren), uuid-ossp (UUIDs) |

---

## Ordnerstruktur

### Erklaerung der Verzeichnisse

```
lr-ai-hub/
|
+-- src/
|   |
|   +-- app/                        # Next.js App Router (Seiten + API)
|   |   |
|   |   +-- (admin)/                # Route Group: Admin-Panel
|   |   |   Geschuetzt durch requireAdmin(). 6 Unterseiten.
|   |   |   Layout mit Admin-Navigation.
|   |   |
|   |   +-- (auth)/                 # Route Group: Authentifizierung
|   |   |   Oeffentlich zugaenglich. Login, Register, Forgot-Password.
|   |   |   Eigenes schlankes Layout ohne Sidebar.
|   |   |
|   |   +-- (dashboard)/            # Route Group: Hauptanwendung
|   |   |   Geschuetzt durch Middleware (Auth Check).
|   |   |   Layout mit Sidebar, Header, Living Cloud (AI Orb).
|   |   |   11 Seitenbereiche (Dashboard, Community, Learn-Hub, etc.)
|   |   |
|   |   +-- api/                    # 31 API-Routes
|   |   |   Serverless Functions (Next.js Route Handlers).
|   |   |   Jede Route: Auth Check -> Validation -> Logic -> Response.
|   |   |
|   |   +-- globals.css             # Globale Styles + CSS-Animationen
|   |   +-- layout.tsx              # Root Layout (Providers, Fonts)
|   |   +-- middleware.ts           # Auth-Middleware (Route Protection)
|   |
|   +-- components/
|   |   |
|   |   +-- features/               # Feature-Sliced Components
|   |   |   Organisiert nach Domaene, nicht nach technischer Schicht.
|   |   |   Jedes Feature hat eigene Komponenten, Hooks, Types.
|   |   |   |
|   |   |   +-- ai-orb/             # Living Cloud (7 Dateien, ~36 KB)
|   |   |   |   Das WOW-Feature. Provider, Orb, ChatPanel, Particles.
|   |   |   |
|   |   |   +-- innovation-radar/   # Radar-Visualisierung (5 Dateien)
|   |   |   |   SVG-Chart, Topic-List, Detail-Card, Trending.
|   |   |   |
|   |   |   +-- dashboard/          # Dashboard-Widgets (13 Dateien)
|   |   |   +-- gamification/       # XP, Levels, Badges (8 Dateien)
|   |   |   +-- admin/              # Admin-Panel (9 Dateien)
|   |   |   +-- learn-hub/          # Kurse, Quiz, Lernpfade (5 Dateien)
|   |   |   +-- community/          # Forum, Idea Board (4 Dateien)
|   |   |   +-- best-practices/     # Best Practices (4 Dateien)
|   |   |
|   |   +-- layout/                 # Shell-Komponenten
|   |   |   Header, Sidebar, Footer. Responsive Navigation.
|   |   |
|   |   +-- providers/              # React Context Provider
|   |   |   Theme, Auth, Toast/Notification Provider.
|   |   |
|   |   +-- shared/                 # Wiederverwendbare Komponenten
|   |   |   Pagination, LoadingSpinner, ErrorBoundary.
|   |   |
|   |   +-- ui/                     # Basis-UI-Primitives
|   |       Button, Card, Input, Badge, Dialog, etc.
|   |
|   +-- lib/
|   |   |
|   |   +-- ai/                     # AI-Integration (10 Dateien)
|   |   |   |
|   |   |   +-- providers/          # 4 Provider-Implementierungen
|   |   |   |   gemini.ts, openai.ts, claude.ts, copilot.ts, base.ts
|   |   |   |
|   |   |   +-- prompts/            # System-Prompts (Versioniert)
|   |   |   +-- router.ts           # AI Router (Fallback-Chain)
|   |   |   +-- embeddings.ts       # Embedding-Service (pgvector)
|   |   |   +-- auto-tagger.ts      # Auto-Tagging Service
|   |   |   +-- use-case-evaluator.ts  # 5-Dimensionen-Bewertung
|   |   |   +-- config.ts           # Router-Konfiguration
|   |   |   +-- types.ts            # TypeScript-Interfaces
|   |   |
|   |   +-- api/                    # API-Utilities
|   |   |   Response-Helpers (apiSuccess/apiError), Rate Limiting.
|   |   |
|   |   +-- supabase/               # Supabase-Integration
|   |   |   Client (Browser + Server), generierte Types.
|   |   |
|   |   +-- validators/             # Zod-Schemas (10+ Dateien)
|   |   |   Validierung fuer alle API-Inputs nach Domaene gruppiert.
|   |   |
|   |   +-- utils/                  # Hilfsfunktionen
|   |   |   cn() (Tailwind Merge), sanitize() (DOMPurify).
|   |   |
|   |   +-- gamification/           # Gamification-Logik
|   |       Achievement-Check, XP-Vergabe, Level-Berechnung.
|   |
|   +-- stores/                     # Zustand State Stores (5+)
|   |   Auth-Store, Chat-Store, UI-Store, Notification-Store.
|   |
|   +-- hooks/                      # Custom React Hooks (10+)
|   |   useUser, useDebounce, useIntersectionObserver, etc.
|   |
|   +-- constants/                  # Konstanten
|   |   routes.ts (alle Routen), navigation.ts (Sidebar-Items).
|   |
|   +-- types/                      # Globale TypeScript-Types
|   +-- styles/                     # Zusaetzliche Styles
|   +-- config/                     # App-Konfiguration (ai.ts, site.ts)
|
+-- supabase/
|   +-- migrations/                 # 7 SQL-Migrationen (chronologisch)
|   +-- seed/                       # Demo-Daten (User, Kurse, etc.)
|   +-- functions/                  # Edge Functions
|
+-- tests/
|   +-- unit/                       # 91 Vitest Unit-Tests
|   +-- integration/                # Integrationstests
|   +-- e2e/                        # 14 Playwright E2E-Tests
|   +-- setup.ts                    # Globales Test-Setup
|
+-- .github/workflows/ci.yml       # GitHub Actions CI Pipeline
```

---

## Komponenten-Architektur

### Feature-Sliced Design

Die Codebase folgt einer **Feature-Sliced Architecture**, bei der Komponenten nach fachlicher Domaene organisiert sind:

```
                    +-------------------+
                    |    app/ (Pages)    |
                    |  Route Handlers    |
                    +--------+----------+
                             |
                             | importiert
                             v
                    +-------------------+
                    | components/       |
                    |   features/       |  <-- Feature-Slices
                    +--------+----------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v--+   +------v----+  +------v----+
     | lib/ai/   |   | lib/      |  | stores/   |
     | (AI-Logic)|   | validators|  | (Zustand) |
     +--------+--+   +-----------+  +-----------+
              |
              v
     +------------------+
     | lib/supabase/    |
     | (DB-Client)      |
     +------------------+
```

### State Management

| Store | Datei | Zweck |
|-------|-------|-------|
| **Auth Store** | `stores/auth.ts` | User-Session, Login-Status |
| **Chat Store** | `stores/chat.ts` | Chat-Verlauf, Typing-Indicator |
| **UI Store** | `stores/ui.ts` | Sidebar-State, Theme |
| **Notification Store** | `stores/notifications.ts` | Toast-Nachrichten |
| **Orb Provider** | `components/features/ai-orb/orb-provider.tsx` | Orb-State, Page-Context (React Context) |

### Living Cloud Komponenten-Baum

```
<OrbProvider>                       # React Context (State-Management)
  |
  +-- <CosmosCompanion>             # Haupt-Komponente (cosmos-companion.tsx), lazy-loaded, SSR disabled
  |   |
  |   +-- <BubbleSpeech>            # Proaktive Bubbles (Rule-Engine, Cooldown-Guard)
  |   +-- <OrbPageContext>          # Page-Context-Sync (Seiten-spezifischer State)
  |   +-- <CelebrationFireworks>    # Feier-Partikel (celebration)
  |   +-- <OrbAnimationLayer>       # Multi-Layer Fluid-Blob (3 morphende Schichten)
  |   +-- <AnimatePresence>          # Framer Motion (Exit-Animations)
  |       +-- <ChatSplitView>       # Lazy-loaded Split-View (50/50), persistent Chat
  |           |
  |           +-- Header (Status + Orb-State)
  |           +-- Message List
  |           +-- Context Banner
  |           +-- Input + Quick Actions
  |
  +-- <CommandPaletteTrigger>       # Cmd/Ctrl+K Command Palette (global, im DashboardLayout)
  +-- <useOrbPageState>              # Hook: setzt State je nach Seite
```

---

## API-Architektur

### Request-Pipeline

Jede API-Route folgt dem gleichen Muster:

```typescript
// Beispiel: src/app/api/community/posts/route.ts

export async function GET(request: NextRequest) {
  // 1. Auth Check
  const { user, error } = await requireAuth(request);
  if (error) return error;  // 401 Unauthorized

  // 2. Input Validation (Zod)
  const parsed = listPostsQuery.safeParse(params);
  if (!parsed.success) return apiError("Validation failed", 400);

  // 3. Rate Limit Check (optional)
  const rateLimitResult = await checkRateLimit(user.id, "read");
  if (!rateLimitResult.success) return apiError("Rate limited", 429);

  // 4. Business Logic (Supabase Query)
  const { data, error: dbError } = await supabase
    .from("community_posts")
    .select("id, title, content, ...")
    .order("created_at", { ascending: false });

  // 5. Response
  return apiSuccess({ posts: data });
}
```

### Rate Limiting Tiers

```
+--------------------------------------------------+
|                  RATE LIMITING                     |
|              (Upstash Redis)                      |
+--------------------------------------------------+
|                                                   |
|   Tier "ai"     : 20 Requests / 60 Sekunden      |
|   Tier "search" : 30 Requests / 60 Sekunden      |
|   Tier "write"  : 10 Requests / 60 Sekunden      |
|   Tier "read"   : 60 Requests / 60 Sekunden      |
|                                                   |
|   Algorithmus: Sliding Window                     |
|   Key: user_id + tier                             |
|   Graceful Degradation: Bei Redis-Fehler          |
|     wird der Request durchgelassen                |
|                                                   |
+--------------------------------------------------+

Geschuetzte Routen:
  /api/ai/chat        --> Tier: ai
  /api/ai/completion  --> Tier: ai
  /api/ai/evaluate    --> Tier: ai
  /api/ai/auto-tag    --> Tier: ai
  /api/search         --> Tier: search
```

---

## Sicherheitsarchitektur

```
+===========================================================================+
|                         SICHERHEITSSCHICHTEN                              |
+===========================================================================+

   [Browser]
      |
      |  HTTPS (TLS 1.3)
      v
   [Next.js Middleware]
      |  - Auth Cookie Validation
      |  - Route Protection (public vs. protected)
      |  - Admin Route Guard
      v
   [API Route Handler]
      |  - requireAuth() / requireAdmin()
      |  - getUser() (nicht getSession!)
      |  - Zod Input Validation
      |  - Rate Limiting (Upstash Redis)
      v
   [Business Logic]
      |  - DOMPurify Sanitization (XSS-Schutz)
      |  - Content Moderation (AI Chat)
      |  - Input Sanitization
      v
   [Supabase]
      |  - Row Level Security (50+ Policies)
      |  - API-Keys verschluesselt in DB
      |  - Audit-Logging
      |  - pgvector: read-only fuer User
      v
   [PostgreSQL]
      |  - AES-256 Encryption at Rest
      |  - Prepared Statements (SQL Injection Prevention)
      |  - Auto-Profil via Trigger (keine manuelle INSERT noetig)
```

### Sicherheits-Checkliste

| Schicht | Massnahme | Status |
|---------|-----------|--------|
| Transport | TLS 1.3 (HTTPS) | Aktiv |
| Auth | Supabase Auth (JWT) | Aktiv |
| Auth | getUser() statt getSession() | Migriert |
| API | requireAuth() auf allen Endpoints | Aktiv |
| API | requireAdmin() auf Admin-Endpoints | Aktiv |
| API | Zod-Validierung auf allen Inputs | Aktiv |
| API | Rate Limiting (4 Tiers) | Aktiv |
| Rendering | DOMPurify (XSS-Schutz) | Aktiv |
| DB | Row Level Security (50+ Policies) | Aktiv |
| DB | API-Keys verschluesselt | Aktiv |
| CI | ESLint, TypeScript strict, Tests | Aktiv |

---

> Weitere technische Details befinden sich in `concept/PROGRESS.md` und den Architecture Decision Records in `docs/adr/`.
