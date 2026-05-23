<p align="center">
  <img src="docs/images/header-banner.svg" alt="AI Hub Banner — App-Name, Tagline und stilisierter KI-Orb" width="900"/>
</p>

<h1 align="center">AI Hub</h1>

<p align="center">
  <strong>Deine KI-Community-Plattform mit eingebautem KI-Begleiter</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Build-passing-brightgreen" alt="Build passing"/>
  <img src="https://img.shields.io/badge/Tests-643%20bestanden-brightgreen" alt="643 Tests bestanden"/>
  <img src="https://img.shields.io/badge/Lizenz-Proprietary-lightgrey" alt="Lizenz"/>
  <img src="https://img.shields.io/badge/Next.js-14.2-black" alt="Next.js 14.2"/>
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178c6" alt="TypeScript 5.6"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e" alt="Supabase"/>
  <img src="https://img.shields.io/badge/React-18.3-61dafb" alt="React 18.3"/>
</p>

---

**Was ist AI Hub?**
AI Hub vereint Wissensaustausch, strukturiertes Lernen, KI-Werkzeuge und Gamification
zu einer lebendigen Community-Plattform. Im Zentrum steht der **Cosmos Companion** — ein
animierter KI-Begleiter (der Orb), der auf jeder Dashboard-Seite mitschwebt, RAG-gestuetzte
Antworten aus der Best-Practices-Datenbank liefert und per Klick ein eingebettetes Chat-Panel
oeffnet. Multi-Provider AI-Routing (Gemini, OpenAI, Claude, Copilot) mit konfigurierbarer
Fallback-Chain sorgt fuer Verfuegbarkeit ohne Vendor-Lock-in.

**Mehrwert fuer Teams.**
Kurse, Lernpfade und Quiz-Module vermitteln KI-Kompetenz systematisch. Das Community Forum
und das Idea Board foerdern Wissensaustausch und KI-Ideenentwicklung. Ein XP- und
Achievements-System (7 Levels, 20 Achievements, 12 Badges, Streaks) macht Lernfortschritt
sichtbar und belohnend.

**Warum besonders?**
Privacy-Mode leitet alle KI-Anfragen zwingend auf Mistral EU (Frankreich) um und fuehrt
Suche vollstaendig im Browser durch (384-d lokale Embeddings, kein Netzwerk-Request). Admins
steuern Provider, Feature-Flags und API-Kosten ohne Code-Deployment. Alle 32 Datenbanktabellen
sind mit Row-Level-Security abgesichert; Provider-API-Keys liegen in Supabase Vault (pgsodium).

<p align="center">
  <a href="docs/SHOWCASE.md"><strong>Ausfuehrliche Praesentation hier</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/AI-HUB-Overview.html"><strong>User-Sicht (HTML)</strong></a>
</p>

---

<!-- Screenshots (Platzhalter bis Deployment) -->
<!--
<p align="center">
  <img src="docs/images/dashboard.png" alt="Dashboard mit XP-Fortschritt und Empfehlungen" width="700"/>
</p>
<p align="center">
  <img src="docs/images/orb-chat.png" alt="AI Orb mit geoeffnetem Chat-Panel" width="700"/>
</p>
-->

---

<p align="center">
  <img src="public/logo.svg" alt="AI Hub Logo" width="80" />
</p>

<h1 align="center">AI Hub</h1>

<p align="center">
  <strong>KI-Community-Plattform fuer Teams und Unternehmen</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version" />
  <img src="https://img.shields.io/badge/Next.js-14.2-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e" alt="Supabase" />
  <img src="https://img.shields.io/badge/React-18.3-61dafb" alt="React" />
  <img src="https://img.shields.io/badge/Tests-91%20Unit%20+%2014%20E2E-brightgreen" alt="Tests" />
  <img src="https://img.shields.io/badge/Build-Passing-success" alt="Build" />
  <img src="https://img.shields.io/badge/Seiten-51-informational" alt="Pages" />
</p>

<p align="center">
  Lernen, teilen und wachsen mit kuenstlicher Intelligenz.<br/>
  Der AI Hub vereint Wissensaustausch, Schulungen, KI-Werkzeuge und Gamification<br/>
  zu einer lebendigen Community-Plattform, die die KI-Kompetenz im gesamten Team foerdert.
</p>

---

## Inhaltsverzeichnis

- [WOW-Features](#-wow-features)
- [Feature-Uebersicht](#-feature-uebersicht)
- [Tech-Stack](#-tech-stack)
- [Architektur-Highlights](#-architektur-highlights)
- [Getting Started](#-getting-started)
- [Projektstruktur](#-projektstruktur)
- [API-Uebersicht](#-api-uebersicht)
- [Statistiken](#-statistiken)
- [Screenshots](#-screenshots)
- [Lizenz](#-lizenz)

---

## &#10024; WOW-Features

### &#9729;&#65039; Living Cloud (AI Orb) -- Das Alleinstellungsmerkmal

> **Der persistente, animierte KI-Begleiter, der auf jeder Seite der Plattform mitschwebt.**

Die **Living Cloud** ist weit mehr als ein Chat-Button -- sie ist ein **lebendiger, kontextbewusster KI-Begleiter**, der die gesamte Nutzererfahrung begleitet. Als modernes Fluid-Design-Element (`position: fixed`, rechts unten) schwebt sie ueber allen Seitenelementen und "reist" mit dem Nutzer durch die gesamte Plattform.

**Was sie besonders macht:**

- **64px Cosmos Orb** mit dynamischen Gradient-Farben (Gruen/Gold)
- **Breathing-Animation** mit organischem Pulsieren (3s-Zyklen)
- **Rotierender Ring** mit Gold-Partikel (8s-Zyklen)
- **Feier-Partikel** -- orbiting Glowing Dots bei Achievements
- **Per Klick** expandiert die Cloud fliessend zum vollstaendigen AI Mentor Chat-Panel

#### Die 7 Zust&auml;nde der Living Cloud

| State | Visuelles Verhalten | Tooltip (Deutsch) |
|-------|---------------------|-------------------|
| **idle** | Sanftes Gruen-Gold Pulsieren, Breathing-Animation | "Ich bin fuer dich da!" |
| **hover** | Scale 1.1, Farben werden satter, Tooltip erscheint | (kontextabhaengig) |
| **greeting** | Gold-dominanter Glow, Willkommens-Animation | "Willkommen zurueck!" |
| **listening** | Gruen-Gradient, beschleunigte Ring-Rotation | "Ich hoere zu..." |
| **thinking** | Gold-Gradient, Ring pausiert, Pulsieren beschleunigt | "Die KI denkt nach..." |
| **celebrating** | Gold-Partikel orbiten die Cloud, Feier-Glow | "Gratulation!" |
| **energized** | Gruen-Gold Schnell-Animation, energetischer Glow | "Du bist auf Feuer!" |

**Kontextuelles Verhalten:**

| Seite | Cloud-Reaktion |
|-------|----------------|
| Dashboard | Sanftes Idle-Pulsieren, Begruessung |
| AI Mentor | Wechselt zu "listening"-State |
| Nach Achievement | Celebration mit orbitierenden Gold-Partikeln |
| Leaderboard | Energized-Modus (Motivation) |
| Inaktivitaet | Sanftes einmaliges Pulsieren als Hilfsangebot |

**Technische Details:** 7 Dateien, Dynamic Import des Chat-Panels, `prefers-reduced-motion` Support, `aria-live` Region fuer Screen Reader, Framer Motion Animationen, Auto-Reset fuer transiente States.

---

### &#127758; Innovation Radar

> **SVG-basierte Visualisierung von KI-Trends mit 4 Ringen und 4 Quadranten**

Eine interaktive Radar-Darstellung, die auf einen Blick zeigt, welche KI-Themen im Unternehmen relevant sind:

- **4 konzentrische Ringe**: Adopt / Trial / Assess / Hold
- **4 Quadranten**: Techniques / Tools / Platforms / Frameworks
- **Topic-Sidebar** mit Suche und Filtern
- **Topic-Detail-Cards** mit Ring-Erklaerung und Abstimmung
- **Trending Topics** Component (Top 5)
- Vollstaendig SVG-basiert, responsive, performant

---

### &#129302; AI Mentor

> **Multi-Provider KI-Chat mit Use-Case-Bewertung**

Der AI Mentor ist das intelligente Herzstueck der Plattform:

- **Multi-Provider Chat** mit Streaming-Responses (Gemini, Claude, OpenAI, Copilot)
- **Automatische Fallback-Chain** bei Provider-Ausfaellen
- **Use-Case-Bewertungs-Engine** mit 5 gewichteten Dimensionen:
  - Unternehmensmehrwert (30%), Mitarbeitermehrwert (25%), Umsetzbarkeit (20%), Skalierbarkeit (15%), Innovationsgrad (10%)
- **Structured Output** mit Gesamtscore, Staerken-Analyse, Risiken, ROI-Schaetzung
- **Content Moderation** mit automatischer Filterung
- **Kosten-Tracking** pro Provider (fire-and-forget Logging)

---

## &#128640; Feature-Uebersicht

### Dashboard

Personalisiertes Dashboard mit Live-Daten:
- XP-Fortschrittsbalken mit Level-Anzeige (7 Levels)
- Streak-Widget mit Flammen-Tiers und Tagesanzeige
- Letzte Achievements mit Kategorie-Icons
- Personalisierte Empfehlungen aus 5 Datenquellen
- Aktivitaets-Feed, Community-Highlights, Quick Actions

### Community Forum

Vollstaendiges Diskussionsforum:
- Posts erstellen, bearbeiten, loeschen
- Verschachteltes Kommentar-System (bis 4 Ebenen)
- Toggle-Upvote-System mit DB-Constraint (kein Self-Vote XP)
- Filter und Sortierung (Typ, Tags, Neueste, Beliebteste)
- Pagination mit Meta-Daten
- 12 Badges (first-post, influencer, etc.)

### Idea Board

KI-gestuetzte Ideenverwaltung:
- Ideen-Grid mit Gold-Akzent-Cards
- Voting-System fuer Ideen
- Sortierung und Filterung
- KI-Bewertung von Use Cases (5 Dimensionen, 0-100 Score)
- Evaluation Dashboard mit Score-Visualisierung

### Learn-Hub

Umfassendes Lern-System:
- **Kurse**: 3 Kurse mit 16 Lektionen (Beginner bis Advanced)
- **Lektionen**: Markdown-Rendering mit XP-Animation
- **Quizzes**: Multiple-Choice, 70% Pass-Threshold, Sofort-Feedback
- **Zertifikate**: Automatische Generierung bei Kurs-Abschluss
- **Lernpfade**: 3 kuratierte Kurs-Reihenfolgen mit Stepper-UI und Enrollment
- Dreifache XP-Duplikat-Absicherung (App + DB + completed_at)

### Gamification

Motivationssystem mit Tiefe:
- **7 Levels**: Neugieriger (0 XP) bis KI-Visionaer (10.000 XP)
- **20 Achievements** in 4 Kategorien (Learning, Community, Innovation, Engagement)
- **Streaks**: Taegliche Login-Streaks mit Tier-System und Flammen-Animation
- **Challenges**: Backend komplett mit Join, Progress-Tracking, XP-Vergabe
- **XP-System**: Differenzierte Punkte pro Aktion (5-100 XP)

| Aktion | XP |
|--------|-----|
| Best Practice erstellen | 50 XP |
| Kurslektion abschliessen | 25 XP |
| Community-Beitrag | 15 XP |
| Challenge abschliessen | 100 XP |
| Taeglicher Login | 10 XP |

### Leaderboard

- Rangliste mit Perioden-Filter (Woche / Monat / Gesamt)
- Eigenes Ranking hervorgehoben
- Top-3-Podest-Darstellung
- Echte API-Daten aus Supabase

### Admin-Panel

6 vollstaendige Module:
- **KI-Konfiguration**: Provider-Management, Fallback-Chain, Parameter, Test-Sandbox
- **Benutzer-Verwaltung**: Rollen, XP-Anpassung, Badges
- **Content-Management**: Best Practices moderieren, Kurse verwalten
- **Analytics Dashboard**: Nutzungsstatistiken, KI-Metriken
- **System-Einstellungen**: Feature Flags, Wartungsmodus
- **Kosten-Dashboard**: API-Kosten pro Provider/Tag/Monat

### Semantic Search

- Vektorbasierte Suche mit **pgvector** (Supabase Extension)
- OpenAI text-embedding-3-small + lokaler Fallback
- Semantisch relevante Ergebnisse ueber alle Inhalte
- Rate Limiting geschuetzt

### Auto-Tagging

- Automatische Verschlagwortung von Inhalten durch KI-Analyse
- Integration in den AI Router
- Rate Limiting geschuetzt

### Sicherheit

- **Rate Limiting**: Upstash Redis mit 4 Tiers (ai, search, api, auth)
- **XSS-Schutz**: DOMPurify Sanitization auf allen HTML-Rendering-Stellen
- **Row Level Security**: 50+ RLS Policies in Supabase
- **Auth**: getUser() auf allen API-Endpoints (getSession komplett migriert)
- **Zod-Validierung**: Schema-Validierung auf allen API-Inputs

---

## &#128736; Tech-Stack

| Kategorie | Technologie | Version | Zweck |
|-----------|------------|---------|-------|
| **Framework** | Next.js | 14.2.x | React-Framework (App Router, SSR) |
| **UI** | React | 18.3.x | UI-Library |
| **Sprache** | TypeScript | 5.6.x | Typsicherheit (strict mode) |
| **Backend** | Supabase | 2.45.x | PostgreSQL, Auth, Realtime, Storage |
| **Vektorsuche** | pgvector | - | Semantic Search Embeddings |
| **Styling** | Tailwind CSS | 3.4.x | Utility-first CSS |
| **State** | Zustand | 5.0.x | Leichtgewichtiges State Management |
| **Animationen** | Framer Motion | 11.5.x | Living Cloud, Transitions |
| **AI SDK** | Vercel AI SDK | 4.0.x | Multi-Provider AI-Integration |
| **AI: Gemini** | @ai-sdk/google | 1.0.x | Standard-Provider |
| **AI: Claude** | @ai-sdk/anthropic | 1.0.x | Fallback-Provider |
| **AI: OpenAI** | @ai-sdk/openai | 1.0.x | Embeddings + Fallback |
| **Validierung** | Zod | 3.23.x | Schema-Validierung (API + Forms) |
| **Rate Limiting** | @upstash/ratelimit | 2.0.x | Redis-basiertes Rate Limiting |
| **XSS-Schutz** | isomorphic-dompurify | 2.36.x | HTML Sanitization |
| **Datums** | date-fns | 4.1.x | Datumsformatierung |
| **Icons** | Lucide React | 0.454.x | Icon-Library |
| **CSS Utils** | clsx + tailwind-merge | - | Bedingte Klassen |
| **Unit-Tests** | Vitest | 4.0.x | Schnelle Unit-Tests |
| **Komponententests** | Testing Library | 16.3.x | React-Komponententests |
| **E2E-Tests** | Playwright | 1.58.x | Browser-Automatisierung |
| **Linting** | ESLint | 8.57.x | Code-Qualitaet |
| **CSS Plugins** | @tailwindcss/forms, /typography | 0.5.x | Form- und Prosa-Styling |

---

## &#127959; Architektur-Highlights

### Multi-Provider AI Router

```
Fallback Chain: Gemini --> OpenAI --> Claude --> Copilot

[Frontend] --> [API Route /api/ai/*]
                      |
                      v
              [AI Router Class]
                      |
         +------------+------------+-----------+
         v            v            v           v
     [Gemini]    [OpenAI]     [Claude]   [Copilot]
      API          API          API      Azure API

Features: Streaming, Health Check, Cost Tracking, Auto-Fallback
Services: Chat, Embeddings, Auto-Tagging, Use-Case Evaluation
```

### Feature-Sliced Architecture

Die Komponenten sind nach Features organisiert, nicht nach technischer Schicht:
- `components/features/ai-orb/` -- Living Cloud (7 Dateien)
- `components/features/innovation-radar/` -- Radar-Visualisierung (5 Dateien)
- `components/features/gamification/` -- XP, Levels, Badges (8 Dateien)
- `components/features/dashboard/` -- Dashboard-Widgets (13 Dateien)
- `components/features/learn-hub/` -- Lernpfade, Quiz (5 Dateien)
- `components/features/community/` -- Forum, Idea Board (5 Dateien)
- `components/features/admin/` -- Admin-Panel (9 Dateien)

### Supabase (29 Tabellen, 50+ RLS Policies, pgvector)

- 7 Migrations (Initial Schema, Feature Flags, Semantic Search, Learn Hub, Linter Fix, Learning Paths, Gamification)
- 15 DB-Functions, 10 Triggers, 3 Views
- Auto-Profil-Erstellung bei Registrierung (DB-Trigger)
- pgvector Extension fuer Embedding-basierte Suche
- Row Level Security auf allen Tabellen

### API-Architektur (31 Routes, Zod-Validierung, Rate Limiting)

- Konsistente Auth mit `requireAuth()` / `requireAdmin()` Middleware
- Zod-Validierung auf allen Inputs
- Einheitliche Response-Formate (`apiSuccess` / `apiError` Pattern)
- Rate Limiting auf AI- und Search-Routen (Upstash Redis, 4 Tiers: ai, search, api, auth)
- Fire-and-forget Cost Logging fuer alle AI-Calls

---

## &#128187; Getting Started

### Voraussetzungen

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Supabase CLI** >= 1.200.x (`npm install -g supabase`)
- Ein Supabase-Projekt (lokal oder gehostet)
- Mindestens ein AI-Provider API-Key (Gemini, Claude oder OpenAI)

### 1. Repository klonen

```bash
git clone <repository-url>
cd ai-hub
```

### 2. Abhaengigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env.local
```

Folgende Variablen muessen gesetzt werden:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<deine-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dein-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dein-service-role-key>

# AI Providers (mindestens einen konfigurieren)
GOOGLE_AI_API_KEY=<dein-google-ai-key>
ANTHROPIC_API_KEY=<dein-anthropic-key>
OPENAI_API_KEY=<dein-openai-key>
COPILOT_API_KEY=<dein-copilot-key>

# Standard-Provider
AI_DEFAULT_PROVIDER=gemini

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL=<deine-upstash-url>
UPSTASH_REDIS_REST_TOKEN=<dein-upstash-token>
```

### 4. Datenbank einrichten

```bash
# Lokale Supabase-Instanz starten
npm run supabase:start

# Migrationen ausfuehren (7 Migrations)
npm run supabase:reset

# TypeScript-Typen generieren
npm run supabase:types
```

### 5. Development Server starten

```bash
npm run dev
```

Die Anwendung ist unter [http://localhost:3000](http://localhost:3000) erreichbar.

### 6. Tests ausfuehren

```bash
# Unit-Tests (91 Tests)
npm test

# E2E-Tests (14 Tests)
npm run test:e2e

# Coverage-Report
npm run test:coverage
```

---

## &#128193; Projektstruktur

```
ai-hub/
├── .env.example                    # Umgebungsvariablen-Vorlage
├── .github/
│   └── workflows/ci.yml           # GitHub Actions CI Pipeline
├── concept/
│   └── PROGRESS.md                # Detaillierter Projektfortschritt
├── public/                         # Statische Assets
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (admin)/                # Admin-Panel (Route Group)
│   │   │   └── admin/
│   │   │       ├── ai-config/      # KI-Konfiguration
│   │   │       ├── analytics/      # Analytics Dashboard
│   │   │       ├── content/        # Content-Management
│   │   │       ├── settings/       # System-Einstellungen
│   │   │       └── users/          # Benutzer-Verwaltung
│   │   ├── (auth)/                 # Authentifizierung (Route Group)
│   │   │   ├── login/              # Login-Seite
│   │   │   ├── register/           # Registrierung
│   │   │   └── forgot-password/    # Passwort vergessen
│   │   ├── (dashboard)/            # Dashboard (Route Group)
│   │   │   ├── ai-mentor/          # AI Mentor Chat
│   │   │   ├── best-practices/     # Best Practices Library
│   │   │   ├── challenges/         # Challenges
│   │   │   ├── community/          # Forum + Idea Board
│   │   │   ├── dashboard/          # Haupt-Dashboard
│   │   │   ├── innovation-radar/   # Innovation Radar
│   │   │   ├── leaderboard/        # Rangliste
│   │   │   ├── learn-hub/          # Kurse + Lernpfade
│   │   │   ├── notifications/      # Benachrichtigungen
│   │   │   └── profile/            # Profil + Settings + Achievements
│   │   ├── api/                    # 31 API-Routes (siehe API-Uebersicht)
│   │   ├── globals.css             # Globale Styles + Animationen
│   │   ├── layout.tsx              # Root Layout
│   │   └── page.tsx                # Landing Page
│   ├── components/
│   │   ├── features/               # Feature-spezifische Komponenten
│   │   │   ├── admin/              # Admin-Panel (9 Dateien)
│   │   │   ├── ai-orb/             # Living Cloud (7 Dateien)
│   │   │   ├── best-practices/     # Best Practices (4 Dateien)
│   │   │   ├── community/          # Forum + Ideas (4 Dateien)
│   │   │   ├── dashboard/          # Dashboard-Widgets (13 Dateien)
│   │   │   ├── gamification/       # XP, Levels, Badges (8 Dateien)
│   │   │   ├── innovation-radar/   # Radar-Visualisierung (5 Dateien)
│   │   │   ├── learn-hub/          # Kurse + Quiz (5 Dateien)
│   │   │   └── leaderboard/        # Rangliste (1 Datei)
│   │   ├── layout/                 # Header, Footer, Sidebar
│   │   ├── providers/              # React Context Provider
│   │   ├── shared/                 # Wiederverwendbare Komponenten
│   │   └── ui/                     # Basis-UI-Komponenten
│   ├── config/                     # AI- und Site-Konfiguration
│   ├── constants/                  # Routes, Navigation, Konstanten
│   ├── hooks/                      # Custom React Hooks (10+)
│   ├── lib/
│   │   ├── ai/                     # AI-Provider-Integration
│   │   │   ├── providers/          # Gemini, Claude, OpenAI, Copilot
│   │   │   ├── prompts/            # System-Prompts
│   │   │   ├── router.ts           # AI Router mit Fallback
│   │   │   ├── embeddings.ts       # Embedding-Service
│   │   │   ├── auto-tagger.ts      # Auto-Tagging Service
│   │   │   └── use-case-evaluator.ts # Use-Case Bewertung
│   │   ├── api/                    # API-Client, Rate Limiting
│   │   ├── supabase/               # Supabase-Client und Typen
│   │   ├── utils/                  # Utility-Funktionen (cn, sanitize)
│   │   ├── validators/             # Zod-Schemas (10+ Dateien)
│   │   └── gamification/           # Achievement-Check + XP-Logik
│   ├── stores/                     # Zustand State Stores (5+)
│   ├── styles/                     # Globale Styles
│   ├── types/                      # TypeScript-Typdefinitionen
│   └── middleware.ts               # Auth + Routing Middleware
├── supabase/
│   ├── migrations/                 # 7 SQL-Migrationen
│   ├── seed/                       # Seed-Daten (Demo-User, Kurse, etc.)
│   └── functions/                  # Edge Functions
├── tests/
│   ├── unit/                       # 91 Unit-Tests (Vitest)
│   ├── integration/                # Integrationstests
│   ├── e2e/                        # 14 E2E-Tests (Playwright)
│   └── setup.ts                    # Test-Setup
├── next.config.js                  # Next.js-Konfiguration
├── tailwind.config.ts              # Tailwind CSS-Konfiguration
├── tsconfig.json                   # TypeScript strict mode
├── vitest.config.ts                # Vitest-Konfiguration
└── package.json                    # Abhaengigkeiten und Scripts
```

---

## &#128268; API-Uebersicht

### AI-Routen (Rate Limited)

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| POST | `/api/ai/chat` | AI Mentor Chat mit Streaming |
| POST | `/api/ai/completion` | Text-Vervollstaendigung |
| POST | `/api/ai/evaluate` | Use-Case-Bewertung (5 Dimensionen) |
| POST | `/api/ai/auto-tag` | Automatisches Tagging von Inhalten |

### Community-Routen

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| GET/POST | `/api/community/posts` | Posts auflisten / erstellen |
| GET/PATCH/DELETE | `/api/community/posts/[postId]` | Post lesen / bearbeiten / loeschen |
| GET/POST | `/api/community/posts/[postId]/comments` | Kommentare auflisten / erstellen |
| POST | `/api/community/posts/[postId]/vote` | Toggle-Upvote |

### Learn-Hub-Routen

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| GET | `/api/learn-hub/courses` | Kurse auflisten |
| GET | `/api/learn-hub/courses/[courseId]` | Kurs-Detail |
| GET | `/api/learn-hub/courses/[courseId]/lessons/[lessonId]` | Lektion laden |
| POST | `/api/learn-hub/courses/[courseId]/complete` | Lektion abschliessen |
| GET | `/api/learn-hub/paths` | Lernpfade auflisten |
| GET/POST | `/api/learn-hub/paths/[pathId]` | Lernpfad-Detail / Enrollment |

### Gamification-Routen

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| GET | `/api/gamification/achievements` | Achievements mit Progress |
| GET | `/api/gamification/badges` | Alle Badges |
| GET | `/api/leaderboard` | Rangliste (Period-Filter) |
| GET | `/api/challenges` | Challenges auflisten |
| GET/POST | `/api/challenges/[challengeId]` | Challenge-Detail / Join |
| PATCH | `/api/challenges/[challengeId]/progress` | Challenge-Fortschritt |

### Weitere Routen

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| GET/PATCH | `/api/profile` | Profil lesen / aktualisieren |
| GET | `/api/recommendations` | Personalisierte Empfehlungen |
| POST | `/api/search` | Semantische Suche (Rate Limited) |
| GET | `/api/innovation-radar` | Radar-Themen laden |
| POST | `/api/cron` | Cron-Job Endpoint |
| POST | `/api/webhooks/supabase` | Supabase Webhook |

### Admin-Routen (requireAdmin)

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| GET/POST | `/api/admin/providers` | Provider-Verwaltung |
| POST | `/api/admin/providers/test` | Provider-Sandbox |
| GET | `/api/admin/costs` | Kosten-Dashboard |
| GET/POST | `/api/admin/prompts` | System-Prompts verwalten |
| GET/POST | `/api/admin/features` | Feature Flags |

---

## &#128202; Statistiken

| Metrik | Wert |
|--------|------|
| **Codebase** | ~32.000+ LOC |
| **Quelldateien** | 232 Dateien in `src/` |
| **TypeScript-Dateien** | 220 `.ts`/`.tsx` |
| **React-Komponenten** | 70+ |
| **Seiten (Build)** | 51 |
| **API-Routes** | 31 |
| **Unit-Tests** | 91 (Vitest) |
| **E2E-Tests** | 14 (Playwright) |
| **DB-Tabellen** | 29 |
| **RLS Policies** | 50+ |
| **DB-Migrationen** | 7 |
| **DB-Functions** | 15 |
| **DB-Triggers** | 10 |
| **Zustand Stores** | 5+ |
| **Custom Hooks** | 10+ |
| **Zod Validators** | 10+ |
| **Achievements** | 20 (4 Kategorien) |
| **Levels** | 7 |
| **Badges** | 13 |
| **Seed-Kurse** | 3 Kurse, 16 Lektionen, 3 Quizzes |
| **Lernpfade** | 3 |
| **AI Provider** | 4 (Gemini, Claude, OpenAI, Copilot) |
| **TypeScript Errors** | 0 |
| **Build-Status** | Erfolgreich |

---

## &#128247; Screenshots

> Screenshots werden hier ergaenzt, sobald die Plattform deployed ist.

### Dashboard
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
_Personalisiertes Dashboard mit XP-Fortschritt, Streak-Widget, Empfehlungen und Achievements_

### Living Cloud (AI Orb)
<!-- ![Living Cloud](docs/screenshots/living-cloud.png) -->
_Der animierte KI-Begleiter im idle-State mit Breathing-Animation und rotierendem Ring_

### AI Mentor Chat
<!-- ![AI Mentor](docs/screenshots/ai-mentor-chat.png) -->
_Chat-Panel mit Streaming-Responses, Kontext-Banner und Quick Actions_

### Innovation Radar
<!-- ![Innovation Radar](docs/screenshots/innovation-radar.png) -->
_SVG-basierte Radar-Visualisierung mit 4 Ringen und Topic-Sidebar_

### Learn-Hub
<!-- ![Learn-Hub](docs/screenshots/learn-hub.png) -->
_Kurs-Uebersicht mit Fortschrittsbalken und Lernpfad-Stepper_

### Community Forum
<!-- ![Community](docs/screenshots/community.png) -->
_Forum mit Posts, Kommentaren, Voting und Badges_

### Admin-Panel
<!-- ![Admin Panel](docs/screenshots/admin-panel.png) -->
_KI-Konfiguration mit Provider-Management und Fallback-Chain_

---

## &#128221; Scripts

| Script | Befehl | Beschreibung |
|--------|--------|-------------|
| `dev` | `npm run dev` | Development Server starten |
| `build` | `npm run build` | Production Build erstellen |
| `start` | `npm run start` | Production Server starten |
| `lint` | `npm run lint` | ESLint-Pruefung |
| `lint:fix` | `npm run lint:fix` | ESLint automatisch beheben |
| `type-check` | `npm run type-check` | TypeScript-Pruefung ohne Build |
| `test` | `npm test` | Alle Unit-Tests ausfuehren (91 Tests) |
| `test:watch` | `npm run test:watch` | Tests im Watch-Modus |
| `test:coverage` | `npm run test:coverage` | Tests mit Coverage-Report |
| `test:e2e` | `npm run test:e2e` | E2E-Tests ausfuehren (14 Tests) |
| `supabase:start` | `npm run supabase:start` | Lokale Supabase-Instanz starten |
| `supabase:stop` | `npm run supabase:stop` | Lokale Supabase-Instanz stoppen |
| `supabase:reset` | `npm run supabase:reset` | DB zuruecksetzen (Migrations + Seed) |
| `supabase:types` | `npm run supabase:types` | TypeScript-Typen aus DB generieren |

---

## &#128274; Lizenz

**Proprietary / Internal Use Only**

Dieses Projekt ist fuer den internen Gebrauch bestimmt.
Jegliche Vervielfaeltigung, Weitergabe oder Nutzung ist ohne ausdrueckliche Genehmigung untersagt.

(c) 2025-2026 AI Hub. Alle Rechte vorbehalten.

---

<p align="center">
  <sub>Erstellt mit Next.js, TypeScript, Supabase und viel KI-Begeisterung.</sub>
</p>
