# ADR-003: API-Key-Encryption fuer ai_providers mit Supabase Vault

**Status:** Proposed
**Datum:** 2026-04-30
**Kontext:** Phase 0 Hardening — OWASP A02 Critical
**Betroffene Dateien:**
- `supabase/migrations/00001_initial_schema.sql` (Tabelle `ai_providers`)
- `src/lib/ai/provider-keys.ts` (Read-Pfad)
- `src/app/api/admin/providers/route.ts` (Schreib-Pfad)

---

## Kontext

Die Tabelle `ai_providers` enthaelt eine Spalte `api_key_encrypted TEXT` mit
dem Column-Comment "AES-256 encrypted API key - never exposed to frontend".
Tatsaechlich werden die Keys unverschluesselt (Plaintext) gespeichert. Jeder
Datenbankzugriff mit dem Service-Role-Key — inklusive Log-Exporte,
Supabase-Dashboard, DB-Dumps, oder kompromittierter Admin-Session — legt alle
API-Keys der Provider (Anthropic, OpenAI, Google, Groq, Mistral) vollstaendig
offen.

**Bestehende Sicherheitsgrenzen (die allein nicht ausreichen):**

- RLS-Policies beschraenken SELECT/INSERT/UPDATE/DELETE auf `is_admin()`-User.
- Der Admin-GET-Endpunkt maskiert Keys vor der HTTP-Antwort.
- Der Read-Pfad `getProviderApiKeysFromDB()` laeuft ausschliesslich
  server-seitig (Admin-Client, nie via Frontend-Client).

**Warum RLS allein nicht genuegt:** Der Service-Role-Key umgeht RLS
vollstaendig. Ein geleakter Service-Role-Key oder ein DB-Dump exponiert alle
Keys unmittelbar.

**Constraints:**

- Supabase-gehostetes Postgres, kein eigener Postgres-Cluster.
- Kein externer KMS (AWS KMS, HashiCorp Vault, GCP Cloud KMS) — nicht
  zugelassen fuer Phase 0 wegen Infrastruktur-Overhead.
- Service-Role-Key ist server-seitig (Next.js) verfuegbar.
- Migration muss bestehende Plaintext-Keys unterbrechungsfrei ueberfuehren.
- Decrypt darf ausschliesslich server-seitig stattfinden.
- Aufwand-Ziel: S–M (halber bis drei Tage).

---

## Decision Drivers

1. **Sicherheitsniveau:** Schluessel duerfen im Ruhezustand (at rest) nicht im
   Klartext in der Datenbank liegen — auch nicht fuer Admins mit direktem
   DB-Zugriff.
2. **Keine App-seitige Schluessel-Verwaltung:** Das Encryption-Secret selbst
   soll nicht im Anwendungscode oder als Env-Var verwaltbar sein, wo es
   zusammen mit dem Service-Role-Key kompromittiert werden koennte.
3. **Operationelle Einfachheit:** Key-Rotation ohne Re-Encrypt aller Zeilen
   bevorzugt.
4. **Minimaler Infrastruktur-Footprint:** Phase-0-Constraint — keine neuen
   Dienste ausser dem, was Supabase bereits bietet.
5. **Transparenz im Schreib- und Lesepfad:** Der Developer-B muss beide Pfade
   (PUT fuer Write, `getProviderApiKeysFromDB` fuer Read) anpassen koennen.

---

## Considered Options

### Option A: Supabase Vault (pgsodium)

Supabase Vault ist eine Erweiterung auf Basis von `pgsodium`, die in allen
Supabase-Projekten per Default aktiviert ist. Secrets werden in der internen
Tabelle `vault.secrets` gespeichert, verschluesselt durch den root-key von
pgsodium. Der root-key lebt ausserhalb von Postgres im Supabase-Backend und
ist fuer keinen Datenbanknutzer direkt abrufbar.

**Schreibpfad:** `SELECT vault.create_secret('<plaintext>', '<name>',
'<description>')` gibt eine UUID zurueck. Diese UUID wird in
`ai_providers.api_key_encrypted` gespeichert (Spalte wird zur Vault-UUID
umfunktioniert, Name behalten um Migrationsaufwand zu minimieren).

**Lesepfad:** `SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id =
'<uuid>'` — der entschluesselte Wert ist nur via dieser View abrufbar und
erfordert den pgsodium root-key, der nie in der DB liegt.

**Vorteile:**
- Encryption key liegt nie im Anwendungscode oder einer Env-Var.
- Key-Rotation (pgsodium-root-key-Rotation) wird von Supabase verwaltet.
- Bei geleaktem Service-Role-Key oder DB-Dump sind die Vault-Secrets weiterhin
  verschluesselt (root-key liegt ausserhalb).
- Kein neuer Infrastruktur-Dienst notwendig.
- Vault ist in allen Supabase-Projekten bereits aktiv.

**Nachteile:**
- Lesepfad macht einen zusaetzlichen SQL-Join oder Sub-Select auf
  `vault.decrypted_secrets` notwendig (statt direktem Column-Read).
- `vault.decrypted_secrets` ist nur per Service-Role oder dedizierter
  Postgres-Role zugaenglich — das ist fuer den serverseitigen Read-Pfad
  korrekt, aber muss explizit dokumentiert werden.
- Lokale Entwicklung mit Supabase CLI: `pgsodium` und Vault sind in der lokalen
  Docker-Instanz verfuegbar, erfordern aber `supabase start` mit aktiviertem
  pgsodium-Seed.

---

### Option B: pgcrypto `pgp_sym_encrypt` mit Env-Var-Passphrase

Die Erweiterung `pgcrypto` bietet `pgp_sym_encrypt(data, passphrase)` und
`pgp_sym_decrypt(data::bytea, passphrase)`. Die Passphrase wird als Env-Var
(z.B. `ENCRYPTION_SECRET`) in der Next.js-Laufzeitumgebung gehalten und beim
Schreiben und Lesen uebergeben.

**Vorteile:**
- Kein Supabase-spezifisches API — Standard-Postgres-Erweiterung.
- Lesepfad kann komplett in der Anwendungsschicht implementiert werden (kein
  spezieller SQL-View).
- Verstaendlich und weit dokumentiert.

**Nachteile:**
- Die Passphrase muss irgendwo leben: Env-Var in der Next.js-Umgebung oder
  Supabase-Secrets. Wird der Service-Role-Key *und* die Env-Var kompromittiert
  (z.B. in derselben Infrastruktur), sind alle Keys exponiert.
- Key-Rotation erfordert Re-Encryption aller bestehenden Zeilen (Migration
  notwendig).
- Die Passphrase muss zwischen Next.js-Laufzeit und Postgres synchron gehalten
  werden — Deployment-Risiko bei Rotation.
- `pgp_sym_encrypt` produziert `bytea`-Output; die Spalte muss von `TEXT` auf
  `bytea` geaendert werden oder Base64-Kodierung hinzugefuegt werden.

---

### Option C: Supabase Edge Function als Key-Proxy

API-Keys werden gar nicht in der DB gespeichert. Eine Supabase Edge Function
haelt die Keys als Edge-Function-Secrets und stellt sie nur nach
JWT-Verifikation bereit.

**Abgelehnt:** Bricht die bestehende Admin-Oberflaeche (Key-Verwaltung im
Dashboard), erfordert signifikante Umstrukturierung des Routing-Layers (L
Aufwand), und loest das Problem auf Kosten eines neuen Systemgrenzen-Problems
(wer darf die Edge Function aufrufen?). Nicht vereinbar mit Phase-0
S–M-Constraint.

---

## Decision Outcome

**Gewaehlt: Option A — Supabase Vault (pgsodium)**

**Begruendung:** Vault ist der einzige Ansatz, bei dem das Encryption-Secret
(pgsodium root-key) strukturell ausserhalb des Anwendungscodes *und* ausserhalb
der Datenbank liegt. Ein kompromittierter Service-Role-Key oder ein DB-Dump
enthaelt damit nur Vault-UUIDs, keine entschluesselten API-Keys. Option B
verbessert die Situation, loest aber das grundlegende Problem nicht: Wer den
Service-Role-Key und die Env-Var-Passphrase hat, hat alle Keys. Option C ist
fuer Phase 0 zu aufwaendig.

Der zusaetzliche Komplexitaetsaufwand (Vault-API statt direktem Column-Read)
ist gering und auf `provider-keys.ts` isoliert. Der Schreibpfad aendert sich
minimal (UUID in der Spalte statt Plaintext).

---

## Konsequenzen

**Positiv:**
- API-Keys sind at-rest verschluesselt; auch Supabase-Admins und
  DB-Dump-Analysten sehen nur UUIDs.
- Key-Rotation (pgsodium) liegt vollstaendig bei Supabase, kein Application-Code
  muss geaendert werden.
- OWASP A02 (Cryptographic Failures) wird fuer diesen Pfad geschlossen.
- Kein neuer externer Dienst notwendig.

**Negativ:**
- `provider-keys.ts` benoetigt einen SQL-Call auf `vault.decrypted_secrets`
  statt des direkten ORM-Selects — Supabase-SDK `from()` reicht nicht aus,
  ein raw-SQL-Call via `supabase.rpc()` oder `supabase.from('vault.decrypted_secrets').select()` ist notwendig.
- Lokale Supabase-Entwicklungsumgebung muss pgsodium korrekt konfiguriert
  haben (`supabase/config.toml`: `[db.seed]`-Abschnitt).
- Bei einem Supabase-Plattform-Ausfall ist Vault-Decryption nicht moeglich
  (kein self-hosted Fallback ohne eigenen Postgres-Cluster — bereits bekannter
  Constraint).
- Bestehende Plaintext-Keys muessen manuell in den Vault migriert werden (einmalig).

**Neutral:**
- Die Spalte `api_key_encrypted` wird inhaltlich zur Vault-UUID; der Name
  bleibt unveraendert, um nachgelagerte Selects nicht zu brechen.
- Der Admin-GET-Endpunkt maskiert bereits Keys vor der HTTP-Antwort — dieses
  Verhalten bleibt unberuehrt.

---

## Implementation Plan fuer Phase-0 Developer-B

### Voraussetzungen

Supabase Vault / pgsodium ist in allen Supabase Cloud-Projekten per Default
aktiv. Vor Beginn sicherstellen: `SELECT * FROM pg_extension WHERE extname = 'pgsodium';` gibt eine Zeile zurueck.

### Schritt 1 — Migration: Vault aktivieren und Bestands-Keys migrieren

Neue Migration `supabase/migrations/00NNN_vault_api_keys.sql`:

```sql
-- Schritt 1a: pgsodium/Vault sicherstellen (ist per Default aktiv,
-- explizit dokumentieren)
-- CREATE EXTENSION IF NOT EXISTS pgsodium; -- nur falls lokal nicht aktiv

-- Schritt 1b: Bestehende Plaintext-Keys in Vault-Secrets ueberfuehren
-- und UUID zurueckschreiben.
-- Muss fuer jeden aktiven Provider einmalig ausgefuehrt werden.
-- Beispiel-Pattern (in einem DO-Block oder separatem Script):
--
-- DO $$
-- DECLARE
--   r RECORD;
--   vault_id UUID;
-- BEGIN
--   FOR r IN
--     SELECT id, provider_key, api_key_encrypted
--     FROM ai_providers
--     WHERE api_key_encrypted IS NOT NULL
--       AND length(api_key_encrypted) > 36  -- noch keine UUID
--   LOOP
--     SELECT vault.create_secret(
--       r.api_key_encrypted,
--       'ai_provider_key_' || r.provider_key,
--       'API key for provider ' || r.provider_key
--     ) INTO vault_id;
--
--     UPDATE ai_providers
--     SET api_key_encrypted = vault_id::TEXT
--     WHERE id = r.id;
--   END LOOP;
-- END;
-- $$;
--
-- Hinweis fuer Developer-B: Das DO-$$-Skript ist eine Skizze.
-- Die Unterscheidung "ist schon UUID vs. ist Plaintext" per length()-Heuristik
-- ist ausreichend fuer eine einmalige Migration, aber muss vor dem Merge
-- gegen die echten Daten verifiziert werden.
```

**Verify:** Nach der Migration enthalten alle Zeilen in `api_key_encrypted`
eine UUID (36 Zeichen, Bindestrich-Format). `SELECT id, provider_key,
length(api_key_encrypted) FROM ai_providers;` — alle Werte sollten 36 Zeichen
lang sein.

### Schritt 2 — Read-Pfad: `provider-keys.ts` auf Vault-Decryption umstellen

Der bestehende Code liest `api_key_encrypted` direkt. Nach der Migration ist
dieser Wert eine Vault-UUID. Der Lesepfad muss die UUID aufloesen:

**Wrapper-Spec fuer `getProviderApiKeysFromDB()`:**

1. Bestehender Query bleibt: `select('provider_key, api_key_encrypted, is_active')`.
2. Fuer jede Zeile mit einer gueltigen UUID in `api_key_encrypted` wird ein
   zweiter Query auf `vault.decrypted_secrets` gefeuert: `SELECT decrypted_secret
   FROM vault.decrypted_secrets WHERE id = '<uuid>'`.
3. Alternativ (effizienter): Ein einziger JOIN-Query via raw SQL durch
   `supabase.rpc('get_active_provider_keys')`, wobei die RPC-Funktion in Postgres
   den JOIN auf `vault.decrypted_secrets` ausfuehrt und nur den entschluesselten
   Wert zurueckgibt (nie die UUID).
4. Die RPC-Funktion muss `SECURITY DEFINER` tragen und mit `SET search_path =
   extensions, public` abgesichert sein (verhindert search_path-Injection,
   konsistent mit Phase-1-Task 1.9).
5. Der in-memory Cache bleibt unveraendert (60s TTL).

**Wichtig:** `vault.decrypted_secrets` ist per Default nur fuer die
`service_role` und die `pgsodium_keyholder`-Rolle zugaenglich. Der Admin-Client
in `provider-keys.ts` verwendet den Service-Role-Key — das ist korrekt und
ausreichend.

### Schritt 3 — Schreib-Pfad: Admin-PUT auf Vault-Upsert umstellen

In `src/app/api/admin/providers/route.ts`, PUT-Handler:

**Spec:**

1. Wenn `updates` einen API-Key enthaelt (Feld-Name muss im Update-Schema
   definiert werden, z.B. `api_key`), darf dieser *nicht* direkt in `updates`
   fuer den Supabase-Update-Call landen.
2. Stattdessen: `vault.create_secret()` oder `vault.update_secret()` aufrufen,
   UUID zuruueckschreiben in `api_key_encrypted`.
3. Das `updateProviderSchema` in `src/lib/validators/admin.ts` muss ein
   optionales `api_key`-Feld kennen, das vor dem DB-Write extrahiert und
   separat verarbeitet wird.
4. Das Masking in `maskApiKey()` bleibt unveraendert.

### Schritt 4 — Lokale Entwicklungsumgebung dokumentieren

In `docs/architecture/` (oder als Kommentar in `supabase/config.toml`):
Hinweis, dass `supabase start` pgsodium per Default aktiviert. Fuer
Lokal-Tests mit Vault sollte ein Seed-Script die Vault-Secrets anlegen (analog
zur Migration). Ohne diesen Hinweis werden Entwickler lokal auf `null` stossen
beim Decrypt-Versuch.

### Schritt 5 — Smoke-Test und Cache-Invalidierung

Nach dem Deployment:

1. Admin-Dashboard: Einen Provider-Key neu setzen (Schreib-Pfad verifizieren).
2. `invalidateProviderKeyCache()` aufrufen (oder 60s warten).
3. Einen AI-Chat-Request absetzen — Provider antwortet korrekt (Read-Pfad
   verifizieren).
4. `SELECT api_key_encrypted FROM ai_providers` im Supabase-Dashboard — Wert
   ist eine UUID, kein Plaintext.

---

## Rollback-Plan

**Wenn die Migration fehlschlaegt (Vault nicht erreichbar / pgsodium nicht aktiv):**

1. Migration nicht committen. Bestehende Plaintext-Daten bleiben unveraendert.
2. `supabase db reset` auf der lokalen Instanz, auf Produktion: Migration
   rueckgaengig machen via neuer Down-Migration (Spalte auf Originalwert
   zuruecksetzen — nur moeglich, wenn die Original-Plaintext-Keys noch
   anderweitig bekannt sind, z.B. aus dem Passwort-Manager).
3. **Kritischer Hinweis:** Vor der Migration die aktuellen Plaintext-Keys aus
   der Datenbank sichern (in einem Passwort-Manager, nicht in der Codebase).
   Nur so ist ein Rollback ohne Key-Verlust moeglich.

**Wenn der Read-Pfad nach der Migration fehlschlaegt (Vault-Decryption gibt
null zurueck):**

1. `getProviderApiKeysFromDB()` gibt bereits einen Stale-Cache-Fallback zurueck
   (bestehende Logik, Zeile 68-70 in `provider-keys.ts`). Im schlimmsten Fall
   werden Provider-Requests mit veralteten Keys versucht.
2. Immediate Mitigation: `invalidateProviderKeyCache()` aufrufen, Vault-UUID
   in `ai_providers` pruefen, RPC-Funktion in Supabase-Dashboard testen.
3. Wenn Vault-Decryption systematisch ausfaellt: temporaer die RPC-Funktion
   deaktivieren und direkt den Vault-UUID-Wert zurueckgeben — das zeigt den
   Fehler explizit und verhindert stille Fehler mit falschen Keys.

**Wenn ein Provider-Key nach der Migration nicht mehr funktioniert:**

1. Admin-Dashboard: Key fuer diesen Provider neu setzen (Schreib-Pfad
   ueberschreibt den Vault-Secret mit einem neuen Wert).
2. Cache invalidieren.
3. Kein Code-Rollback notwendig.

---

## Alternativen (Zusammenfassung der Ablehnung)

| Option | Abgelehnt weil |
|---|---|
| pgcrypto pgp_sym_encrypt (Option B) | Encryption-Secret (Passphrase) lebt als Env-Var im selben Trust-Domain wie der Service-Role-Key; Key-Rotation erfordert Re-Encrypt aller Zeilen |
| Edge Function als Key-Proxy (Option C) | L-Aufwand, bricht bestehende Admin-Oberflaeche, Phase-0-Constraint S–M verletzt |
| Kein Encryption, nur RLS (Status quo) | OWASP A02 Critical — RLS wird von Service-Role-Key umgangen |

---

## Referenzen

- `supabase/migrations/00001_initial_schema.sql` — Tabelle `ai_providers`,
  ab Zeile 505
- `src/lib/ai/provider-keys.ts` — Read-Pfad, aktuell kein Decrypt-Schritt
- `src/app/api/admin/providers/route.ts` — Schreib-Pfad (PUT-Handler)
- `docs/IMPROVEMENTS.md` — Phase 0.2, Zeile 28
- Supabase Vault Dokumentation: https://supabase.com/docs/guides/database/vault
- pgsodium: https://github.com/michelp/pgsodium
- OWASP A02:2021 Cryptographic Failures:
  https://owasp.org/Top10/A02_2021-Cryptographic_Failures/

---

*Revisions: keine*
