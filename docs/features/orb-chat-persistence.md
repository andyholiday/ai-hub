# Orb-Chat-Persistenz

**Status:** In Bearbeitung (Phase 2.2)
**Phase:** 2 — Funktionale Bugs
**Owner:** Developer-Frontend

## Zweck

Persistente Chat-History fuer den Living-Cloud-Mentor (Orb). Nachrichten
ueberleben Page-Navigation innerhalb einer Browser-Session. Ersetzt den
bisherigen reinen React-State und die simulierte AI-Antwort ohne API-Anbindung.

## Architektur-Link

- [ADR-005: Orb-Chat-Session-Persistenz via Supabase](../architecture/adr/ADR-005-orb-chat-session-persistence.md)

## Code-Refs

- `src/components/features/ai-orb/orb-provider.tsx` — TODO: nach Merge
  verifizieren (OrbProvider erweitert)
- `src/components/features/ai-orb/use-orb-chat.ts` — TODO: neuer Hook (nach
  Developer-Merge verifizieren)
- `src/components/features/ai-orb/chat-panel.tsx` — TODO: konsumiert
  `useOrbChat()` statt bisherigem simulierten Timeout
- `src/app/api/ai/chat/route.ts` — TODO: `sessionId`-Parameter ergaenzt
- `supabase/migrations/` — TODO: RLS-Policies fuer `ai_chat_sessions` /
  `ai_chat_messages` (Migration-Nummer nach Merge eintragen)

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

- TODO: Implementierungs-Status nach Developer-Merge eintragen
- TODO: RLS-Migration-Nummer ergaenzen
- TODO: Test-Coverage-Ergebnis ergaenzen (Wave 3 — Quality)
- TODO: `expires_at`-Kompatibilitaet mit Phase 1.4 nach Merge verifizieren

## History

- 2026-05-01 — ADR-005 committed (Architect Wave 1). Developer-Implementation
  laeuft parallel (Phase 2 Wave 2).
