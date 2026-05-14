# Runbook: Provider-Setup (Admin)

## Voraussetzungen

- Admin-Account (Rolle `admin` in `profiles.role`)
- Supabase Vault aktiviert (wird vom Projekt vorausgesetzt)

## Schritt-fuer-Schritt

### 1. Login und Navigation

Login unter `/login`, danach `/admin` aufrufen. Die KI-Provider-Karte ist
standardmaessig der erste Tab.

### 2. API-Key setzen

1. Provider-Card auswaehlen (z.B. OpenAI, Anthropic, Google, Groq, Mistral).
2. Schaltflaeche "API-Key setzen" klicken — oeffnet `ProviderKeyModal`.
3. Key eingeben und speichern.

Der Key wird via `upsert_provider_vault_key`-RPC in den Supabase Vault
geschrieben. Er erscheint niemals im Klartext in der DB-Tabelle
`ai_providers`.

### 3. Provider konfigurieren

Schaltflaeche "Bearbeiten" klicken — oeffnet `ProviderConfigModal`:

| Feld | Pflicht | Hinweis |
|---|---|---|
| `model` | ja | z.B. `gpt-4o`, `claude-3-5-sonnet` |
| `max_tokens` | nein | Default des SDKs wenn leer |
| `top_p` | nein | 0.0–1.0 |
| `temperature` | nein | 0.0–2.0 |
| `api_endpoint` | nein | Leer = Provider-SDK-Default (nullable seit Migration 00034) |
| `budget` | nein | Interner Budgetlimit-Marker |

### 4. System-Prompt bearbeiten

Schaltflaeche "System-Prompt bearbeiten" klicken — oeffnet
`SystemPromptModal`. Freitext, wird pro Provider gespeichert.

### 5. Verbindung testen

Schaltflaeche "Testen" klicken. Der Live-Check ruft `POST /api/admin/providers/test`
auf.

- Erfolg: HTTP 200 mit Modell-Response.
- Kein API-Key: explizite Meldung "Kein API-Key hinterlegt" (kein stiller
  Fallback).
- Netzwerk-/Auth-Fehler: generische Fehlermeldung ohne interne Details.

### 6. Primaeren Provider setzen

Schaltflaeche "Primaer setzen" markiert diesen Provider als Default. Alle
anderen Provider werden automatisch non-primary.

## Verwandte Dokumente

- [ADR-016: Provider-Admin-Konsolidierung](../adr/ADR-016-provider-admin-consolidation.md)
- [RUNBOOK-xp-tracing.md](RUNBOOK-xp-tracing.md)
