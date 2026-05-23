# Branch-Assessment — origin/* (Stand 2026-05-23)

Inspektion aller Remote-Branches, die nicht auf `origin/main` sind, mit Empfehlung
"keep / integrate / discard". Basis: `git rev-list --count origin/main..origin/<branch>`
+ `git diff --shortstat` + Commit-Liste.

## Verdict-Tabelle

| Branch | Ahead | Diff | Letzter Commit | Verdict | Begründung |
|---|---:|---|---|---|---|
| **`feature/audit-fixes-2026-05-14`** | **59** | **+12943/-1551 in 140 Dateien** | 2026-05-15 | **INTEGRATE** | Session-6/7-Arbeit: ADR-014/15/16, OpenRouter, Best-Practices-CRUD, Wave-11-Security-Iter-2, NOP-07 Mentor-Prompt, atomic XP, Mismatch-Guard, Auth-Playwright. Wertvoll. **Kollidiert mit meinem Branch** (s.u.). |
| `feature/phase-2-frontend` | 2 | +236/-14657 in 130 Dateien | 2026-05-01 | **DISCARD** | Fast nur Löschungen, weit hinter main. Superseded durch spätere Merges. |
| `preview-merge-2026-05-13` | 38 | +6009/-1142 in 64 Dateien | 2026-05-14 | **DISCARD** | Echte Teilmenge von audit-fixes (0 Commits exklusiv). |
| `feature/branding-cleanup` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/fix-admin-users-listusers` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/fix-seed-auth-users` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/phase-1-backend` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/phase-1-docs` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/phase-1-frontend` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/phase-2-backend` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/phase-2-docs` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/provider-key-ui` | 0 | — | — | DELETE | Bereits gemergt. |
| `feature/v3-*` (13 Branches) | 0 | — | — | DELETE | Alle in `v3-integration` → main gemergt. |

## Wichtiger Hinweis: lokaler `main` ≠ origin/main

Laut Winston-Reflect-Log (Sessions 4–7) ist Andres lokaler `main` "~165 Commits ahead of
origin, kein push", plus zusätzliche un-gepushte Commits auf `audit-fixes-2026-05-14`
(Session 7: 13 Files, +385/-109 ab `ebe3709`). Origin spiegelt also vermutlich nicht den
echten Latest-State. **Vor Integration in der Folge-Session: Andres lokalen `main`/`audit-fixes`
mit origin abgleichen.** (Memory: `ai-hub-origin-behind-local`.)

## Kollisionen zwischen `audit-fixes-2026-05-14` und meinem Branch

Vorab-Diagnose der Konflikte, die in der Folge-Session zu erwarten sind:

| Bereich | Auf `audit-fixes` | Auf meinem Branch | Konfliktart |
|---|---|---|---|
| **Migrations 00025–00029** | `00025` `00026` `00027` `00028` `00029` (XP atomic, Mismatch-Guard, Provider-Admin, IF-NOT-EXISTS-Fix, chatgpt→openai) | `00025_ai_budget_cap.sql` + `00026_fix_hybrid_search_visibility.sql` | **Nummern-Kollision** → meine zwei müssen renummeriert werden (`00030_` / `00031_`) |
| **Chat-Route + Mentor-Prompt** | NOP-07: server-side AI-Hub-Mentor-System-Prompt | DEV-5: client-Mentor-Caller umgestellt + zod + abort + RAG + budget | Wahrscheinlicher Konflikt: ihre System-Prompt-Quelle vs. meine Validierung; Logik beider behalten |
| **ai-mentor/page.tsx** | NOP-07 entfernt `role:"system"`-Send | DEV-5-Iter2 entfernt `role:"system"`-Send | Vermutlich identisch oder mergebar (gleiches Ziel) |
| **Hybrid-Search-RLS** | Wave-11 Iter-2 F04 Draft-Leak-Fix | `00026` `caller_id`-Filter + Drop der alten Überladung | Funktional ähnliches Ziel — Mechanik prüfen, einer der beiden behalten |
| **Provider-Liste / OpenRouter** | OpenRouter als 7. Provider in router + Enum | Mein `KNOWN_PROVIDERS`-Enum kennt OpenRouter nicht | Mein Enum **muss ergänzt** werden, sonst HTTP 400 für OpenRouter-Requests |
| **require-auth / Mismatch-Guard** | ADR-016 JWT-DB Mismatch-Guard in requireAdmin | meine Routen rufen `requireAuth`/`requireAdmin` aufeinanderfolgend | Verträglich; Signatur prüfen |
| **Test-Setup** | Authenticated Playwright + Seed-Script + storageState | ich hab nur statisches Vitest grün | Komplementär — integrieren statt überschreiben |
| **CHANGELOG** | Eigener großer Block | Meine Conventional-Commits | Beide Blöcke nebeneinander |

## Empfehlung

1. **Behalten/integrieren:** `feature/audit-fixes-2026-05-14`.
2. **Verwerfen:** `preview-merge-2026-05-13`, `feature/phase-2-frontend`.
3. **Aufräumen:** Alle Branches mit `ahead=0` können nach Push gelöscht werden (Andre via `gh` oder Web-UI).
4. **Sequenz:** Erst meine Migrations renummerieren (Kollisions-Vermeidung), dann `audit-fixes` in mein Branch mergen, Konflikte methodisch lösen, Build/Test, Codex-Gate, Push.

Konkrete Task-Liste + Startprompt für die Folge-Session: siehe `10-fresh-session-startprompt.md`.
