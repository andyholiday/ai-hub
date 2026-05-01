# ADR-001: AI Hub Projektarchitektur

## Status
Accepted

## Kontext
Die AI Hub Plattform benoetigte eine skalierbare, wartbare Projektstruktur fuer eine KI-Community-Plattform, die Feature-basierte Organisation mit klarer Trennung von Concerns verbindet. Die Plattform muss mehrere KI-Provider unterstuetzen, Echtzeit-Features bieten und ein Gamification-System integrieren.

## Entscheidung
Feature-Sliced Architecture mit Next.js 14 App Router, getrennt in:
- `app/` - Routing und Seitenstruktur (Route Groups fuer Auth, Dashboard, Admin)
- `components/` - UI-Komponenten (ui/, layout/, features/, shared/, providers/)
- `lib/` - Business Logic (ai/, supabase/, utils/, validators/)
- `types/` - TypeScript-Typen (entities, api)
- `stores/` - Zustand State Management
- `hooks/` - Custom React Hooks
- `constants/` - Konfigurationskonstanten
- `config/` - App-Konfiguration

### AI Provider Abstraction
Strategy Pattern mit abstrahiertem Router, der zwischen Gemini, Claude, OpenAI und Copilot wechseln kann. Fallback-Chain fuer hohe Verfuegbarkeit.

### Supabase Integration
Drei Client-Varianten: Browser (Client Components), Server (Server Components/Actions), Admin (Service Role). Middleware fuer Session-Refresh.

## Alternativen
1. **Monolithisches Layout** - Abgelehnt: Nicht skalierbar bei wachsender Feature-Anzahl
2. **Micro-Frontend** - Abgelehnt: Over-Engineering fuer aktuelle Teamgroesse
3. **Pages Router** - Abgelehnt: App Router ist der Next.js Standard mit besserer Server Component Unterstuetzung

## Konsequenzen
### Positiv
- Klare Zustaendigkeiten pro Verzeichnis
- Einfaches Onboarding neuer Entwickler
- Gute Testbarkeit durch Trennung von Concerns
- Typsicherheit durchgehend via TypeScript
- AI-Provider sind austauschbar ohne Code-Aenderungen in Features

### Negativ
- Initiale Einrichtungskomplexitaet
- Mehr Dateien als bei flacher Struktur
- Import-Pfade koennen lang werden (gemildert durch Path Aliases)

## Compliance
- [x] DSGVO-konform: Supabase Self-Hosted moeglich, keine externen Tracker
- [x] Security-Review: Middleware Auth, RLS auf Datenbank-Ebene
- [x] Performance-Impact: Server Components als Standard, Client Components nur wo noetig
