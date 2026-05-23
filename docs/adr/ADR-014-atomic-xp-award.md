# ADR-014: Atomic XP-Award via DB-Idempotency

## Status

Accepted (2026-05-14)

## Context

`awardXP` bestand aus drei separaten DB-Operationen: SELECT pre-check,
RPC `award_xp`, INSERT in `xp_log`. Das Race-Window zwischen pre-check und
RPC erlaubte Double-Awards bei parallelen Requests (z.B. schnelle
Retry-Requests oder concurrent Tabs). Der vorhandene UNIQUE-Index auf
`xp_log` schuetzte nur das Log, nicht die XP-Bilanz in `profiles.xp`.

Migration `00032_xp_log.sql` (Welle 1) hatte `idempotency_key` eingefuehrt,
aber die App-Side-Logik blieb weiterhin nicht-atomar.

## Decision

Idempotenz wird vollstaendig in die DB verlagert. Neue RPC
`award_xp_idempotent` (Migration `00033_atomic_award_xp.sql`) arbeitet in
einer PostgreSQL-Transaction:

1. `INSERT INTO xp_log ... ON CONFLICT (user_id, idempotency_key) DO NOTHING RETURNING id`
2. Nur wenn der Insert eine Row produziert (kein Conflict), wird
   `profiles.xp` erhoet und der Daily-Cap-Counter inkrementiert.
3. Bei Conflict: die Funktion gibt `null` zurueck — kein Fehler, kein
   Double-Award.

Die App-Side prueft nur noch das Rueckgabe-Ergebnis, nicht mehr den
pre-check.

## Consequences

**Positiv:**

- Race-freier Award — kein Double-Award moeglich, unabhaengig von
  Concurrent-Requests.
- Idempotency-Key ist jetzt canonisch fuer jeden Award-Typ definiert.
- `xp_log` ist Source-of-Truth fuer jeden einzelnen XP-Award.

**Negativ / Einschraenkungen:**

- Schema-Change: Legacy-RPC `award_xp` bleibt fuer Backwards-Compat erhalten,
  sollte mittelfristig entfernt werden.
- Daily-Cap bleibt App-Side (Redis). Der Redis-Check ist weiterhin
  race-faehig, wird aber durch den `xp_log SUM`-Fallback bei Redis-Fehler
  abgesichert (M-07).

## Referenzen

- Migration: `supabase/migrations/00033_atomic_award_xp.sql`
- Commit: ff7cd32
- Changelog: [Audit-Fix-Wave 2026-05-14](../../CHANGELOG.md) — C-04
