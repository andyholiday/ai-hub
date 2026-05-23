# Runbook: Supabase-Webhook-Events

## Endpoint

```text
POST /api/webhooks/supabase
```

## Authentifizierung

Header: `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`

Verifizierung erfolgt timing-sicher via `safeEqual()` (Buffer-byte-Length +
try-catch, M-09). Falsche oder fehlende Credentials: HTTP 401.

## Request-Body-Schema

```json
{
  "type": "INSERT",
  "table": "users",
  "schema": "auth",
  "record": { "id": "...", "email": "..." },
  "old_record": null
}
```

## Implementierte Events

### 1. INSERT auf `auth.users`

Ausgeloest wenn: neuer User registriert sich.

Aktion: Welcome-Notification wird in `notifications` angelegt
(`type = 'system'`).

Idempotent: vorhandene Welcome-Notification fuer denselben User wird nicht
doppelt angelegt.

### 2. INSERT auf `public.community_posts`

Ausgeloest wenn: neuer Community-Post erstellt wird.

Aktion: `suggestTags()` wird aufgerufen; Tags werden am Post gesetzt.

Wird uebersprungen wenn: `tags`-Array am Record bereits gesetzt ist.

## Konfiguration in Supabase Dashboard

1. Dashboard -> Database -> Webhooks -> New Hook
2. Name: z.B. `ai-hub-webhook`
3. Table: `auth.users` (fuer Welcome-Notification) ODER `public.community_posts`
   (fuer Auto-Tag) — je ein Hook pro Tabelle
4. Events: `INSERT`
5. Method: `POST`
6. URL: `https://<vercel-domain>/api/webhooks/supabase`
7. Headers: `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`

`SUPABASE_WEBHOOK_SECRET` muss identisch mit dem Wert in den Vercel
Environment Variables sein (siehe [USER-ACTIONS-pre-deploy.md](../USER-ACTIONS-pre-deploy.md)).

## Verwandte Dokumente

- [USER-ACTIONS-pre-deploy.md](../USER-ACTIONS-pre-deploy.md) — Env-Var-Setup
- [CHANGELOG Audit-Fix-Wave](../../CHANGELOG.md) — m-01
