# Review — Voll-Audit ai-hub (Security / GDPR / Quality / Deployment)

- **Iteration**: 1 / 3
- **Reviewer**: quality-agent
- **Datum**: 2026-05-15
- **Branch**: feature/audit-fixes-2026-05-14
- **Verdict**: request-changes
- **Stats**: critical: 2, major: 7, minor: 6
- **Scope**: src/app/api/** (ohne profile/leaderboard/admin-client), src/lib/{gamification,moderation,audit,validators}, supabase/migrations/**, middleware, require-auth/require-admin. Disjunkt zur Parallel-Diagnostik (admin.ts / profile / leaderboard / use-dashboard-data).

## Test-Status

- `npx vitest run`: **829 passed, 7 skipped, 72 Dateien grün** (5.6s). Keine roten Tests.
- Coverage nicht erhoben (Lauf ohne `--coverage`, um Audit-Zeit zu sparen; Suite ist grün und breit).
- Netz/DB-abhängige Tests bewusst nicht ausgeführt (Scope-Vorgabe).

## Summary

Auth-Architektur (getUser-Validierung, ADR-016 Mismatch-Guard, column-level role-lock,
timing-safe Secrets, RLS deny-all auf audit_logs / gdpr_erasure_log) ist solide und
zeigt Audit-Reife. Der **wiederkehrende Vercel-Stats-Bug ist reproduzierbar erklärbar**:
`createAdminClient()` nutzt nackte `!`-Assertions auf Env-Vars **ohne** den Vercel-Guard,
den `require-auth.ts` bereits hat — fehlt `SUPABASE_SERVICE_ROLE_KEY` oder eine Migration,
crasht jede stats-tragende Route (admin/costs, gamification, dashboard) mit HTTP 500 statt
einer klaren 503/Diagnose. Zwei weitere Routen (`search`, `auto-tag`) wiederholen das
`!`-Anti-Pattern. Blocker vor GoLive: F01, F02.

## Findings

| ID  | Severity | Bereich      | File:Line                                            | Befund                                                                 | Fix-Vorschlag |
|-----|----------|--------------|------------------------------------------------------|------------------------------------------------------------------------|---------------|
| F01 | critical | Deploy/A05   | src/lib/supabase/admin.ts:11-12                       | `createAdminClient` nutzt `process.env.X!` ohne Vercel-Guard. Fehlende `SUPABASE_SERVICE_ROLE_KEY` → `createClient` wirft → **HTTP 500 in jeder stats-Route** (admin/costs, gamification, ai/chat-Logging, dashboard). Exakt der gemeldete Vercel-Stats-Bug. | Analog `require-auth.ts:60-79`: bei `process.env.VERCEL && !serviceKey` strukturierte 503 + Log statt Throw; Routen prüfen den Guard. |
| F02 | critical | Deploy/A05   | docs/USER-ACTIONS-pre-deploy.md:1 vs. src/app/api/cron/route.ts:63 / src/lib/gamification/xp.ts:153 | Code erwartet Migration `00033 award_xp_idempotent` + `00034` + RPC `cleanup_expired_chat_messages` (00017). Pre-Deploy-Checkliste laut Reflect-Log NICHT ausgeführt. Fehlende Migration → RPC-Fehler → XP/Cron still kaputt, Stats inkonsistent. | Vor Merge `supabase db push --linked` verifizieren; Healthcheck-Route ergänzen die `award_xp_idempotent`/`cleanup_expired_chat_messages` als vorhanden prüft; needs-operator-verification (Prod-DB-Zugang). |
| F03 | major    | A09 Logging  | src/app/api/analytics/vitals/route.ts:55-77           | `/api/analytics/vitals` POST ohne Auth/Rate-Limit/Origin-Check; loggt frei beschreibbare Felder per `console.info` → Log-Injection / Log-Flooding. | Rate-Limit + Origin-Allowlist; Felder vor dem Log normalisieren (bereits numerisch gerundet, aber `id`/`navigationType` ungefiltert). |
| F04 | major    | A03/Quality  | src/app/api/ai/chat/route.ts:141-176                  | Chat-Body wird per Hand validiert (`as ChatRequestBody`), kein Zod — anders als alle anderen Routen (`*.safeParse`). `temperature`/`maxTokens`/`context` ungeprüft an Provider durchgereicht. | Zod-Schema in `src/lib/validators/` analog `evaluation.ts`; `maxTokens`/`temperature` bounden. |
| F05 | major    | A03 Injection| src/app/api/innovation-radar/route.ts:63               | `ilike("title", \`%${search}%\`)` — `search` aus Query, Zod-validiert aber `%`/`_` nicht escaped → LIKE-Wildcard-Injection (DoS via teure Scans, kein SQLi da parametrisiert). | `%` und `_` im Suchterm escapen oder `websearch`-FTS nutzen. |
| F06 | major    | A04 Resilience| src/app/api/community/posts/[postId]/route.ts:61-65   | View-Count-Increment `.then()` ohne `await`/catch → unhandled rejection bei DB-Fehler; zudem Read-Modify-Write Race (Lost-Update bei parallelen Views → Stats-Drift). | Atomare RPC/`increment_field` (existiert in 00001) statt `views_count + 1`; Promise mit `.catch`. |
| F07 | major    | A01/GDPR     | src/app/api/admin/users/route.ts:234-303 (DELETE)      | Erasure löscht auth.users + profiles, aber **ai_chat_messages / audit_logs / xp_log nicht explizit**. Wenn FK-Cascade nicht überall greift → personenbezogene Chat-Inhalte überleben Art.17-Löschung. | FK-ON-DELETE-CASCADE pro Tabelle in Migration verifizieren ODER explizite Deletes vor `deleteUser`; needs-operator-verification (Schema-Constraints). |
| F08 | major    | GDPR Art.30  | src/app/api/admin/users/route.ts:252-256               | `gdpr_erasure_log.ip_hash` (Migration 00016:19 vorgesehen) wird beim Insert nicht gesetzt → forensisches Feld bleibt immer NULL. | `ip_hash` aus `x-forwarded-for` SHA-256 beim Insert befüllen. |
| F09 | major    | GDPR Consent | src/app/api/ai/chat/route.ts:379-408                   | C2PA-Audit-Log persistiert immer; `privacyMode` hartkodiert `false` (PRIVACY_MODE_PLACEHOLDER_WAVE5) → User-Privacy-Pref wird ignoriert, Content-Hash immer gespeichert. Consent/Opt-out nicht wirksam. | privacyMode aus `user_feature_prefs` server-side resolven (TODO Wave5) ODER bis dahin Persistenz bei fehlendem Consent unterdrücken. |
| F10 | minor    | Quality      | src/app/api/search/route.ts:67-68; src/app/api/ai/auto-tag/route.ts:48-49 | `process.env.X!` (gleiches Anti-Pattern wie F01, hier anon-key). Inkonsistent zu `require-auth.ts`-Guard. | `requireAuth(req)` statt eigener createServerClient-Block verwenden (DRY + Guard gratis). |
| F11 | minor    | Quality      | src/app/api/admin/users/route.ts:111, innovation-radar/route.ts:97, +18 weitere | `} catch {` ohne Error-Binding → generische `apiInternalError()`, Ursache nicht geloggt. Erschwert genau die Vercel-Stats-Diagnose. | `catch (err) { console.error(...); }` mit Kontext-Tag. |
| F12 | minor    | A01          | src/app/api/community/posts/[postId]/route.ts:39-40    | GET behandelt `requireAuth`-Fehler als „anonym" (Soft-Auth) — ok da Posts public, aber Muster sollte dokumentiert/zentralisiert sein (leicht zu verwechseln mit fehlendem Auth). | Helper `optionalAuth(req)` extrahieren, Intent explizit machen. |
| F13 | minor    | Quality      | src/app/api/mentor/signals/route.ts:39                 | `auth.supabase as unknown as SupabaseClient<Database>` 3× — TODO laut Pre-Deploy §5 nach Types-Regen auflösen. | Nach `npm run supabase:types` Cast entfernen. |
| F14 | minor    | A04          | src/lib/gamification/xp.ts:73                          | Daily-Cap-DB-Fallback nutzt `awarded_at >= today` als String-Vergleich (`split('T')[0]`) — TZ-abhängig (UTC vs. User-TZ), Cap kann am Tagesrand falsch greifen. | Explizit `date_trunc('day', awarded_at at time zone 'UTC')` serverseitig oder RPC. |
| F15 | minor    | A05          | src/app/api/cron/route.ts:37-39                        | Bei Auth-Fehler werden 4 Zeichen des versuchten Secrets geloggt (`attempted_secret_prefix`) — minimaler, aber unnötiger Secret-Leak in Logs. | Nur Hash-Präfix oder gar nichts loggen. |

## OWASP Top-10 (2021) — Ergebnis

| Kat | Status | Notiz |
|-----|--------|-------|
| A01 Broken Access Control | pass* | Ownership-Checks vorhanden (community PUT/DELETE), RLS deny-all auf Audit-Tabellen, column-level role-lock (00025). *F07 GDPR-Cascade offen. |
| A02 Cryptographic Failures | pass | SHA-256 Pseudonymisierung, timingSafeEqual für Secrets, kein Custom-Crypto. |
| A03 Injection | request-changes | F04 (ungeprüfter Chat-Body), F05 (LIKE-Wildcard). Supabase-Query-Builder parametrisiert → kein klassisches SQLi. |
| A04 Insecure Design | request-changes | F06 Race auf views_count, F14 TZ-Cap. Rate-Limits & idempotente XP-RPC vorhanden (gut). |
| A05 Security Misconfiguration | request-changes | F01/F02 Env/Migration-Drift = Kern-Bug. F15. |
| A06 Vulnerable Components | needs-operator-verification | `npm audit` nicht ausgeführt (Scope: kein Netz). Im nächsten Lauf nachholen. |
| A07 AuthN Failures | pass | getUser() server-seitig, HttpOnly-SSR-Cookies, korrupte-Cookie-Resilienz. |
| A08 Integrity Failures | pass | Webhook/Cron signaturgeprüft (Bearer + timing-safe). |
| A09 Logging/Monitoring | request-changes | F03 Log-Injection, F11 verschluckte Fehler erschweren Stats-Debug. |
| A10 SSRF | pass | Keine user-kontrollierten Outbound-Fetches im Scope gefunden. |

## GDPR Spot-Check

- **Erasure-Flow (admin/users DELETE)**: Audit-Eintrag VOR Löschung (gut), aber F07 (Cascade unverifiziert) + F08 (ip_hash leer).
- **Chat-Retention**: 00017 90-Tage-Cleanup vorhanden, via Cron + optional pg_cron, idempotent — sauber.
- **Audit-Logs**: RLS deny-all für User, Pseudonymisierung via SHA-256 — Art.4(5) erfüllt.
- **Consent**: F09 — privacyMode hartkodiert false, Opt-out greift nicht.
- **Erasure-Log RLS**: nur service_role — korrekt (00016).

## Go / No-Go

**NO-GO für GoLive.** 2 critical (F01 Env-Guard-Lücke = der gemeldete Vercel-Stats-Bug;
F02 Migration/Pre-Deploy-Drift) blockieren. Pre-Deploy-Checkliste MUSS vor Merge
ausgeführt und verifiziert werden.

## Top-3 Fixes für nächste Developer-Iteration

1. **F01** — Vercel-Env-Guard in `createAdminClient()` (Muster aus require-auth.ts:60-79 spiegeln) → behebt den wiederkehrenden Stats-500.
2. **F02** — Pre-Deploy-Checkliste abarbeiten + Healthcheck-Endpoint der Migrationen/RPCs prüft (needs-operator-verification für Prod-DB).
3. **F04 + F05** — Zod-Schema für /api/ai/chat-Body; LIKE-Wildcards in innovation-radar escapen.

## Offen / needs-operator-verification

- F02/F07: Prod-DB-Migrations-Stand & FK-Cascade-Constraints — nur mit Supabase-Zugang verifizierbar.
- A06: `npm audit` im nächsten Lauf nachziehen (diesmal kein Netz).
- Coverage-Zahl nicht erhoben (Suite grün, Scope-Zeitbudget).
