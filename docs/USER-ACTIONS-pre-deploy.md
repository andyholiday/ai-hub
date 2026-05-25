# User-Actions vor dem Merge in main

Checkliste fuer den Operator vor `git merge feature/audit-fixes-2026-05-14`.

## 1. Vercel Environment Variables setzen

Zwei neue Secrets muessen in Vercel (Preview + Production) hinterlegt werden:

```bash
openssl rand -hex 32  # fuer CRON_SECRET
openssl rand -hex 32  # fuer SUPABASE_WEBHOOK_SECRET
```

Ohne diese Werte:

- `/api/cron` antwortet mit HTTP 503.
- `/api/webhooks/supabase` antwortet mit HTTP 401.

## 2. Supabase-Migrationen pushen

```bash
supabase db push --linked
```

Neue Migrationen in diesem Branch:

- `00033_atomic_award_xp.sql` — `award_xp_idempotent` RPC
- `00034_api_endpoint_nullable.sql` — `api_endpoint` nullable

Falls kein CLI vorhanden: Migrationen manuell im Supabase-Dashboard unter
SQL-Editor ausfuehren.

## 3. Supabase Webhook konfigurieren

Dashboard -> Database -> Webhooks -> New Hook (je einen Hook pro Tabelle):

| Hook | Tabelle | Event | URL |
|---|---|---|---|
| welcome-notification | `auth.users` | INSERT | `https://<domain>/api/webhooks/supabase` |
| auto-tag-posts | `public.community_posts` | INSERT | `https://<domain>/api/webhooks/supabase` |

Authorization-Header fuer beide: `Bearer <SUPABASE_WEBHOOK_SECRET>`

Details: [RUNBOOK-webhook-events.md](runbooks/RUNBOOK-webhook-events.md)

## 4. pg_cron-Status entscheiden

Migration `00017` enthaelt einen optionalen pg_cron-Job fuer
`cleanup_expired_chat_messages`. Dieser Branch fuegt einen Vercel-Cron-Job
hinzu (`vercel.json`, Schedule `0 2 * * *`).

- Beide Varianten sind idempotent.
- Wenn pg_cron aktiv ist: redundant, aber harmlos.
- Wenn pg_cron deaktiviert ist: Vercel-Cron ist der kanonische Pfad.

Keine Aktion noetig — nur bewusst entscheiden.

## 5. Supabase-Types regenerieren

Nach Migrations-Apply einmal ausfuehren:

```bash
npm run supabase:types
```

Danach den Cast `as unknown as SupabaseClient<Database>` in
`src/app/api/mentor/signals/route.ts` durch den korrekten Typ ersetzen
(der Cast ist als TODO markiert).

## 6. Welcome-Notification-Type (optional)

Aktuelle Implementierung mappt Welcome-Notifications auf `type = 'system'`.
Falls `'welcome'` als eigener Enum-Wert gewuenscht wird: Migration fuer
Enum-Erweiterung schreiben, bevor dieser Branch gemerged wird.

## Verwandte Dokumente

- [RUNBOOK-webhook-events.md](runbooks/RUNBOOK-webhook-events.md)
- [RUNBOOK-provider-setup.md](runbooks/RUNBOOK-provider-setup.md)
- [CHANGELOG](../CHANGELOG.md) — Audit-Fix-Wave 2026-05-14
