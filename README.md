# LR AI Hub

**Die KI-Community-Plattform fuer LR Health & Beauty Systems Partner.**

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e)
![Tests](https://img.shields.io/badge/Tests-91%20Unit--Tests-brightgreen)

---

Lernen, teilen und wachsen mit kuenstlicher Intelligenz. Der LR AI Hub ist eine interne Community-Plattform, die LR-Partnern den Zugang zu modernen KI-Werkzeugen, Best Practices und einer aktiven Wissensgemeinschaft ermoeglicht.

---

## Inhaltsverzeichnis

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Projektstruktur](#projektstruktur)
- [AI Providers](#ai-providers)
- [Testing](#testing)
- [Scripts](#scripts)
- [Dokumentation](#dokumentation)
- [Lizenz](#lizenz)

---

## Features

### Dashboard
Personalisiertes Dashboard mit Aktivitaetsuebersicht, XP-Fortschritt, neuesten Best Practices und Community-Highlights.

### Best Practices Library
Kuratierte Sammlung von KI-Anwendungsbeispielen und Anleitungen mit Semantic Search und Auto-Tagging durch KI.

### Community Forum
Diskussionsforum fuer den Austausch zwischen LR-Partnern. KI-gestuetzte Thread-Zusammenfassungen helfen, den Ueberblick zu behalten.

### AI Mentor Chat
Persoenlicher KI-Berater, der Fragen rund um KI-Nutzung im LR-Kontext beantwortet. Unterstuetzt durch eine Multi-Provider-Architektur mit Fallback-Chain.

### Living Cloud (AI Orb)
Interaktives, animiertes KI-Element als visueller Begleiter auf der Plattform.

### Gamification
Motivationssystem mit XP-Punkten, Leveln und Badges:

| Aktion | XP |
|---|---|
| Best Practice erstellen | 50 XP |
| Kurslektion abschliessen | 25 XP |
| Community-Beitrag | 15 XP |
| Kommentar | 5 XP |
| Like erhalten | 3 XP |
| Challenge abschliessen | 100 XP |
| Taeglicher Login | 10 XP |

### Innovation Radar
Uebersicht ueber aktuelle KI-Trends und Technologien, relevant fuer das LR-Geschaeftsfeld.

### Admin Panel
Verwaltungsoberflaeche fuer Content-Management, Nutzerverwaltung und Feature Flags.

### Semantic Search
Vektorbasierte Suche mit pgvector fuer semantisch relevante Ergebnisse ueber alle Inhalte hinweg.

### Auto-Tagging
Automatische Verschlagwortung von Inhalten durch KI-Analyse.

---

## Tech Stack

| Technologie | Version | Zweck |
|---|---|---|
| **Next.js** | 14.2.x | React-Framework (App Router) |
| **React** | 18.3.x | UI-Library |
| **TypeScript** | 5.6.x | Typsicherheit |
| **Supabase** | 2.45.x | Backend (PostgreSQL, Auth, Realtime, Edge Functions) |
| **pgvector** | - | Vektorsuche / Embeddings |
| **Tailwind CSS** | 3.4.x | Utility-first CSS |
| **Zustand** | 5.0.x | State Management |
| **Framer Motion** | 11.5.x | Animationen |
| **Vercel AI SDK** | 4.0.x | Multi-Provider AI-Integration |
| **Zod** | 3.23.x | Schema-Validierung |
| **Recharts** | 2.13.x | Diagramme / Datenvisualisierung |
| **Lucide React** | 0.454.x | Icon-Library |
| **Vitest** | 4.0.x | Unit- und Integrationstests |
| **Testing Library** | 16.3.x | Komponententests |

---

## Getting Started

### Voraussetzungen

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Supabase CLI** >= 1.200.x (`npm install -g supabase`)
- Ein Supabase-Projekt (lokal oder gehostet)
- Mindestens ein AI-Provider API-Key (Gemini, Claude, OpenAI oder Copilot)

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd lr-ai-hub

# Abhaengigkeiten installieren
npm install
```

### Environment Setup

Die Datei `.env.example` im Projektstamm enthaelt alle benoetigten Umgebungsvariablen.

```bash
# .env.example nach .env.local kopieren
cp .env.example .env.local
```

Folgende Variablen muessen konfiguriert werden:

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

# Standard-Provider festlegen
AI_DEFAULT_PROVIDER=gemini
```

### Datenbank Setup

```bash
# Lokale Supabase-Instanz starten
npm run supabase:start

# Migrationen ausfuehren (Initial Schema, Feature Flags, Semantic Search)
npm run supabase:reset

# TypeScript-Typen generieren
npm run supabase:types
```

Die folgenden Migrationen werden automatisch ausgefuehrt:

1. `00001_initial_schema.sql` -- Grundlegendes Datenbankschema
2. `00002_feature_flags.sql` -- Feature-Flag-System
3. `00003_semantic_search.sql` -- pgvector-Extension und Embedding-Tabellen

### Development Server starten

```bash
npm run dev
```

Die Anwendung ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

---

## Projektstruktur

```
lr-ai-hub/
├── docs/                       # Projektdokumentation
│   ├── adr/                    # Architecture Decision Records
│   └── api/                    # API-Dokumentation
├── public/                     # Statische Assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/            # Admin-Panel (Route Group)
│   │   ├── (auth)/             # Authentifizierung (Route Group)
│   │   ├── (dashboard)/        # Dashboard (Route Group)
│   │   ├── api/                # API-Routes
│   │   ├── layout.tsx          # Root Layout
│   │   └── page.tsx            # Landing Page
│   ├── components/
│   │   ├── features/           # Feature-spezifische Komponenten
│   │   ├── layout/             # Layout-Komponenten (Header, Footer, Sidebar)
│   │   ├── providers/          # React Context Provider
│   │   ├── shared/             # Wiederverwendbare Komponenten
│   │   └── ui/                 # Basis-UI-Komponenten
│   ├── config/                 # Konfigurationsdateien
│   │   ├── ai.ts               # AI Feature-Konfiguration
│   │   └── site.ts             # Site-Konfiguration
│   ├── constants/              # Konstanten
│   ├── hooks/                  # Custom React Hooks
│   ├── lib/
│   │   ├── ai/                 # AI-Provider-Integration
│   │   ├── api/                # API-Client und Hilfsfunktionen
│   │   ├── supabase/           # Supabase-Client und Typen
│   │   ├── utils/              # Utility-Funktionen
│   │   └── validators/         # Zod-Schemas / Validierung
│   ├── stores/                 # Zustand State Stores
│   ├── styles/                 # Globale Styles
│   ├── types/                  # TypeScript-Typdefinitionen
│   └── middleware.ts           # Next.js Middleware (Auth, Routing)
├── supabase/
│   ├── functions/              # Supabase Edge Functions
│   ├── migrations/             # Datenbank-Migrationen
│   └── seed/                   # Seed-Daten
├── tests/
│   ├── e2e/                    # End-to-End Tests
│   ├── integration/            # Integrationstests
│   ├── unit/                   # Unit-Tests
│   └── setup.ts                # Test-Setup
├── .env.example                # Umgebungsvariablen-Vorlage
├── next.config.js              # Next.js-Konfiguration
├── tailwind.config.ts          # Tailwind CSS-Konfiguration
├── tsconfig.json               # TypeScript-Konfiguration
├── vitest.config.ts            # Vitest-Konfiguration
└── package.json                # Abhaengigkeiten und Scripts
```

---

## AI Providers

Der LR AI Hub verwendet eine **Multi-Provider-Architektur** mit automatischer Fallback-Chain. Das Vercel AI SDK (`ai` v4) abstrahiert die Provider-Kommunikation.

### Unterstuetzte Provider

| Provider | SDK-Paket | Primaerer Einsatz |
|---|---|---|
| **Google Gemini** | `@ai-sdk/google` | Content-Vorschlaege, Thread-Zusammenfassungen |
| **Anthropic Claude** | `@ai-sdk/anthropic` | Allgemeiner AI Mentor |
| **OpenAI** | `@ai-sdk/openai` | Quiz-Generierung |
| **Microsoft Copilot** | Custom | Ergaenzender Provider |

### Fallback-Chain

Wenn der primaere Provider nicht erreichbar ist, wird automatisch auf den naechsten verfuegbaren Provider gewechselt. Die Reihenfolge wird ueber `AI_DEFAULT_PROVIDER` und die Verfuegbarkeit der API-Keys bestimmt.

### Rate Limiting

Zum Schutz der API-Kosten gelten folgende Limits pro Nutzer:

| Limit | Wert |
|---|---|
| Nachrichten pro Stunde | 60 |
| Nachrichten pro Tag | 500 |
| Sessions pro Tag | 20 |
| Max. Nachrichtenlaenge | 5.000 Zeichen |
| Max. Tokens pro Request | 4.096 |

### Content Moderation

Die integrierte Content-Moderation filtert automatisch:
- Beleidigungen und unangemessene Sprache
- Persoenliche Daten (Datenschutz)

---

## Testing

Das Projekt verwendet **Vitest** als Test-Framework zusammen mit **Testing Library** fuer Komponententests.

```bash
# Alle Tests ausfuehren (91 Unit-Tests)
npm test

# Tests im Watch-Modus
npm run test:watch

# Tests mit Coverage-Report
npm run test:coverage
```

### Teststruktur

```
tests/
├── e2e/            # End-to-End Tests (Browser)
├── integration/    # Integrationstests (API, DB)
├── unit/           # Unit-Tests (Funktionen, Komponenten)
└── setup.ts        # Globales Test-Setup
```

---

## Scripts

| Script | Befehl | Beschreibung |
|---|---|---|
| `dev` | `npm run dev` | Startet den Next.js Development Server |
| `build` | `npm run build` | Erstellt einen Production Build |
| `start` | `npm run start` | Startet den Production Server |
| `lint` | `npm run lint` | Fuehrt ESLint-Pruefung aus |
| `lint:fix` | `npm run lint:fix` | Behebt ESLint-Fehler automatisch |
| `type-check` | `npm run type-check` | TypeScript-Typpruefung ohne Build |
| `test` | `npm test` | Fuehrt alle Tests aus |
| `test:watch` | `npm run test:watch` | Tests im Watch-Modus |
| `test:coverage` | `npm run test:coverage` | Tests mit Coverage-Report |
| `supabase:start` | `npm run supabase:start` | Startet lokale Supabase-Instanz |
| `supabase:stop` | `npm run supabase:stop` | Stoppt lokale Supabase-Instanz |
| `supabase:reset` | `npm run supabase:reset` | Setzt Datenbank zurueck (Migrationen + Seed) |
| `supabase:types` | `npm run supabase:types` | Generiert TypeScript-Typen aus DB-Schema |

---

## Dokumentation

Weitere Dokumentation befindet sich im Verzeichnis `docs/`:

- **`docs/adr/`** -- Architecture Decision Records: Dokumentation wichtiger Architekturentscheidungen
- **`docs/api/`** -- API-Dokumentation: Beschreibung der verfuegbaren API-Endpunkte

---

## Lizenz

**Proprietary / Internal Use Only**

Dieses Projekt ist ausschliesslich fuer den internen Gebrauch bei LR Health & Beauty Systems bestimmt. Jegliche Vervielfaeltigung, Weitergabe oder Nutzung ausserhalb des Unternehmens ist ohne ausdrueckliche Genehmigung untersagt.

(c) 2025-2026 LR Health & Beauty Systems. Alle Rechte vorbehalten.
