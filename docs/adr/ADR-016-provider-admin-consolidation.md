# ADR-016: Provider-Admin-Konsolidierung via Modal-Stack

## Status

Accepted (2026-05-14)

## Context

Die Admin-Seite `/admin/page.tsx` verwendete `window.prompt()` fuer
Provider-Konfiguration (API-Key, Modell, System-Prompt). Das war:

- Funktional unvollstaendig (kein Endpoint, kein Temperature, kein Budget).
- Sicherheitstechnisch unguenstig (`window.prompt` ist nicht CSP-kompatibel).
- Nicht testbar (kein DOM-Element, kein Component-Test moeglich).

Parallel existierten Dev-Skripte (`set-admin.mjs`, `update-gemini-key.mjs`)
im Repo-Root, die manuelle DB-Writes ausfuehrten — ein Zeichen fehlender
Admin-UI.

## Decision

`window.prompt` wird durch einen Modal-Stack ersetzt:

- `ProviderKeyModal` — setzt/aendert API-Key via `upsert_provider_vault_key`-RPC
- `ProviderConfigModal` — konfiguriert model, max_tokens, top_p, endpoint,
  temperature, budget
- `SystemPromptModal` — bearbeitet den System-Prompt des Providers

`api_endpoint` ist explizit nullable (Migration `00034`): kein Pflichtfeld,
leerer Wert = Provider-SDK-Default.

Dev-Skripte wurden aus dem Repo entfernt; `.gitignore` aktualisiert (C-02).

## Consequences

**Positiv:**

- Vollstaendige Provider-Konfiguration ohne DB-Direktzugriff.
- Testbar: 15 Component-Tests fuer `ProviderConfigModal` (m-08).
- Klare Fehlermeldung wenn kein API-Key hinterlegt (M-02).

**Negativ / Einschraenkungen:**

- Modal-Stack erfordert korrekte Vault-RPC-Konfiguration in Supabase
  (Runbook: [RUNBOOK-provider-setup.md](../runbooks/RUNBOOK-provider-setup.md)).

## Referenzen

- Commits: be4c412, 62d3828, fcc15f5
- Migration: `supabase/migrations/00034_api_endpoint_nullable.sql`
- Changelog: [Audit-Fix-Wave 2026-05-14](../../CHANGELOG.md) — C-01, C-02, M-01, M-02
