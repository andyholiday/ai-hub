# API Key Encryption (Vault)

**Status:** Active
**Phase:** 0 — Hardening
**OWASP:** A02 Cryptographic Failures (geschlossen)

## Problem

Die Tabelle `ai_providers` speicherte API-Keys der KI-Provider (Anthropic,
OpenAI, Google, Groq, Mistral) unverschluesselt in der Spalte
`api_key_encrypted`. Ein geleakter Service-Role-Key oder ein Datenbank-Dump
haette alle Provider-Keys im Klartext exponiert, da der Service-Role-Key RLS
vollstaendig umgeht.

## Loesung

Alle Keys wurden in **Supabase Vault (pgsodium)** migriert. Die Spalte
`api_key_encrypted` haelt seither nur eine UUID, die auf den Vault-Secret-Eintrag
verweist. Der Encryption-Key (pgsodium root-key) liegt ausserhalb von Postgres im
Supabase-Backend und ist fuer keinen Datenbanknutzer direkt abrufbar.

## Read-Pfad

Der serverseitige Read-Pfad ruft die RPC-Funktion `get_active_provider_keys()`
auf. Diese Funktion besitzt `SECURITY DEFINER`-Rechte und fuehrt intern einen
JOIN auf `vault.decrypted_secrets` aus. Sie gibt ausschliesslich entschluesselte
Keys aktiver Provider zurueck — nie die Vault-UUIDs. Der bestehende 60-Sekunden
In-Memory-Cache in `src/lib/ai/provider-keys.ts` bleibt unveraendert.

## Write-Pfad

Der Admin-PUT-Endpunkt (`src/app/api/admin/providers/route.ts`) ruft die RPC-
Funktion `upsert_provider_vault_key()` auf. Diese legt einen neuen Vault-Secret
an oder aktualisiert einen bestehenden und gibt die UUID zurueck, die dann in
`api_key_encrypted` geschrieben wird. Kein Plaintext-Key landet mehr direkt in
der Datenbankspalte.

## Lokale Entwicklung

`supabase start` aktiviert pgsodium per Default. Fuer Lokal-Tests mit echten
Vault-Secrets muss ein Seed-Script die Secrets anlegen (analog zur Migration).
Ohne Seed gibt `vault.decrypted_secrets` `NULL` zurueck.

## Related Decisions

- [ADR-003: API-Key-Encryption fuer ai_providers mit Supabase Vault](../architecture/ADR-003-api-key-encryption.md)

## Related Source Files

- `supabase/migrations/00014_vault_api_keys.sql` — Migration: Keys in Vault
  ueberfuehren, RPC-Funktionen anlegen
- `src/lib/ai/provider-keys.ts` — Read-Pfad mit Cache und RPC-Aufruf
- `src/app/api/admin/providers/route.ts` — Write-Pfad (Admin-PUT)

## History

- 2026-04-30 — Phase-0-Hardening: Migration 00014 committed, RPC-Funktionen
  `get_active_provider_keys()` und `upsert_provider_vault_key()` deployed.
  OWASP A02 fuer diesen Pfad geschlossen.
