# Sicherheit & Datenschutz

**Was es ist:** Ein mehrschichtiges Sicherheitsmodell aus RLS-Policies, Rate-Limiting, Input-Validierung, XSS-Bereinigung, GDPR-Loeschung und C2PA-konformen Audit-Logs — kombiniert mit Privacy-Mode fuer EU-datenschutzkonforme KI-Nutzung.

## Mehrwert / Benefit

Nutzer koennen sicher sein, dass ihre Daten nicht von anderen Nutzern lesbar sind, KI-Kosten durch Rate-Limiting kontrolliert werden, und alle KI-Antworten fuer regulatorische Pruefungen nachvollziehbar sind. Organisations-Admins koennen Privacy-Mode erzwingen, um DSGVO-Compliance sicherzustellen.

## Sicherheitsschichten im Ueberblick

### 1. Transport

- TLS 1.3 (HTTPS) fuer alle Verbindungen (Supabase Cloud Standard).

### 2. Authentifizierung & Routing

- Supabase Auth (JWT-basiert) mit `getUser()` — kein `getSession()`-Sicherheitsleck.
- `src/middleware.ts` prueft Auth-Cookie auf allen `/dashboard/*`-Routen.
- Redirect zu `/login` bei fehlendem Token.

### 3. API-Absicherung

- `requireAuth(req)` auf allen nicht-oeffentlichen API-Routen — liefert 401 bei fehlender Session.
- `requireAdmin(req)` auf allen `/api/admin/*`-Routen — liefert 403 fuer Nicht-Admins.
- **Zod-Validierung** auf allen API-Inputs; ungueltige Requests erhalten HTTP 400 mit strukturierter Fehlermeldung.
- **Rate-Limiting** via Upstash Redis (Sliding Window):

  | Tier | Limit |
  |------|-------|
  | `ai` | 20 req / 60 s |
  | `search` | 30 req / 60 s |
  | `write` | 10 req / 60 s |
  | `read` | 60 req / 60 s |

  Bei fehlendem Upstash-ENV faellt Rate-Limiting in Production fail-closed (HTTP 503). In nicht-produktiven Umgebungen degradiert es auf in-memory (kein Persistenz ueber Prozesse). Das Verhalten ist per `RATE_LIMIT_FALLBACK` konfigurierbar.

### 4. Datenbank — Row Level Security (RLS)

- 32 Tabellen mit aktiviertem RLS; 50+ Policies.
- Nutzer lesen und schreiben nur eigene Daten.
- Self-Vote-XP verhindert durch DB-Constraint (`post_likes`).
- Hybrid-Search gibt nur `status='published'`-Zeilen oder eigene Zeilen zurueck (Migration 00036 behebt den RLS-Leak aus dem Audit).
- Provider-API-Keys in Supabase Vault hinter SECURITY DEFINER RPC — nie im Client-Bundle.

### 5. Content-Sicherheit

- **DOMPurify** bereinigt alle `dangerouslySetInnerHTML`-Stellen (`best-practices/[id]`, `learn-hub/[courseId]/[lessonId]`).
- **Content Moderation** im AI Mentor (serverseitig).

### 6. Budget-Cap

- Atomare Budget-Reservierung via `check_and_reserve_ai_budget()` RPC (Migration 00035).
- Race-free Design: Postgres-Row-Lock verhindert TOCTOU-Rennbedingung.
- Wiring live: `enforceBudget()` in `route.ts:300`. Ausstehend: Abgleich tatsaechlicher vs. geschaetzter Kosten nach Request-Abschluss (bewusster Tradeoff, kein Bug).

### 7. GDPR / Datenschutz

- **Consent-Banner** (`docs/features/consent-banner.md`) — DSGVO-konformes Cookie-Consent.
- **Erasure-Endpunkt** (`/api/user/erasure`) — loescht alle personenbezogenen Daten des Nutzers auf Anfrage (details in [gdpr-erasure.md](./gdpr-erasure.md)).
- **DPA-Hinweis** fuer Drittanbieter (details in [dpa-notice.md](./dpa-notice.md)).
- **Pseudonymisierung** in Audit-Logs: `user_id_hash = SHA-256(auth.uid())` — kein Klarnamen in Logs.

### 8. C2PA Audit-Logs (AI Act Art. 50)

- Tabelle `audit_logs` (Migration 00024): speichert SHA-256 des Response-Texts, Modell-ID, Provider, Region und Privacy-Mode-Flag.
- Kein X.509-Signing im aktuellen Stand (Phase-2-Scope).
- Nutzer koennen eigene Audit-Logs nicht lesen (RLS deny-all fuer regulaere User).

### 9. Privacy-Mode (DSGVO by default)

- Aktivierbar per Nutzer-Toggle in den Einstellungen.
- Lokale Embeddings (384-d, Transformers.js) statt OpenAI API.
- KI-Chat uber Mistral EU (Frankreich, DPA vorhanden).
- Details: [privacy-mode-local-search.md](./privacy-mode-local-search.md).

## Schluessel-Dateien

| Schicht | Datei |
|---------|-------|
| Auth-Middleware | `src/middleware.ts` |
| requireAuth | `src/lib/api/require-auth.ts` |
| requireAdmin | `src/lib/api/admin-auth.ts` |
| Rate-Limiting | `src/lib/api/rate-limit.ts` (Upstash) |
| DOMPurify | `src/lib/utils/sanitize.ts` |
| RLS-Policies | `supabase/migrations/00001_initial_schema.sql` + folgende Migrationen |
| Budget-Cap RPC | `supabase/migrations/00035_ai_budget_cap.sql` |
| Audit-Logs Schema | `supabase/migrations/00024_audit_logs.sql` |
| Hybrid-Search RLS-Fix | `supabase/migrations/00036_fix_hybrid_search_visibility.sql` |
| Erasure | `src/app/api/user/erasure/route.ts` |

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| RLS auf allen 32 Tabellen | Live |
| Rate-Limiting (Upstash) | Live; fail-closed in Production bei fehlendem ENV (HTTP 503); konfigurierbar per `RATE_LIMIT_FALLBACK` |
| Zod-Validierung | Live auf `/api/ai/chat`: max 50 Nachrichten, 100KB, maxTokens <= 4096, temperature 0–1, Provider-Enum; `role:"system"` wird abgelehnt |
| DOMPurify | Live |
| Budget-Cap-Schema | Live |
| Budget-Cap-Wiring (Chat-Route) | Live (`route.ts:300`); Ausstehend: actual-vs-estimate Reconciliation |
| C2PA-Audit-Logs | Schema live; Admin-Lesepfad fehlt (Phase-5-Scope) |
| GDPR-Erasure | Live |
| Privacy-Mode + Mistral EU | Live (ADR-013); serverseitig aus Nutzer-Prefs abgeleitet |
| Client-`role:"system"`-Injection | Serverseitig abgelehnt — Zod-Enum erlaubt nur "user"\|"assistant" |
| Streaming-Cancel bei Disconnect | Live — AbortSignal durch Route und alle Provider; `ReadableStream.cancel()` bricht Upstream ab |
| Webhook constant-time compare | Live — `timingSafeEqual` aus Node.js `crypto` in `/api/webhooks/supabase/route.ts` |
