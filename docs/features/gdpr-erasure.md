# GDPR Right-to-Erasure

**Status:** Active
**Phase:** 0 — Hardening
**Rechtsgrundlage:** DSGVO Art. 17 (Recht auf Loeschung), Art. 30 (Audit-Log)

## User-Flow

Ein eingeloggter Nutzer navigiert zu **Settings** und aktiviert den
Loeschvorgang ueber einen dedizierten Button. Ein Bestaetigungsdialog erscheint,
der verlangt, dass der Nutzer den Text "LÖSCHEN" exakt eintippt, bevor der
Confirm-Button aktiv wird. Nach Bestaetigung ruft das Frontend
`DELETE /api/profile` auf.

## Hard-Delete-Kaskade

Der Endpoint ruft `auth.admin.deleteUser()` (Supabase Admin API) auf. Der
Supabase-Auth-Layer loescht den Eintrag in `auth.users`. Ueber Foreign-Key-
Kaskaden werden automatisch geloescht:

- `public.profiles`
- Auth-Sessions
- `ai_chat_messages` / `ai_chat_sessions`
- `mentor_signals` und verknuepfte Tabellen

## Audit-Log (Art. 30)

Vor dem eigentlichen Loeschen legt der Endpoint einen Eintrag in
`gdpr_erasure_log` an (`requested_at`, `user_id`). Nach erfolgreichem
`deleteUser()` wird `deleted_at` gesetzt. Die Tabelle hat absichtlich keinen
Foreign Key auf `auth.users`, da der referenzierte User nach dem Loeschvorgang
nicht mehr existiert.

Die Tabelle ist per RLS ausschliesslich fuer die `service_role` zugaenglich.
Authentifizierte Nutzer koennen ihre eigenen Audit-Eintraege weder lesen noch
aendern.

## Known Limitation (NF01 — Minor)

Das `deleted_at`-UPDATE nach erfolgreichem `deleteUser()` hat keine
Fehlerbehandlung (`src/app/api/profile/route.ts:188-191`). Schlaegt dieses
UPDATE fehl, verbleibt der Audit-Eintrag mit `deleted_at = NULL` und ist nicht
von einem fehlgeschlagenen Loeschversuch zu unterscheiden. Der Nutzer ist zu
diesem Zeitpunkt bereits geloescht. Behoben in Phase 1.

## Related Source Files

- `supabase/migrations/00016_gdpr_erasure_log.sql` — Tabellendefinition und RLS
- `src/app/api/profile/route.ts` — `DELETE`-Handler (Zeilen 160-196)
- `src/app/(dashboard)/profile/settings/page.tsx` — UI-Bestaetigungsdialog

## History

- 2026-04-30 — Phase-0-Hardening: Migration 00016 und DELETE-Endpoint committed.
  DSGVO Art. 17 + Art. 30 fuer diesen Pfad implementiert.
