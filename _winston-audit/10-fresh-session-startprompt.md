# Startprompt für die Folge-Session (Integration `audit-fixes` + Push)

Kopiere den unteren Block 1:1 in eine **frische** Claude-Code-Session
(`cd /Users/andreja/Documents/0.Projekte/web_ai_hub/ai-hub`, dann starten und
den Block als allerersten Prompt einfügen).

## Vorbereitete Tasks (werden in der Folge-Session erstellt)

1. **PRE-1:** Reconcile origin/main vs. Andres lokalen `main` + lokalen `audit-fixes`
   (laut Reflect-Log ist origin Sessions hinterher). Klären, ob lokale Stände gepusht
   werden müssen, bevor irgendetwas integriert wird.
2. **MIG-RENUM:** Meine `00025_ai_budget_cap.sql` und `00026_fix_hybrid_search_visibility.sql`
   umnummerieren auf die nächsten freien Slots **über** den höchsten Stand von `audit-fixes`
   (vermutlich 00030 + 00031). Die `Version:`-Header im File-Header mit anpassen.
3. **INT-MERGE:** `git merge origin/feature/audit-fixes-2026-05-14` in meinen Branch
   `feature/winston-audit-improvements-2026-05-22`. Konflikte erwartet bei:
   - `src/app/api/ai/chat/route.ts` (NOP-07 server-mentor vs. meine Härtung+RAG+budget)
   - `src/app/(dashboard)/ai-mentor/page.tsx` (beide entfernen `role:"system"`)
   - `src/lib/ai/router.ts` + `src/lib/ai/providers/index.ts` (OpenRouter als 7. Provider)
   - `src/app/api/admin/providers/test/route.ts` (mein `getAIRouterWithDBKeys`-Swap vs. ihre
     Provider-Admin-Konsolidierung)
   - `src/lib/api/require-auth.ts` (ADR-016 Mismatch-Guard)
   - `CHANGELOG.md` (beide Blöcke behalten, chronologisch)
4. **INT-FIX-1 (Provider-Enum):** `KNOWN_PROVIDERS` in `src/app/api/ai/chat/route.ts` um
   `"openrouter"` ergänzen, sonst 400 für legitime OpenRouter-Calls.
5. **INT-FIX-2 (RLS-Konsolidierung):** Hybrid-Search-RLS-Mechanik konsolidieren — entweder
   meine `caller_id`-Variante ODER ihre Wave-11 Draft-Leak-Variante; **nicht beide
   parallel** ungeprüft. Codex-Gate auf der Endfassung.
6. **INT-FIX-3 (Migration-Order):** Sicherstellen, dass alle Migrations in
   `supabase/migrations/` lückenlos und ohne Doppelnummer aufsteigen; `supabase db reset`
   gedanklich durchspielen.
7. **VERIFY:** `npm run type-check` + `npm run lint` + `npm run test` + `npm run build`
   sauber bekommen. Hinweis: `audit-fixes` hat eigene neue Tests (incl. Auth-Playwright);
   gemeinsam sollten ~750–850 Tests grün laufen.
8. **CODEX-GATE-FINAL:** Codex GPT-5.5 erhält den vollständigen Merge-Diff zur Review.
   Spezifischer Fokus: System-Prompt-Quelle vereinheitlicht, Provider-Enum komplett,
   keine doppelte RLS-Filter-Logik, alle Migrations applizierbar.
9. **PUSH:** Auf Andres Freigabe → `git push -u origin feature/winston-audit-improvements-2026-05-22`.
   Optional vorher Squash des WIP-Recovery-Commits.
10. **CLEANUP:** Stale Branches auf origin via `gh` oder Web-UI löschen (siehe
    `_winston-audit/09-branch-assessment.md` Tabelle, Spalte "DELETE").

---

## Startprompt (genau diesen Block kopieren)

```
Winston, übernimm bitte. Vorgeschichte:

- In der vorigen Session (Reflect-Log Session 8) wurden auf dem Branch
  feature/winston-audit-improvements-2026-05-22 Audit + Umsetzung + Doku
  geliefert (98 Dateien, +7814; 643 Tests grün; Codex Gate #3 = SHIP).
  NICHT gepusht, Push-Erlaubnis liegt vor.
- Vor dem Push muss noch der un-gemergte Branch
  feature/audit-fixes-2026-05-14 (59 Commits, +12943/-1551) integriert
  werden. Assessment + erwartete Konflikte siehe
  _winston-audit/09-branch-assessment.md. Konkrete Task-Liste siehe
  _winston-audit/10-fresh-session-startprompt.md.

Bitte arbeite die Tasks PRE-1 bis CLEANUP genau in der dort gelisteten
Reihenfolge ab — mit Codex-Gate #2 auf jeder konfliktbehafteten Datei und
einem finalen Codex-Gate #3 vor dem Push. Sub-Agents dürfen KEINE git-
Kommandos ausführen (Lehre aus Session 8: ein Sub-Agent hatte `git stash`
benutzt und fremde uncommittete Arbeit verschoben). Du machst alle VCS-
Operationen selbst.

Eine Frage vor dem Start, weil sie alles ändert: enthält mein lokaler
main (in dem anderen Ordner, NICHT in diesem Klon) bereits einen Teil
oder das Ganze von audit-fixes-2026-05-14? Wenn ja, klären wir zuerst,
welcher Stand der wahre Latest-State ist, bevor wir mergen.
```

---

## Zusatz-Hinweise für die nächste Session

- **Doku-Stand:** SHOWCASE.md, 6 Mermaid-Diagramme, SVG-Header und Screenshot-Manifest
  sind bereits committed. README hat einen Hero-Block oben. `docs/AI-HUB-Overview.html`
  ist self-contained.
- **Memory:** `~/.claude/projects/-Users-andreja-Documents-0-Projekte-web-ai-hub/memory/ai-hub-origin-behind-local.md`
  dokumentiert die Divergenz.
- **Reflect-Log:** Lehren von Session 8 stehen in
  `~/.claude/skills/winston-orchestrator/reflect-log/ai-hub.md` (insbesondere:
  Sub-Agents dürfen kein git; parallele Build-Contention vermeiden; Doc-Accuracy-Pass nach
  Generierung).
- **Branch-Cleanup nicht vergessen:** Tabelle in `09-branch-assessment.md` listet, was
  nach Push gelöscht werden kann.
