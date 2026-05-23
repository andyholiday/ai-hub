# ADR-015: requireAuth DB-Mismatch-Guard

## Status

Accepted (2026-05-14)

## Context

`requireAuth` las die Rolle des Users ausschliesslich aus dem JWT-Claim
`app_metadata.role`. Das war inkonsistent mit `requireAdmin`, das die DB
als Source-of-Truth nutzt und einen expliziten DB-Check durchfuehrt.

Ein Stale-JWT-Token (z.B. nach Role-Change durch Admin, bevor der Client
`refreshSession()` aufgerufen hat) konnte fuer ein kurzes Zeitfenster eine
veraltete Rolle praesentieren. Das Mismatch-Fenster war identifiziert worden
in der Phase-1/2-Audit-Follow-up-Wave (2026-05-13).

Test-Coverage auf `require-auth.ts` lag bei 0%, was das Problem verschleiert
hatte.

## Decision

`requireAuth` fuehrt jetzt einen zusaetzlichen lightweight Read auf
`profiles.role` durch:

- Bei Mismatch zwischen JWT-Claim und DB-Wert: DB gewinnt, JWT-Claim wird
  verworfen, ein Warning wird geloggt.
- Bei DB-Fehler (z.B. Timeout): Fallback auf JWT-Claim — kein 500-Cascade
  fuer den Client.

Das Verhalten ist damit analog zu `requireAdmin`.

## Consequences

**Positiv:**

- Konsistent mit `requireAdmin` — eine Auth-Logik, nicht zwei.
- Source-of-Truth ist die DB; Stale-JWT-Bypass eliminiert.
- Coverage auf `require-auth.ts`: 0% auf 94% angehoben (m-03).

**Negativ / Einschraenkungen:**

- +1 DB-Roundtrip pro Auth-Call (~5 ms). Caching-Opportunity besteht,
  falls Performance-kritisch — noch nicht umgesetzt.
- DB-Fehler maskieren JWT-Stale weiterhin (graceful degradation, akzeptiert).

## Referenzen

- Source: `src/lib/api/require-auth.ts`
- Commit: f79f95e
- Verwandtes ADR: [ADR-016](ADR-016-provider-admin-consolidation.md) (Phase 1/2, X-Role-Changed-Client-Refresh)
- Changelog: [Audit-Fix-Wave 2026-05-14](../../CHANGELOG.md) — M-11
