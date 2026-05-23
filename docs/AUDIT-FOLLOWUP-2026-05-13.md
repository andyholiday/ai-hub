# Follow-up Backlog — Audit Massnahmenplan

**Stand:** 2026-05-13
**Vorgaenger:** [docs/AUDIT-FOLLOWUP-2026-05-12.md](AUDIT-FOLLOWUP-2026-05-12.md)
**Branch-Index:** [docs/BRANCH-INDEX-2026-05-13.md](BRANCH-INDEX-2026-05-13.md)
**Quality-Reviews:**
- [docs/quality/REVIEW-2026-05-13-wave-1.md](quality/REVIEW-2026-05-13-wave-1.md)
- [docs/quality/REVIEW-2026-05-13-wave-2.md](quality/REVIEW-2026-05-13-wave-2.md)
- [docs/quality/REVIEW-2026-05-13-wave-3.md](quality/REVIEW-2026-05-13-wave-3.md)

---

## Task-Tabelle (Stand 2026-05-13)

| Task | Beschreibung | Status | Branch |
|------|--------------|--------|--------|
| 1 | Restore AI Provider Availability | **DONE** (05-13) | `feature/phase-1-provider-key-cleanup` |
| 2 | Patch Critical Supabase Role Escalation | DONE (05-12) | `feature/phase-0-security-hardening` |
| 3 | Revoke Dangerous Client RPC Access | DONE (05-12) | `feature/phase-0-security-hardening` |
| 4 | Lock Mentor Signal RPCs To Current User | DONE (05-12) | `feature/phase-0-security-hardening` |
| 5 | Normalize AI Chat Validation & Error UX | DONE (05-12) | Wave 2 |
| 6 | Choose One Mounted Orb Chat Path | **DONE** (05-13, ohne History-Endpoint) | `feature/phase-1-orb-chat-consolidation` |
| 7 | Unify Admin Role Source | DONE (05-12) + **NOP-01 DONE** (05-13) | `feature/phase-1-admin-auth-and-challenges` + `feature/phase-1-role-change-client-refresh` |
| 8 | Add Authenticated Playwright Fixture | **PARTIAL DONE** (lokaler Teil 05-13; CI braucht User-Secrets) | `feature/phase-1-playwright-auth-fixture` |
| 9 | Finish Best Practices End-To-End | DONE (05-12) | `feature/phase-2-best-practices-api` |
| 10 | Consolidate Admin Subroutes | **PARTIAL DONE** (05-13; analytics/content/settings als Backlog-Stubs) | `feature/phase-2-admin-subroutes` |
| 11 | Harden Challenge Progress Mechanics | DONE (05-12) | `feature/phase-2-best-practices-api` |

---

## Offene Punkte nach 2026-05-13

### NOP-02 — `/api/ai/chat/history` Endpoint (F07 Restposten)

`useOrbChat.loadMore()` bleibt bewusster No-Op. History-Pagination fuer den
Orb-Chat ist nicht implementiert. Separat als eigenstaendiger Task zu planen
(Phase 3 Scope).

**Referenz:** F07 in [docs/AUDIT-FOLLOWUP-2026-05-12.md](AUDIT-FOLLOWUP-2026-05-12.md).

---

### NOP-03 — analytics/content/settings echte Module

`/admin/analytics`, `/admin/content` und `/admin/settings` sind aktuell
Platzhalter-Stubs mit Backlog-Link. Kein Security-Risiko — Middleware-Auth
greift. Echte Modul-Implementierung als eigenstaendige Tasks planen.

**Referenz:** Task 10, Branch `feature/phase-2-admin-subroutes`.

---

### NOP-04 — `ai-mentor/page.tsx` Legacy-Chat-Pfad

`ai-mentor/page.tsx` nutzt weiterhin `OrbProvider.addMessage` + eigenen
`fetch`-Aufruf direkt (Legacy-Chat-Pfad). Nicht durch den Orb-Consolidation-
Refactor beruehrt. Sollte in einem Folge-Refactor auf `useOrbChat` migriert
werden.

**Referenz:** T3 Finding F01 in
[docs/quality/REVIEW-2026-05-13-wave-3.md](quality/REVIEW-2026-05-13-wave-3.md).

---

### NOP-05 — `admin-users.tsx` Delete-Modal

`window.confirm` in `admin-users.tsx:154` sollte vor Public-Launch durch ein
echtes Confirm-Modal mit User-Identifier (Name/Email) ersetzt werden.

**Referenz:** T4 Finding F01 in
[docs/quality/REVIEW-2026-05-13-wave-1.md](quality/REVIEW-2026-05-13-wave-1.md).

---

### NOP-06 — Migration 00029 COALESCE-Kommentar

Optionaler einzeiliger Kommentar in Migration 00029 Zeile 14 fehlt
(Erklaerung des COALESCE-Ausdrucks). Keine funktionale Auswirkung.

**Referenz:** T1 Finding F01 in
[docs/quality/REVIEW-2026-05-13-wave-1.md](quality/REVIEW-2026-05-13-wave-1.md).
