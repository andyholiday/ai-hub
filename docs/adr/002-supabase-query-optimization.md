# ADR-002: Supabase Query-Optimierung fuer Free Tier Compliance

## Status
Accepted

## Datum
2026-02-21

## Kontext

Das AI Hub Projekt (Next.js 14 + Supabase Free Tier) hat eine zu hohe Query-Last, die das Free Tier Limit gefaehrdet. Eine Analyse der Hotspots ergab, dass ein einzelner Dashboard-Load zwischen 10 und 13 Datenbank-Queries ausloest. Hinzu kommt eine "RLS-Amplifikation": Die Helper-Funktionen `is_admin()` und `is_moderator_or_above()` fuehren bei JEDEM RLS-Policy-Check einen zusaetzlichen Profile-Query aus. Da diese Funktionen in Policies von ueber 15 Tabellen referenziert werden, multipliziert sich die Last massiv.

### Ist-Zustand (vor Optimierung)

**Pro Dashboard-Load (normaler User):**

| Schritt | Queries | Beschreibung |
|---------|---------|--------------|
| Middleware | 1 Auth-API + 0-1 DB | `getUser()` + ggf. Admin profile check |
| requireAuth (Profile API) | 1 Auth-API + 1 DB | `getUser()` + profile role fetch |
| requireAuth (Leaderboard API) | 1 Auth-API + 1 DB | `getUser()` + profile role fetch |
| Profile API | 4-5 DB | profile, user_badges, badges, posts count, courses count |
| Leaderboard API | 2-4 DB | profiles ranked, active count, ggf. user rank |
| **Gesamt** | **3 Auth-API + 9-12 DB** | **= 12-15 Round-Trips pro Dashboard-Load** |

**RLS-Amplifikation (versteckte Kosten):**
- `is_admin()` in RLS Policies von: profiles, best_practices, courses, lessons, comments, ai_providers, system_prompts, ai_cost_log, ai_chat_sessions, ai_chat_messages, challenges, user_challenges, user_course_progress, badges, user_badges, innovation_radar_items, usecase_evaluations
- Jeder SELECT/UPDATE/DELETE auf diese Tabellen loest 1+ zusaetzliche Profile-Queries aus
- Geschaetzte zusaetzliche Last: 1-3 Queries pro regulaerem Tabellenzugriff

## Entscheidung

Fuenf Optimierungsstrategien wurden umgesetzt:

### 1. Middleware: `getSession()` statt `getUser()`
- `getSession()` liest den JWT aus dem Cookie und validiert ihn lokal (kryptografische Signaturpruefung)
- Kein Auth-API-Roundtrip mehr pro Seitenaufruf
- Admin-Rollen-Check liest aus `app_metadata` im JWT statt DB-Query
- **Einsparung: 1 Auth-API-Call + 0-1 DB-Query pro Request**

### 2. requireAuth(): `getSession()` + JWT-Rolle
- Auth-Validierung ueber lokale JWT-Pruefung statt Server-Roundtrip
- Rolle aus `app_metadata` statt separatem Profile-Query
- **Einsparung: 1 Auth-API-Call + 1 DB-Query pro API-Call**

### 3. RLS-Funktionen: JWT-basiert statt DB-Query
- `is_admin()` und `is_moderator_or_above()` lesen die Rolle aus `current_setting('request.jwt.claims')` statt aus der `profiles`-Tabelle
- Trigger `sync_role_to_jwt()` synchronisiert Rollenaenderungen in `auth.users.raw_app_meta_data`
- Backfill-Migration schreibt alle bestehenden Rollen in JWT
- Funktionen als `STABLE` markiert (PostgreSQL kann Ergebnis pro Statement cachen)
- **Einsparung: 1+ DB-Query pro RLS-Policy-Check auf 17+ Tabellen**

### 4. Profile API: Konsolidierte Database Function
- `get_user_profile_data(user_id)` ersetzt 4-5 sequentielle Queries durch einen einzigen DB-Call
- Gibt profile, badges (mit Definitionen), und stats (posts count, courses completed) als JSON zurueck
- **Einsparung: 3-4 DB-Queries pro Profile-Load**

### 5. Leaderboard API: Konsolidierte Database Function + Cache
- `get_leaderboard_optimized(user_id, limit)` ersetzt 2-4 Queries durch einen DB-Call
- Server-seitiger `Cache-Control: private, max-age=60, stale-while-revalidate=120`
- Client-seitiger stale-while-revalidate Cache (5 Minuten fuer Leaderboard, 30 Sekunden fuer Profile)
- **Einsparung: 1-3 DB-Queries pro Leaderboard-Load + Cache-Hits**

## Soll-Zustand (nach Optimierung)

**Pro Dashboard-Load (normaler User):**

| Schritt | Queries | Beschreibung |
|---------|---------|--------------|
| Middleware | 0 | `getSession()` lokal, kein API-Call |
| requireAuth (Profile API) | 0 | Session lokal, Rolle aus JWT |
| requireAuth (Leaderboard API) | 0 | Session lokal, Rolle aus JWT |
| Profile API | 1 DB | `get_user_profile_data()` RPC |
| Leaderboard API | 1 DB (oder Cache-Hit) | `get_leaderboard_optimized()` RPC |
| **Gesamt** | **0 Auth-API + 2 DB** | **(oder 0 bei Cache-Hit)** |

**Query-Reduktion Dashboard-Load:**
- Vorher: 12-15 Round-Trips
- Nachher: 2 Round-Trips (oder 0 bei Cache-Hit)
- **Reduktion: ~85-100%**

**RLS-Amplifikation eliminiert:**
- Vorher: 1+ DB-Query pro RLS-Policy-Check
- Nachher: 0 DB-Queries (JWT-basiert, `STABLE` Function caching)
- **Impact: Alle 17+ Tabellen mit is_admin()/is_moderator_or_above() Policies profitieren**

## Alternativen

### Alternative 1: `SET LOCAL` / `current_setting()` fuer RLS-Caching
- Rolle einmal pro Transaction in `SET LOCAL` speichern
- Abgelehnt: Erfordert Wrapper um jeden Query, erhoeht Code-Komplexitaet
- JWT-basierter Ansatz ist einfacher und hat 0 DB-Queries

### Alternative 2: SWR Library (swr/react-query) fuer Client-Caching
- Vollwertiges Data-Fetching-Library einfuehren
- Abgelehnt: Overengineered fuer 2 API-Calls, erhoehte Bundle-Size
- Einfacher module-level Cache ist ausreichend und hat 0 Dependencies

### Alternative 3: Materialized View fuer Leaderboard
- Leaderboard-Daten in materialized view vorberechnen
- Nicht abgelehnt, aber aufgeschoben: Erst relevant bei >1000 Usern
- Aktuelle Optimierung (single function + caching) reicht fuer MVP

## Konsequenzen

### Positiv
- Query-Last um ~85% reduziert pro Dashboard-Load
- RLS-Amplifikation komplett eliminiert (betrifft alle Tabellen)
- Free Tier Limits werden eingehalten
- Schnellere Seiten-Ladezeiten durch weniger Round-Trips
- Client-seitiger Cache bietet instant Loading bei wiederholten Besuchen

### Negativ
- Rollenaenderungen werden erst nach JWT-Refresh (Token-Ablauf) wirksam
  - Mitigation: Bei Admin-Aktionen kann ein forced token refresh ausgeloest werden
- `getSession()` validiert nicht gegen den Auth-Server
  - Mitigation: JWT-Signatur ist kryptografisch sicher; fuer sensitive Mutationen kann `getUser()` ergaenzt werden
- sync_role_to_jwt Trigger muss bei Schema-Aenderungen beruecksichtigt werden

## Compliance
- [x] DSGVO-konform (keine zusaetzlichen Daten gespeichert, Rolle war bereits vorhanden)
- [x] Security-Review (JWT kryptografisch signiert, RLS weiterhin aktiv)
- [x] Performance-Impact bewertet (signifikante Verbesserung)

## Betroffene Dateien
- `src/middleware.ts` - getSession() statt getUser()
- `src/lib/api/require-auth.ts` - getSession() + JWT-Rolle
- `src/app/api/profile/route.ts` - Konsolidierter RPC-Call
- `src/app/api/leaderboard/route.ts` - Konsolidierter RPC-Call + Cache-Header
- `src/hooks/use-dashboard-data.ts` - Client-seitiger stale-while-revalidate Cache
- `supabase/migrations/00008_optimize_rls_jwt_roles.sql` - Neue Migration
