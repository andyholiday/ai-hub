# Orb-Chat-Persistenz

**Status:** Implemented (2026-05-04)
**Phase:** 2 — Funktionale Bugs
**Owner:** Developer-Frontend

## Zweck

Persistente Chat-History fuer den Living-Cloud-Mentor (Orb). Nachrichten
ueberleben Page-Navigation innerhalb einer Browser-Session. Ersetzt den
bisherigen reinen React-State und die simulierte AI-Antwort ohne API-Anbindung.

## Architektur-Link

- [ADR-005: Orb-Chat-Session-Persistenz via Supabase](../architecture/adr/ADR-005-orb-chat-session-persistence.md)

## Code-Refs

- `src/components/features/ai-orb/orb-provider.tsx` — OrbProvider erweitert
  (merged in main, Commit `d59862d`)
- `src/components/features/ai-orb/use-orb-chat.ts` — neuer Hook implementiert
- `src/components/features/ai-orb/chat-panel.tsx` — konsumiert `useOrbChat()`
  statt bisherigem simulierten Timeout
- `src/app/api/ai/chat/route.ts` — `sessionId`-Parameter ergaenzt;
  `handleStreamingResponse` auf 5 Parameter erweitert
- `supabase/migrations/00001_initial_schema.sql` — RLS-Policies fuer
  `ai_chat_sessions` und `ai_chat_messages` bereits vorhanden (Quality
  verifiziert, kein Schema-Change in Phase 2.2 noetig)

## Oeffentliche API

```typescript
// src/components/features/ai-orb/use-orb-chat.ts
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

function useOrbChat(options?: { initialSessionId?: string }): UseOrbChatReturn
```

Vollstaendige Signaturen, Sequenzdiagramm und Datenmodell:
[ADR-005](../architecture/adr/ADR-005-orb-chat-session-persistence.md).

## Open Issues

- **F01 — `/api/ai/chat/history`-Route (Phase-3-Future-Work)** — `loadMore()` im
  Hook ist ein bewusster No-Op mit TODO-Kommentar. Die Route existiert nicht.
  Pagination-Implementierung ist Phase-3-Scope.
- **F04 — OrbContext-Cleanup (Phase-3-Future-Work)** — `isTyping`, `addMessage`
  und `messages` im `OrbContext` sind fuer `chat-panel.tsx` ungenutzt, aber noch
  aktiv in `ai-mentor/page.tsx`. Migration auf `useOrbChat()` und Entfernung aus
  dem Context ist Phase-3-Cleanup.
- **Streaming-Token-Tracking** — Gilt analog zu Phase 2.1; siehe
  [pricing-layer.md](./pricing-layer.md#open-issues).
- **`sessionId` im React-State** — Tab-Reload verliert Session-Bindung; User
  sieht leeren Chat, obwohl History in DB vorhanden. localStorage-Persistierung
  ist Future Work (ADR-005).

## Quality-Review

Siehe [docs/quality/PHASE-2-FRONTEND-REVIEW.md](../quality/PHASE-2-FRONTEND-REVIEW.md)
(2 Iterationen, final GO nach Commit `be4083d`).

- Test-Coverage: 14 Hook-Tests in `tests/unit/hooks/use-orb-chat.test.ts`,
  alle gruen
- RLS: existierende Policies in `supabase/migrations/00001_initial_schema.sql`
  ausreichend — Quality verifiziert (`ai_chat_sessions`: `user_id = auth.uid()`,
  `ai_chat_messages`: EXISTS-Subquery via Session-FK)
- `expires_at`: bereits in Phase 1.4 implementiert (90-Tage-Retention via
  `expires_at`-generated-column). Additivkompatibel mit Phase 2.2-Schema.
  Siehe [CHANGELOG.md — Phase 1 Added](../../CHANGELOG.md).

## History

- 2026-05-04 — Branch `feature/phase-2-frontend` gemerged in `main` (Commit
  `d59862d`). 219/219 Tests gruen. Status: Implemented.
- 2026-05-01 — ADR-005 committed (Architect Wave 1). Developer-Implementation
  laeuft parallel (Phase 2 Wave 2).
