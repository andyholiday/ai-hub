# Admin-Panel

**Was es ist:** Ein rollengeschuetzter Administrationsbereich (`/admin`) mit sechs Modulen: KI-Provider-Konfiguration, Provider-Sandbox, Feature-Flags, Content-Moderation, Kosten-Dashboard und Nutzer-Verwaltung.

## Mehrwert / Benefit

Admins steuern das gesamte KI-System der Plattform ohne Code-Deployment: Provider aktivieren/deaktivieren, Fallback-Ketten konfigurieren, System-Prompts versionieren, Feature-Flags global umschalten und API-Kosten in Echtzeit beobachten.

## User-Prozess

1. Admin-Nutzer navigiert zu `/admin` — nicht-admin User werden abgewiesen (HTTP 403).
2. **KI-Konfiguration** (`/admin/ai-config`):
   - Provider-Cards (Gemini, OpenAI, Claude, Copilot) zeigen Status, Modell, Temperature, Max-Tokens.
   - API-Keys koennen ueber ein Modal (ProviderKeyModal) gesetzt werden — Keys landen in Supabase Vault, nicht im Client-Bundle.
   - **Fallback-Chain** als visuelle Kette dargestellt; Reihenfolge ist konfigurierbar.
   - **Provider-Sandbox** (Sandbox-Tab): gleichen Prompt an beliebigen Provider senden, Antwort + Latenz sehen.
   - **System-Prompts** (versioniert): lesen, bearbeiten, neue Version erstellen.
   - **Feature-Toggles:** globale Feature-Flags umschalten.
   - **Kosten-Dashboard:** API-Ausgaben nach Provider, Token-Typ (Input/Output) und Zeitraum (Tag/Woche/Monat).
3. **Nutzer-Verwaltung** (`/admin/users`): Platzhalter (UI noch nicht implementiert).
4. **Content-Management** (`/admin/content`): Inhalte moderieren (Entwurf → Published → Gesperrt).
5. **Analytics** (`/admin/analytics`): Nutzungsstatistiken und KI-Metriken.

## Einfachheit & Fuehrung

- Alle Admin-Aktionen sind in einer einzigen Seite mit Tabs gebundelt — kein Navigieren zwischen mehreren Seiten.
- **Provider-Sandbox** erlaubt risikoloses Testen neuer Prompts oder Provider, bevor sie fuer alle Nutzer aktiv sind.
- **Kosten-Dashboard** macht Budget-Entscheidungen datenbasiert.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Admin-Seite (KI-Config) | `src/app/(admin)/admin/ai-config/page.tsx` |
| Admin-Seite (Nutzer) | `src/app/(admin)/admin/users/page.tsx` (Platzhalter) |
| Admin-Seite (Content) | `src/app/(admin)/admin/content/page.tsx` |
| Admin-Seite (Analytics) | `src/app/(admin)/admin/analytics/page.tsx` |
| Admin-Daten-Hook | `src/hooks/use-admin-data.ts` |
| Provider-API | `src/app/api/admin/providers/route.ts` |
| Provider-Test-API | `src/app/api/admin/providers/test/route.ts` (POST) |
| System-Prompts-API | `src/app/api/admin/prompts/route.ts` |
| Features-API | `src/app/api/admin/features/route.ts` |
| Content-API | `src/app/api/admin/content/route.ts` |
| Kosten-API | `src/app/api/admin/costs/route.ts` |
| Nutzer-API | `src/app/api/admin/users/route.ts` |
| Auth-Guard | `src/lib/api/admin-auth.ts` — `requireAdmin()` auf allen `/api/admin/*`-Routen |
| DB-Tabellen | `ai_providers`, `system_prompts`, `ai_cost_log`, `feature_flags` |

**Sicherheits-Hinweis (Audit):** Der Provider-Test-Endpoint (`/api/admin/providers/test`) nutzt aktuell `getAIRouter()` statt `getAIRouterWithDBKeys()` — d.h. er verwendet ENV-Keys statt der DB/Vault-Keys. Dies ist ein bekanntes P1-Issue aus dem Audit.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| KI-Provider-Konfiguration | Live |
| Provider-Sandbox | Live (API-Key-Bug: verwendet ENV statt DB-Keys) |
| System-Prompts (Versionen) | Live |
| Feature-Toggles | Live |
| Kosten-Dashboard | Live |
| Content-Moderation | Live |
| Nutzer-Verwaltung (`/admin/users`) | UI-Platzhalter — API vorhanden, UI fehlt |
| Analytics | Live (Basic-Kennzahlen) |
| Admin-lesbare Audit-Logs (C2PA) | API noch nicht implementiert (Phase 5) |
