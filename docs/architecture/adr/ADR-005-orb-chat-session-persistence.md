# ADR-005: Orb-Chat-Session-Persistenz via Supabase

## Status

Accepted

---

## Context

Der Living-Cloud-Mentor (Orb) ist der zentrale KI-Interaktionspunkt der
lr-ai-hub-Plattform. Er ist als schwebendes Chat-Widget realisiert, das
Layout-weit per `OrbProvider` bereitgestellt wird (eingebunden in
`src/app/(dashboard)/layout.tsx`).

Aktueller Zustand (Stand 2026-05-01): `OrbProvider` haelt alle Chat-Nachrichten
ausschliesslich im React-State (`useState<ChatMessage[]>([])`). Beim Reload,
Navigation oder Tab-Wechsel gehen alle Nachrichten verloren. Die
`ChatPanel`-Komponente simuliert AI-Antworten mit einem hartkodierten Timeout
und ruft keinerlei API auf. Die Tabellen `ai_chat_sessions` und
`ai_chat_messages` existieren bereits in der Datenbank (verifiziert via
`src/lib/supabase/types.ts`), werden aber vom Frontend vollstaendig ignoriert.

Dies fuehrt zu einem defekten User-Experience (kein Session-Gedaechtnis,
keine echten AI-Antworten ueber den regulaeren Pfad) und macht Phase 2.2 der
IMPROVEMENTS.md-Roadmap zum funktionalen Bug.

Relevante Constraints:

- GDPR Art. 5 — Retention-Policy fuer Chat-Nachrichten (Phase 1.4: `expires_at`-
  Spalte) muss kompatibel bleiben.
- Token-Limit — endloser Kontext ist nicht moeglich; Truncation-Strategie muss
  bedacht werden (Vollimplementierung ist Out of Scope fuer Phase 2).
- Supabase Realtime — Out of Scope fuer Phase 2; nur als Future Work erwaehnt.
- RLS — `user_id = auth.uid()` muss fuer Sessions UND Messages erzwungen werden.

---

## Decision

Wir werden den `OrbProvider` um persistente Session-Verwaltung erweitern und
einen dedizierten Hook `useOrbChat()` einfuehren, der den gesamten
Nachrichten-Lebenszyklus kapselt. Der bestehende `useOrb()`-Hook bleibt fuer
UI-State (expanded/minimized, orbState, pageContext) unveraendert.

### Session-Lifecycle

**Wann wird eine neue Session erstellt?**
Beim ersten User-Message-Submit, wenn keine aktive `sessionId` im lokalen State
vorhanden ist. Die Session wird per API (`POST /api/ai/chat`) server-seitig
angelegt, nicht direkt vom Client via Supabase-JS.

**Wann wird eine bestehende Session wiederverwendet?**
Wenn `sessionId` im State vorhanden und die Session noch existiert. Die
`sessionId` wird im React-State gehalten (kein localStorage in Phase 2 —
Tab-Reload startet neue Session, was akzeptabel ist).

**Wann wird eine Session auto-geclosed?**
Nicht aktiv in Phase 2. Die Session lebt, bis der User eine neue initiiert
oder die GDPR-Retention-Policy (`expires_at`) greift. Ein expliziter
"Neues Gespraech"-Button kann eine neue `sessionId: null` setzen, was beim
naechsten Send eine neue Session erzeugt.

### Lade-Strategie (Lazy + Paginiert)

Da Sessions in Phase 2 nicht ueber Tab-Reloads hinaus wiederhergestellt werden
(kein localStorage), ist das initiale Laden im Scope auf den Fall beschraenkt,
dass eine `sessionId` aus einem Deep-Link oder Query-Parameter uebergeben wird.

Wenn geladen wird: Die letzten 50 Nachrichten werden initial geladen
(`DEFAULT_PAGE_SIZE = 50`). Scroll-to-Top triggert das Nachladen aelterer
Nachrichten in Paketen von 50 (`ORDER BY created_at DESC LIMIT 50 OFFSET n`).

### Optimistic-UI

User-Nachrichten werden sofort im UI angezeigt (optimistic insert), bevor die
Datenbank antwortet. Der optimistische Eintrag traegt eine temporaere ID
(`msg-{timestamp}-{random}`). Nach dem Stream-Ende liefert die API die
tatsaechliche DB-ID zurueck; der Hook reconciliert die IDs (tauscht die
temporaere ID gegen die echte aus). Wird die API-Anfrage abgebrochen oder
schlaegt sie fehl, wird die optimistische Nachricht aus dem State entfernt
und eine Fehlermeldung angezeigt.

AI-Nachrichten werden NICHT optimistisch eingefuegt; sie erscheinen erst beim
Streaming der ersten Chunk-Daten.

### API-Route-Integration

Der Chat-Flow laeuft ueber `POST /api/ai/chat` (bestehend). Die Route-Signatur
wird um optionale `sessionId`-Parameter erweitert. Die Route ist verantwortlich
fuer:

1. `requireAuth()` — authentifizierter User
2. Session-Lookup oder -Erstellung in Supabase
3. `INSERT ai_chat_messages` fuer die User-Message
4. `streamText()` via AI SDK
5. `INSERT ai_chat_messages` fuer die AI-Antwort (im `onFinish`-Callback)
6. Rueckgabe von `sessionId` und der neuen Message-IDs im Response-Header oder
   als Stream-Metadata

### Hook-API

```typescript
// src/components/features/ai-orb/use-orb-chat.ts

interface UseOrbChatReturn {
  /** Geladene + optimistische Nachrichten in chronologischer Reihenfolge */
  messages: ChatMessage[];
  /** Aktuell aktive Session-ID (null = noch keine Session gestartet) */
  sessionId: string | null;
  /** Ob aeltere Nachrichten geladen werden */
  isLoadingMore: boolean;
  /** Ob weitere aeltere Nachrichten verfuegbar sind */
  hasMore: boolean;
  /** Schickt eine User-Message ab und startet den AI-Stream */
  sendMessage: (content: string) => Promise<void>;
  /** Laedt die naechste Seite aelterer Nachrichten */
  loadMore: () => Promise<void>;
  /** Setzt sessionId auf null → naechste Message startet neue Session */
  startNewSession: () => void;
  /** Ob der AI-Stream aktiv ist */
  isStreaming: boolean;
  /** Letzter Fehler oder null */
  error: string | null;
}

function useOrbChat(options?: { initialSessionId?: string }): UseOrbChatReturn
```

### Kontext-Typ in Sessions

Das Feld `context_type` in `ai_chat_sessions` wird mit `"orb"` befuellt. Das
Feld `context_id` bleibt `null` (kein spezifischer Entitaets-Kontext in Phase 2;
Phase 8.1 / Mem0 koennte dies nutzen).

### RLS-Strategie

Die bestehenden Tabellen brauchen RLS-Policies, die explizit
`user_id = auth.uid()` erzwingen. Die Policies muessen ueberprueft und ggf.
als Migration ergaenzt werden (siehe Migration-Bedarf unten).

Fuer `ai_chat_messages` gibt es keine direkte `user_id`-Spalte — der Schutz
erfolgt ueber den FK zu `ai_chat_sessions`: Eine Message ist zugaenglich, wenn
ihre `session_id` zu einer Session gehoert, die `user_id = auth.uid()` hat.
Die RLS-Policy auf `ai_chat_messages` prueft dies via EXISTS-Subquery.

Alle DB-Writes fuer Messages und Sessions erfolgen server-seitig in der
API-Route (mit Service-Role oder Auth-Token des Users) — niemals direkt vom
Browser via Supabase-JS. Das minimiert die RLS-Angriffsflaeche.

---

## Hook-API (TypeScript-Signaturen)

```typescript
// Vollstaendige Signatur fuer die Developer-Implementierung

interface ChatMessage {
  id: string;                          // temporaer: "msg-{ts}-{rand}", dann DB-UUID
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isOptimistic?: boolean;              // true waehrend DB-Confirm aussteht
  dbId?: string;                       // gesetzt nach ID-Reconciliation
}

interface UseOrbChatOptions {
  initialSessionId?: string;           // z.B. aus URL-Query-Param
}

interface UseOrbChatReturn {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoadingMore: boolean;
  hasMore: boolean;
  sendMessage: (content: string) => Promise<void>;
  loadMore: () => Promise<void>;
  startNewSession: () => void;
  isStreaming: boolean;
  error: string | null;
}

declare function useOrbChat(options?: UseOrbChatOptions): UseOrbChatReturn;
```

`useOrbChat()` wird von `ChatPanel` konsumiert und ersetzt dort den bisherigen
direkten `useOrb()`-Aufruf fuer alles Nachrichten-bezogene. `useOrb()` bleibt
fuer UI-State zustaendig (isExpanded, orbState, pageContext).

---

## Sequenzdiagramm

Siehe Companion-Datei:
`docs/architecture/diagrams/ADR-005-orb-chat-sequence.md`

Kurzfassung:
1. User sendet → Nachricht erscheint optimistisch im UI
2. `POST /api/ai/chat` mit optionaler `sessionId`
3. API erstellt Session falls noetig (RLS via Server-Auth)
4. API persistiert User-Message in `ai_chat_messages`
5. `streamText()` erzeugt AI-Antwort (streamt in den Browser)
6. Nach Stream-Ende: AI-Message wird in `ai_chat_messages` persistiert
7. API gibt `sessionId` und DB-IDs zurueck
8. Hook reconciliert optimistische IDs gegen DB-IDs

---

## Datenmodell-Check

### Bestehende Tabellen (aus types.ts verifiziert)

**`ai_chat_sessions`:**

| Spalte | Typ | Pflicht | Anmerkung |
|--------|-----|---------|-----------|
| id | uuid | ja | PK, gen_random_uuid() |
| user_id | uuid | ja | FK → profiles.id |
| title | string | nein (Default leer) | Fuer Phase 2 nicht aktiv befuellt |
| context_type | string | nein | Wird mit `"orb"` befuellt |
| context_id | string | nein | Phase 2: null |
| provider_used | string | nein | Optional, kann nach Stream gesetzt werden |
| created_at | timestamptz | ja | auto |
| updated_at | timestamptz | ja | auto |

**`ai_chat_messages`:**

| Spalte | Typ | Pflicht | Anmerkung |
|--------|-----|---------|-----------|
| id | uuid | ja | PK |
| session_id | uuid | ja | FK → ai_chat_sessions.id |
| role | chat_message_role | ja | Enum: user / assistant / system |
| content | string | ja | |
| tokens_used | integer | nein | Wird nach Stream-Ende befuellt |
| created_at | timestamptz | ja | auto |

### Migration-Bedarf

**Kein Schema-Change noetig.** Die bestehenden Spalten decken alle Anforderungen
von Phase 2 ab. Zwei Punkte erfordern aber Pruefung und ggf. Migration-Ergaenzung:

1. **RLS-Policies fehlen oder sind unvollstaendig.** Es muss verifiziert werden,
   ob `ai_chat_sessions` und `ai_chat_messages` korrekte RLS-Policies haben
   (`user_id = auth.uid()` resp. EXISTS-Subquery). Wenn nicht: neue Migration
   nur fuer Policy-Statements, keine Schema-Aenderungen.

2. **`expires_at`-Spalte in `ai_chat_messages` fehlt** (Phase 1.4). Diese ist
   in `types.ts` nicht vorhanden. Da Phase 1.4 noch aussteht, ist dies kein
   Blocker fuer Phase 2.2 — aber die Migration muss additivkompatibel sein,
   wenn Phase 1.4 landet.

**Empfehlung:** Developer prueft Migrations in `supabase/migrations/` auf
vorhandene RLS-Policies fuer beide Tabellen. Falls Policies fehlen oder
`WITH CHECK (true)` enthalten: neue Migration `YYYYMMDD_rls_ai_chat.sql` mit
korrekten Policies anlegen.

---

## Pagination-Strategie

- **Default-Page-Size:** 50 Nachrichten pro Seite
- **Sortierung:** `ORDER BY created_at ASC` fuer Anzeige; initial werden die
  neuesten 50 geladen (`ORDER BY created_at DESC LIMIT 50`), dann umgekehrt
  fuer die Anzeige sortiert
- **Lade-Trigger:** Scroll-to-Top im Chat-Container (Intersection Observer auf
  dem obersten Message-Element)
- **Offset-Strategie:** Cursor-basiert via `created_at < oldest_loaded_timestamp`
  (stabiler als OFFSET bei gleichzeitigen Inserts)

---

## Consequences

**Positiv:**

- Chat-History ueberlebt Page-Navigation innerhalb einer Browser-Session
- AI-Kosten werden korrekt in `ai_cost_log` verbucht (bestehender Mechanismus
  in der API-Route)
- `tokens_used` wird pro Message persistiert — Basis fuer Token-Budget-Enforcement
- GDPR-Retention (Phase 1.4) kann nachtraeglich `expires_at` als additive
  Migration erhalten, ohne diese Entscheidung zu invalidieren
- RLS auf Server-Side-Only-Writes reduziert Client-Angriffsvektoren erheblich

**Negativ:**

- `sessionId` liegt nur im React-State — Tab-Reload verliert die Session-Bindung
  (User sieht leeren Chat, obwohl History in DB vorhanden). Akzeptiert fuer
  Phase 2; localStorage-Persistierung ist Future Work.
- Die ID-Reconciliation (optimistic → DB-ID) erhoehe die Komplexit des Hooks
  leicht. Fehler beim Reconcile koennen zu Duplicate-Messages fuehren, wenn
  nicht sorgfaeltig implementiert.
- Kein Streaming-Fallback wenn API-Route ausfaellt — User sieht Fehlermeldung
  statt Nachricht (kein Offline-Support in Phase 2).

**Neutral:**

- `context_type = "orb"` ist ein freies String-Feld. Keine Enum-Erweiterung
  noetig. Spezifischere Context-Typen kommen mit Phase 8 (Mem0).

---

## Alternativen

### A: Direkter Supabase-JS-Client aus dem Browser

User-Nachrichten und AI-Antworten werden direkt vom Browser in `ai_chat_messages`
geschrieben.

**Abgelehnt:** AI-Streaming laeuft server-seitig ueber die bestehende API-Route
(Entscheidung aus Phase 5.1). Direkter Client-Write wuerde zwei Write-Pfade
erzeugen (Browser + Server) mit Race-Condition-Risiko. RLS-Konfiguration wuerde
komplexer. Service-Role-Leaks waeren einfacher moeglich.

### B: Zustand in localStorage persistieren (statt nur React-State)

`sessionId` und Nachrichten werden in `localStorage` gehalten, sodass Tab-Reload
die Session restauriert.

**Abgelehnt fuer Phase 2:** Erhoeht Scope erheblich (Serialisierung, hydration
mismatch in Next.js SSR, Stale-Data-Handling). GDPR-Implikation (lokale
Datenspeicherung) muss separat bewertet werden. Als Future Work markiert.

### C: Supabase Realtime fuer Live-Sync mehrerer Tabs

Nachrichten werden via Realtime-Channel synchronisiert, sodass mehrere
Browser-Tabs denselben Chat-State sehen.

**Abgelehnt:** Explizit Out of Scope fuer Phase 2 (IMPROVEMENTS.md Constraint).
Realtime erhoehe Infrastruktur-Abhaengigkeit. Future Work.

---

## Future Work

- **localStorage-Session-Bindung:** `sessionId` in `localStorage` persistieren,
  sodass Tab-Reload die letzte Session restauriert (Phase 3 oder spaeter).
- **Supabase Realtime-Sync:** Nachrichten via Realtime-Channel live synchronisieren
  — ermoeglicht Multi-Tab-Support und Server-Push-Notifications.
- **Context-Truncation / Summarization:** Wenn die Session eine definierte
  Token-Schwelle ueberschreitet (z.B. 80 % des Provider-Max-Tokens), wird die
  aelteste Geschichte via separaten AI-Call zusammengefasst und als
  System-Message injiziert. Koordination mit Phase 8.1 (Mem0).
- **Session-Titel-Generierung:** Nach der ersten AI-Antwort automatisch einen
  kurzen Sitzungstitel generieren und in `ai_chat_sessions.title` schreiben.
- **Provider-Tracking:** `ai_chat_sessions.provider_used` nach dem ersten
  erfolgreichem AI-Call befuellen.

---

## Implemented by

- [docs/features/orb-chat-persistence.md](../../features/orb-chat-persistence.md)

## References

- IMPROVEMENTS.md Phase 2.2 und Anhang ADR-005-Skizze (Zeilen 63, 192)
- `src/components/features/ai-orb/orb-provider.tsx` — aktueller State-only-Provider
- `src/components/features/ai-orb/chat-panel.tsx` — simulierter Chat ohne API-Anbindung
- `src/lib/supabase/types.ts` Zeilen 59-134 — verifiziertes Schema ai_chat_sessions/messages
- `src/app/(dashboard)/layout.tsx` — OrbProvider-Einbindung
- Sequenzdiagramm: `docs/architecture/diagrams/ADR-005-orb-chat-sequence.md`
