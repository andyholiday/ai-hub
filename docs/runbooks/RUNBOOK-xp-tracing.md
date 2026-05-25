# Runbook: XP-Tracing (Debug fehlender XP-Awards)

## Symptom

User erwartet XP-Award, erhalt aber keinen — kein Level-Up, kein
XP-Anstieg sichtbar.

## Schritt 1: xp_log pruefen

```sql
SELECT action, xp_awarded, idempotency_key, awarded_at
FROM xp_log
WHERE user_id = '<user-id>'
ORDER BY awarded_at DESC
LIMIT 20;
```

Wurde der Award ueberhaupt vergeben? Falls ja: der XP-Wert in `profiles.xp`
koennte veraltet sein — dann `profiles` pruefen.

## Schritt 2: Daily-Cap pruefen

Redis-Key: `daily_xp:<userId>:<YYYY-MM-DD>` (z.B. `daily_xp:abc123:2026-05-14`).

Wert `>= 500`: Daily-Cap erreicht, kein weiterer Award moeglich bis Mitternacht.

Fallback bei Redis-Fehler: SQL-Aggregation ueber `xp_log` (fail-closed, kein
Cap-Bypass).

## Schritt 3: Idempotency-Key pruefen

Wenn `xp_log` bereits eine Row mit gleichem `(user_id, idempotency_key)`
enthaelt, ist kein Bug — das ist korrektes Verhalten (ON-CONFLICT DO NOTHING).

## Bekannte Actions und ihre Keys

| Action | XP | Idempotency-Key | Einmalig? |
|---|---|---|---|
| `complete_onboarding` | 50 | `complete_onboarding` | ja |
| `department_set` | 25 | `department_set` | ja |
| `lesson_completed` | 20 | `lesson:<lessonId>` | pro Lektion |
| `course_completed` | xp_reward (aus DB) | `course:<courseId>` | pro Kurs |
| `idea_evaluated` | 30 | `idea_eval:<postId>` | pro Post |
| `post_created` | variabel | kein Key | riskant bei Retries |
| `comment_created` | variabel | kein Key | riskant bei Retries |
| `upvote_received` | variabel | kein Key | riskant bei Retries |

Hinweis: `post_created`, `comment_created`, `upvote_received` haben noch
keinen Idempotency-Key — Sprint-Backlog-Item.

## Schritt 4: Logs pruefen

Bei RPC-Fehler in `award_xp_idempotent`: `console.error`-Ausgaben mit
Prefix `[XP]` in den Vercel-/Server-Logs suchen.

## Login-Streak

`streak_days` wird beim `GET /api/profile` als Fire-and-Forget via
`update_login_streak`-RPC aktualisiert. Ein 20h-Guard in der DB-Funktion
verhindert Mehrfach-Updates pro Tag.

## Verwandte Dokumente

- [ADR-014: Atomic XP-Award](../adr/ADR-014-atomic-xp-award.md)
- [CHANGELOG Audit-Fix-Wave](../../CHANGELOG.md)
