# Orb Proaktive Regeln

Hinweis: Diese Logik liegt hinter Feature-Flag `proactive-orb-bubble` (`defaultEnabled: false`).
Die Trigger XP_MILESTONE, FIRST_AI_CHAT und SEARCH_NO_RESULT sind gebaut, haben aber aktuell
keine Datenquelle und koennen nicht feuern.

```mermaid
flowchart TD
    S1["Signal: INACTIVITY\n(90s ohne Aktion)"]
    S2["Signal: SECTION_DWELL\n(Verweildauer auf Sektion)"]
    S3["Signal: RETURN_VISIT\n(Rueckkehr nach > 1 Tag)"]
    S4["Signal: DEEP_SCROLL\n(>80% Seitenlaenge)"]
    S5["Signal: CODE_BLOCK_VISIBLE\n(Codeblock im Viewport)"]
    S6["Signal: XP_MILESTONE\n(kein Emitter vorhanden)"]
    S7["Signal: FIRST_AI_CHAT\n(kein Emitter vorhanden)"]
    S8["Signal: SEARCH_NO_RESULT\n(kein Emitter vorhanden)"]

    Hook["useOrbTrigger\n(Signal-Sammler)"]

    Engine{"decideBubble\nRegel-Engine"}
    Cooldown["Cooldown-Pruefung\nmax 1 Bubble/Session\nmax 1 Bubble/24h\nmax 3 Bubble/Woche"]

    Flag{"Feature-Flag\nproactive-orb-bubble\naktuell: aus"}

    Bubble["BubbleSpeech\n(Sprechblase am Orb)"]
    Dismiss["ESC / X → schliessen"]

    S1 --> Hook
    S2 --> Hook
    S3 --> Hook
    S4 --> Hook
    S5 --> Hook
    S6 -.->|"kein Emitter"| Hook
    S7 -.->|"kein Emitter"| Hook
    S8 -.->|"kein Emitter"| Hook

    Hook --> Engine
    Engine --> Cooldown
    Cooldown --> Flag
    Flag -->|"aktiv"| Bubble
    Flag -->|"inaktiv (Standard)"| Nichts["(keine Anzeige)"]
    Bubble --> Dismiss
```
