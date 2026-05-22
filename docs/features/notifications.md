# Benachrichtigungen

**Was es ist:** Eine Benachrichtigungs-Seite (`/notifications`) und ein dazugehoeriger Notification-Store, der Toast-Nachrichten und System-Events fuer den Nutzer aggregiert.

## Mehrwert / Benefit

Nutzer werden ueber relevante Ereignisse informiert (Achievements freigeschaltet, Antworten auf Posts, System-Meldungen), ohne die aktuelle Seite verlassen zu muessen.

## User-Prozess

1. Nutzer navigiert zu `/notifications` ueber die Sidebar oder den Header-Glocken-Button.
2. Liste der Benachrichtigungen (chronologisch).
3. Benachrichtigungen koennen als gelesen markiert werden.
4. Toast-Nachrichten erscheinen kontextsensitiv direkt in der Ecke der App (z.B. nach XP-Vergabe).

## Einfachheit & Fuehrung

- **Toast-Provider** (React Context) zeigt Erfolgs-, Warn- und Fehlermeldungen systemweit ohne separate Navigation.
- **Orb-Notification-State:** Bei einer neuen Benachrichtigung wechselt der Orb in den "notification"-State (Status-Dot wechselt auf Gold).

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Notifications-Seite | `src/app/(dashboard)/notifications/page.tsx` (Server Component) |
| Notifications-API | `src/app/api/notifications/route.ts` |
| Notification-Store | `src/stores/notifications.ts` (Zustand) |
| DB-Tabelle | `notifications` |

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Toast-Benachrichtigungen (systemweit) | Live |
| Notification-Store | Live |
| Benachrichtigungs-Seite (`/notifications`) | Platzhalter — zeigt "Deine Benachrichtigungen werden bald verfuegbar sein." |
| Echtzeit-Push via Supabase Realtime | Nicht live |
| E-Mail-Benachrichtigungen | Nicht live |

**Hinweis:** Die Notifications-Seite ist ein Server-Component-Platzhalter. Die eigentliche Benachrichtigungs-UI ist noch nicht implementiert — nur der Toast-Layer und der Zustand-Store sind aktiv.
