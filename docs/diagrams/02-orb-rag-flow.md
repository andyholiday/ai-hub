# Orb RAG-Flow

```mermaid
sequenceDiagram
    actor Nutzer
    participant Orb as AI Orb (Browser)
    participant Route as POST /api/ai/chat
    participant Zod as Zod-Validierung
    participant Auth as requireAuth()
    participant RL as Rate-Limit (Upstash)
    participant Budget as enforceBudget() RPC
    participant Search as hybridSearchBestPractices
    participant RAG as buildRagContext()
    participant Gate as LLM-Gate (Flag: aus)
    participant Router as AI-Router
    participant Provider as KI-Provider

    Nutzer->>Orb: Nachricht eingeben
    Orb->>Route: POST {messages, sessionId}
    Route->>Zod: Schema pruefen\nmax 50 Msg, 100KB\nmaxTokens <= 4096\nrole:system ablehnen
    Zod-->>Route: 400 bei Fehler
    Route->>Auth: Session pruefen
    Auth-->>Route: 401 ohne Token
    Route->>RL: Tier "ai" 20req/60s
    RL-->>Route: 429 bei Ueberschreitung
    Route->>Budget: Budget reservieren (RPC)
    Budget-->>Route: 429 bei Limit; Soft-Cap -> Groq
    Route->>Search: Embedding + hybrid_search_best_practices\nRLS-sicher (caller_id)\nnur published oder eigene Zeilen
    Search-->>RAG: Top-5 Ergebnisse
    RAG-->>Route: Kontext-Text fuer System-Prompt
    Route->>Gate: (Pruefung uebersprungen, Flag deaktiviert)
    Route->>Router: privacyMode?
    alt Privacy-Mode aktiv
        Router->>Provider: Mistral EU exklusiv
    else Standard
        Router->>Provider: Gemini → OpenAI → Claude → Copilot
    end
    Provider-->>Orb: Stream (AbortSignal)
    Route-)Route: C2PA Audit-Log\n(SHA-256, Modell, Region, fire-and-forget)
```
