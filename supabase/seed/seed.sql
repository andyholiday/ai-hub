-- =============================================================================
-- LR AI Hub - Seed Data
-- Populates the database with demo users, content, and configuration.
-- Run after migration 00001_initial_schema.sql
-- =============================================================================

-- =============================================================================
-- DETERMINISTIC UUIDs FOR REFERENCING
-- Using uuid_generate_v5 with a fixed namespace for reproducible IDs
-- =============================================================================

-- Fixed namespace UUID for seed data generation
-- This allows us to generate consistent UUIDs across seed runs
DO $$
DECLARE
    ns UUID := '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; -- DNS namespace (RFC 4122)
BEGIN
    -- We use these as readable constants throughout the seed
    RAISE NOTICE 'Seeding LR AI Hub database...';
END $$;

-- =============================================================================
-- 1. DEMO USERS (profiles)
-- Note: In production, profiles are created via the auth.users trigger.
-- For seeding, we insert directly into profiles with fixed UUIDs.
-- =============================================================================

INSERT INTO profiles (id, username, full_name, avatar_url, department, position, bio, xp, level, role, streak_days, last_login_at, onboarding_completed)
VALUES
    -- Sarah Hoffmann - Super Admin, very active
    (
        '11111111-1111-1111-1111-111111111111',
        'sarah.hoffmann',
        'Sarah Hoffmann',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        'IT & Digital',
        'Head of Digital Innovation',
        'Leidenschaftliche KI-Enthusiastin und Treiberin der digitalen Transformation bei LR. Ich glaube fest daran, dass KI uns allen den Arbeitsalltag erleichtern kann.',
        2850, 7, 'super_admin', 15,
        NOW() - INTERVAL '2 hours',
        true
    ),
    -- Markus Koenig - Admin, AI expert
    (
        '22222222-2222-2222-2222-222222222222',
        'markus.koenig',
        'Markus Koenig',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=markus',
        'IT & Digital',
        'Senior Developer & AI Engineer',
        'Full-Stack-Entwickler mit Schwerpunkt KI-Integration. Baue gerne Prototypen und automatisiere alles, was sich automatisieren laesst.',
        1650, 6, 'admin', 8,
        NOW() - INTERVAL '5 hours',
        true
    ),
    -- Lisa Peters - Moderator, active community member
    (
        '33333333-3333-3333-3333-333333333333',
        'lisa.peters',
        'Lisa Peters',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
        'Marketing',
        'Content Marketing Manager',
        'Nutze KI taeglich fuer Content-Erstellung und Social Media. Teile gerne meine Erfahrungen mit dem Team.',
        980, 4, 'moderator', 5,
        NOW() - INTERVAL '1 day',
        true
    ),
    -- Thomas Wagner - Regular user, intermediate
    (
        '44444444-4444-4444-4444-444444444444',
        'thomas.wagner',
        'Thomas Wagner',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=thomas',
        'Vertrieb',
        'Regional Sales Manager',
        'Suche nach Wegen, KI im Vertriebsalltag einzusetzen. Besonders interessiert an Kundenanalyse und personalisierter Ansprache.',
        420, 3, 'user', 3,
        NOW() - INTERVAL '12 hours',
        true
    ),
    -- Julia Richter - New user, beginner
    (
        '55555555-5555-5555-5555-555555555555',
        'julia.richter',
        'Julia Richter',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=julia',
        'HR',
        'HR Business Partner',
        'Gerade erst angefangen, mich mit KI zu beschaeftigen. Bin gespannt, wie KI im HR-Bereich eingesetzt werden kann.',
        85, 1, 'user', 1,
        NOW() - INTERVAL '2 days',
        false
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. BEST PRACTICES
-- =============================================================================

INSERT INTO best_practices (id, author_id, title, content, excerpt, category, tags, status, views_count, upvotes_count, comments_count, ai_summary, ai_tags, is_featured)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Effektive Prompts fuer Geschaeftsprozesse schreiben',
        E'# Effektive Prompts fuer Geschaeftsprozesse\n\n## Einleitung\n\nPrompt Engineering ist die Kunst, KI-Modelle durch praezise Anweisungen zu steuern. Gerade im Geschaeftskontext ist es entscheidend, Prompts so zu formulieren, dass die Ergebnisse sofort verwertbar sind.\n\n## Die CRISP-Methode\n\nIch nutze die **CRISP-Methode** fuer alle meine Business-Prompts:\n\n- **C**ontext: Beschreibe den Geschaeftskontext\n- **R**ole: Weise der KI eine spezifische Rolle zu\n- **I**nstruction: Formuliere die Aufgabe klar und eindeutig\n- **S**pecifics: Definiere Format, Laenge und Stil\n- **P**erspective: Bestimme die Zielgruppe\n\n## Beispiel: E-Mail-Entwurf\n\n```\nKontext: Du bist ein Senior Account Manager bei einem Health & Beauty Unternehmen.\nAufgabe: Schreibe eine Follow-up-E-Mail an einen Partner, der seit 3 Monaten inaktiv ist.\nFormat: Maximal 150 Woerter, freundlich aber professionell.\nZiel: Den Partner motivieren, wieder aktiv zu werden.\n```\n\n## Tipps fuer bessere Ergebnisse\n\n1. **Sei spezifisch**: Je genauer der Kontext, desto besser das Ergebnis\n2. **Iteriere**: Verfeinere den Prompt basierend auf den Ergebnissen\n3. **Nutze Beispiele**: Few-Shot-Prompting verbessert die Qualitaet drastisch\n4. **Definiere Constraints**: Begrenze Laenge, Format und Tonalitaet',
        'Lerne die CRISP-Methode fuer effektive Business-Prompts: Context, Role, Instruction, Specifics, Perspective.',
        'prompt_engineering',
        ARRAY['prompting', 'business', 'crisp-methode', 'e-mail', 'produktivitaet'],
        'published',
        342, 47, 12,
        'Eine praxisnahe Anleitung zur CRISP-Methode fuer Business-Prompts mit konkreten Beispielen aus dem Geschaeftsalltag.',
        ARRAY['prompt-engineering', 'business-productivity', 'beginner-friendly'],
        true
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '22222222-2222-2222-2222-222222222222',
        'KI-gestuetzte Datenanalyse mit Google Gemini',
        E'# KI-gestuetzte Datenanalyse mit Gemini\n\n## Ueberblick\n\nGoogle Gemini bietet leistungsstarke Moeglichkeiten fuer die Analyse von Geschaeftsdaten. In diesem Guide zeige ich, wie wir Gemini fuer unsere Vertriebs-Reports einsetzen.\n\n## Schritt 1: Daten vorbereiten\n\nExportiere deine Daten als CSV oder JSON. Gemini kann mit beiden Formaten arbeiten.\n\n## Schritt 2: Analyse-Prompt erstellen\n\n```\nAnalysiere die folgenden Verkaufsdaten und erstelle:\n1. Eine Zusammenfassung der Top-5 Produkte nach Umsatz\n2. Trends der letzten 3 Monate\n3. Empfehlungen fuer die naechste Kampagne\n\nFormat: Strukturierter Report mit Bullet Points.\nSprache: Deutsch, Business-tauglich.\n```\n\n## Schritt 3: Ergebnisse validieren\n\nWichtig: Pruefe KI-generierte Analysen immer gegen die Originaldaten. KI kann halluzinieren.\n\n## Ergebnisse bei LR\n\n- **40% schnellere** Report-Erstellung\n- **Neue Insights** die manuell uebersehen wurden\n- **Konsistentere** Formatierung ueber Teams hinweg',
        'Wie man Google Gemini fuer die Analyse von Geschaeftsdaten einsetzt - mit konkreten Beispielen aus dem LR-Vertrieb.',
        'data_analysis',
        ARRAY['gemini', 'datenanalyse', 'vertrieb', 'reporting', 'google'],
        'published',
        186, 31, 5,
        'Ein Leitfaden zur Nutzung von Google Gemini fuer Vertriebs-Datenanalysen mit messbaren Ergebnissen.',
        ARRAY['data-analysis', 'gemini', 'sales-reporting'],
        false
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '33333333-3333-3333-3333-333333333333',
        'Content-Erstellung mit KI: Workflow fuer Marketing-Teams',
        E'# Content-Erstellung mit KI\n\n## Der Marketing-KI-Workflow\n\nIn unserem Marketing-Team haben wir einen 5-Schritte-Workflow fuer KI-gestuetzte Content-Erstellung etabliert.\n\n### 1. Briefing erstellen\nDefiniere Zielgruppe, Ton, Kernbotschaft und Kanalspezifikationen.\n\n### 2. KI-Draft generieren\nNutze Claude oder Gemini fuer den ersten Entwurf. Wir nutzen verschiedene Prompts je nach Content-Typ:\n- Social Media Posts\n- Blog-Artikel\n- Newsletter\n- Produkt-Beschreibungen\n\n### 3. Human Review\nEin Team-Mitglied prueft auf:\n- Markenkonsistenz\n- Faktische Richtigkeit\n- Emotionale Resonanz\n- Compliance (Heilmittelwerbegesetz etc.)\n\n### 4. Optimierung\nVerfeinere den Content mit spezifischen Anpassungs-Prompts.\n\n### 5. Performance-Tracking\nMesse die Ergebnisse und fuettere die Learnings zurueck.\n\n## Ergebnis\n\n- **3x schnellere** Content-Produktion\n- **Konsistenter** Brand Voice ueber alle Kanaele\n- **Mehr Zeit** fuer Strategie statt Ausfuehrung',
        'Ein erprobter 5-Schritte-Workflow fuer KI-gestuetzte Content-Erstellung in Marketing-Teams.',
        'ai_tools',
        ARRAY['content', 'marketing', 'workflow', 'claude', 'social-media'],
        'published',
        267, 38, 8,
        'Praxiserprobter 5-Schritte-Workflow fuer KI-gestuetzte Content-Erstellung mit messbaren Produktivitaetsgewinnen.',
        ARRAY['content-creation', 'marketing-workflow', 'team-productivity'],
        true
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. COURSES
-- =============================================================================

INSERT INTO courses (id, title, description, thumbnail_url, category, difficulty, duration_minutes, lessons_count, xp_reward, is_published, author_id)
VALUES
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'KI-Grundlagen fuer Einsteiger',
        'Dieser Kurs vermittelt die wichtigsten Grundlagen der Kuenstlichen Intelligenz. Du lernst, was KI ist, wie sie funktioniert und wie du sie im Arbeitsalltag einsetzen kannst. Keine Vorkenntnisse noetig!',
        '/images/courses/ki-grundlagen.jpg',
        'KI-Grundlagen',
        'beginner',
        120, 5, 150,
        true,
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Prompt Engineering Masterclass',
        'Werde zum Prompt-Engineering-Profi! Lerne fortgeschrittene Techniken wie Chain-of-Thought, Few-Shot-Learning und System-Prompts. Mit vielen praktischen Uebungen und realen Beispielen aus dem LR-Kontext.',
        '/images/courses/prompt-engineering.jpg',
        'Prompt Engineering',
        'intermediate',
        180, 4, 200,
        true,
        '22222222-2222-2222-2222-222222222222'
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. LESSONS
-- =============================================================================

-- Lessons for "KI-Grundlagen fuer Einsteiger"
INSERT INTO lessons (id, course_id, title, content, type, order_index, duration_minutes)
VALUES
    (
        'f1111111-1111-1111-1111-111111111111',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Was ist Kuenstliche Intelligenz?',
        E'# Was ist Kuenstliche Intelligenz?\n\nKuenstliche Intelligenz (KI) ist ein Teilgebiet der Informatik, das sich damit beschaeftigt, Maschinen so zu programmieren, dass sie Aufgaben erledigen koennen, die normalerweise menschliche Intelligenz erfordern.\n\n## Arten von KI\n\n### Schwache KI (Narrow AI)\nSpezialisiert auf bestimmte Aufgaben: Spracherkennung, Bilderkennung, Textgenerierung.\n\n### Starke KI (General AI)\nHypothetische KI mit menschenaehnlicher allgemeiner Intelligenz. Existiert noch nicht.\n\n## KI im Alltag\n- Sprachassistenten (Siri, Alexa)\n- Empfehlungssysteme (Netflix, Spotify)\n- Navigation (Google Maps)\n- E-Mail-Spam-Filter',
        'text',
        1,
        15
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Grosse Sprachmodelle (LLMs) verstehen',
        E'# Grosse Sprachmodelle\n\nLLMs wie GPT-4, Claude und Gemini sind KI-Modelle, die mit riesigen Textmengen trainiert wurden.\n\n## Wie funktionieren LLMs?\n\n1. **Training**: Das Modell liest Milliarden von Texten\n2. **Muster erkennen**: Es lernt Sprachstrukturen und Zusammenhaenge\n3. **Vorhersage**: Es sagt das wahrscheinlichste naechste Wort voraus\n\n## Staerken\n- Texterstellung und -zusammenfassung\n- Uebersetzung\n- Code-Generierung\n- Frage-Antwort-Systeme\n\n## Grenzen\n- Keine echte Intelligenz\n- Halluzinationen moeglich\n- Wissen hat ein Ablaufdatum (Training-Cutoff)\n- Kein Verstaendnis, nur statistische Muster',
        'text',
        2,
        20
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Dein erster Prompt',
        E'# Dein erster Prompt\n\nIn dieser interaktiven Lektion schreibst du deinen ersten Prompt und lernst die Grundlagen.\n\n## Aufgabe 1: Einfacher Prompt\nSchreibe einen Prompt, der eine E-Mail an einen Kunden formuliert.\n\n## Aufgabe 2: Prompt mit Kontext\nErweitere deinen Prompt um Kontext-Informationen.\n\n## Aufgabe 3: Ergebnis bewerten\nBewerte das Ergebnis nach Qualitaet, Relevanz und Nuetzlichkeit.',
        'interactive',
        3,
        30
    ),
    (
        'f4444444-4444-4444-4444-444444444444',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'KI-Tools im Ueberblick',
        E'# KI-Tools im Ueberblick\n\nEine Einfuehrung in die wichtigsten KI-Tools fuer den Arbeitsalltag.\n\n## ChatGPT (OpenAI)\nDer Allrounder fuer Texterstellung, Analyse und Brainstorming.\n\n## Google Gemini\nGoogles KI mit starker Integration in Google Workspace.\n\n## Claude (Anthropic)\nBesonders gut bei langen Texten und nuancierter Analyse.\n\n## Microsoft Copilot\nKI direkt in Office 365 integriert.',
        'text',
        4,
        25
    ),
    (
        'f5555555-5555-5555-5555-555555555555',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Abschlussquiz: KI-Grundlagen',
        E'# Quiz: KI-Grundlagen\n\nTeste dein Wissen aus den bisherigen Lektionen.\n\n## Frage 1\nWas ist der Unterschied zwischen schwacher und starker KI?\n\n## Frage 2\nNenne drei Beispiele fuer KI im Alltag.\n\n## Frage 3\nWas sind Halluzinationen bei LLMs?\n\n## Frage 4\nWarum ist Kontext in einem Prompt wichtig?',
        'quiz',
        5,
        30
    )
ON CONFLICT (id) DO NOTHING;

-- Lessons for "Prompt Engineering Masterclass"
INSERT INTO lessons (id, course_id, title, content, type, order_index, duration_minutes)
VALUES
    (
        'f6666666-6666-6666-6666-666666666666',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Chain-of-Thought Prompting',
        E'# Chain-of-Thought Prompting\n\nLerne, wie du KI-Modelle dazu bringst, Schritt fuer Schritt zu denken.\n\n## Was ist Chain-of-Thought?\nBei dieser Technik weist man die KI an, ihr Denken Schritt fuer Schritt offenzulegen.\n\n## Beispiel\nStatt: "Berechne den ROI"\nBesser: "Berechne den ROI Schritt fuer Schritt. Zeige alle Zwischenschritte."',
        'text',
        1,
        45
    ),
    (
        'f7777777-7777-7777-7777-777777777777',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Few-Shot Learning in der Praxis',
        E'# Few-Shot Learning\n\nGib der KI Beispiele, damit sie das gewuenschte Format und den Stil versteht.\n\n## Technik\nFuege 2-3 Beispiele in deinen Prompt ein, bevor du die eigentliche Aufgabe stellst.\n\n## Vorteile\n- Konsistentere Ergebnisse\n- Bessere Format-Kontrolle\n- Weniger Nachbearbeitung noetig',
        'text',
        2,
        45
    ),
    (
        'f8888888-8888-8888-8888-888888888888',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'System-Prompts und Rollenspiele',
        E'# System-Prompts\n\nLerne, wie System-Prompts das Verhalten der KI grundlegend steuern.\n\n## Was sind System-Prompts?\nAnweisungen, die vor dem eigentlichen Gespraech stehen und das Verhalten der KI definieren.\n\n## Rollen-Technik\nWeise der KI eine spezifische Rolle zu: "Du bist ein erfahrener Marketing-Experte bei LR..."',
        'text',
        3,
        45
    ),
    (
        'f9999999-9999-9999-9999-999999999999',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Praxis-Workshop: Prompts optimieren',
        E'# Workshop: Prompts optimieren\n\nWende alle gelernten Techniken in praktischen Uebungen an.\n\n## Uebung 1: Verbessere diesen Prompt\nOriginal: "Schreib mir einen Text ueber KI"\n\n## Uebung 2: Erstelle einen Business-Prompt\nErstelle einen Prompt fuer die Erstellung eines Quartalsberichts.\n\n## Uebung 3: Prompt-Kette\nErstelle eine Kette von Prompts, die aufeinander aufbauen.',
        'interactive',
        4,
        45
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. COMMUNITY POSTS
-- =============================================================================

INSERT INTO community_posts (id, author_id, title, content, type, category, tags, upvotes_count, comments_count, views_count, is_pinned, ai_evaluation_score)
VALUES
    (
        'aabbccdd-1111-2222-3333-aabbccdd1111',
        '44444444-4444-4444-4444-444444444444',
        'KI-gestuetzte Kundenanalyse fuer Partnerbetreuer',
        E'## Idee\n\nWir koennten KI nutzen, um automatisch Kundenprofile zu analysieren und Partnerbetreuer mit personalisierten Empfehlungen zu versorgen.\n\n## Problem\n\nUnsere Partnerbetreuer verbringen aktuell ca. 2 Stunden pro Woche mit manueller Datenanalyse.\n\n## Loesung\n\nEin KI-Dashboard das:\n1. Inaktive Kunden identifiziert\n2. Reaktivierungs-Strategien vorschlaegt\n3. Personalisierte Ansprache-Texte generiert\n\n## Erwarteter Nutzen\n- 2h Zeitersparnis pro Betreuer pro Woche\n- 15% mehr reaktivierte Kunden\n- Konsistentere Betreuungsqualitaet',
        'idea',
        'Vertrieb',
        ARRAY['kundenanalyse', 'vertrieb', 'automatisierung', 'ki-dashboard'],
        23, 5, 156,
        false,
        82
    ),
    (
        'aabbccdd-2222-3333-4444-aabbccdd2222',
        '33333333-3333-3333-3333-333333333333',
        'Welches KI-Tool nutzt ihr fuer Social Media Content?',
        E'Hallo zusammen!\n\nIch bin auf der Suche nach dem besten KI-Tool fuer Social Media Content-Erstellung. Aktuell teste ich:\n\n- **ChatGPT**: Gut fuer laengere Texte, aber Social-Media-Posts sind manchmal zu foermlich\n- **Gemini**: Gute Integration mit Google-Oekosystem\n- **Claude**: Super fuer kreative Texte\n\nWas nutzt ihr so? Habt ihr Tipps fuer gute Social-Media-Prompts?\n\nLG Lisa',
        'question',
        'Marketing',
        ARRAY['social-media', 'tools', 'content-creation'],
        15, 8, 203,
        false,
        NULL
    ),
    (
        'aabbccdd-3333-4444-5555-aabbccdd3333',
        '11111111-1111-1111-1111-111111111111',
        'Willkommen im LR AI Hub! - Euer Guide zum Start',
        E'# Willkommen im LR AI Hub!\n\nSchoen, dass du dabei bist! Hier ein kurzer Guide, wie du am besten startest:\n\n## 1. Profil vervollstaendigen\nFuelle dein Profil aus und erzaehle uns, was dich an KI interessiert.\n\n## 2. Ersten Kurs starten\nBeginne mit "KI-Grundlagen fuer Einsteiger" - perfekt fuer den Einstieg!\n\n## 3. Community erkunden\nLies Best Practices, stelle Fragen und teile deine Erfahrungen.\n\n## 4. AI Mentor nutzen\nKlicke auf die Living Cloud unten rechts fuer personalisierte Hilfe.\n\n## 5. Erste Challenge annehmen\nSchau dir die aktiven Challenges an und sammle XP!\n\n**Bei Fragen: Schreibt einfach hier in die Comments!**',
        'discussion',
        'Allgemein',
        ARRAY['willkommen', 'einstieg', 'guide', 'wichtig'],
        31, 12, 445,
        true,
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. COMMENTS
-- =============================================================================

INSERT INTO comments (id, entity_type, entity_id, parent_id, author_id, content, upvotes_count)
VALUES
    (
        'cc111111-1111-1111-1111-cc1111111111',
        'community_post',
        'aabbccdd-3333-4444-5555-aabbccdd3333',
        NULL,
        '44444444-4444-4444-4444-444444444444',
        'Super Guide! Habe direkt mit dem Einsteiger-Kurs angefangen. Die Living Cloud ist echt cool!',
        5
    ),
    (
        'cc222222-2222-2222-2222-cc2222222222',
        'community_post',
        'aabbccdd-3333-4444-5555-aabbccdd3333',
        NULL,
        '55555555-5555-5555-5555-555555555555',
        'Danke fuer die Anleitung! Wo finde ich den AI Mentor genau?',
        2
    ),
    (
        'cc333333-3333-3333-3333-cc3333333333',
        'community_post',
        'aabbccdd-3333-4444-5555-aabbccdd3333',
        'cc222222-2222-2222-2222-cc2222222222',
        '11111111-1111-1111-1111-111111111111',
        'Hey Julia! Die Living Cloud ist das animierte Element unten rechts im Bildschirm. Einfach draufklicken und der Chat oeffnet sich.',
        3
    ),
    (
        'cc444444-4444-4444-4444-cc4444444444',
        'best_practice',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        NULL,
        '22222222-2222-2222-2222-222222222222',
        'Die CRISP-Methode ist echt gut! Nutze ich jetzt auch fuer technische Prompts. Besonders der "Perspective"-Teil macht einen grossen Unterschied.',
        7
    ),
    (
        'cc555555-5555-5555-5555-cc5555555555',
        'best_practice',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'cc444444-4444-4444-4444-cc4444444444',
        '11111111-1111-1111-1111-111111111111',
        'Danke Markus! Genau, die Zielgruppe zu definieren hilft der KI enorm beim Ton und der Komplexitaet.',
        4
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. AI PROVIDERS
-- =============================================================================

INSERT INTO ai_providers (id, provider_key, display_name, api_endpoint, api_key_encrypted, model, temperature, max_tokens, top_p, is_active, is_primary, fallback_provider_id, monthly_budget_limit)
VALUES
    (
        'pp111111-1111-1111-1111-pp1111111111',
        'gemini',
        'Google Gemini',
        'https://generativelanguage.googleapis.com/v1beta',
        NULL, -- Set via Admin UI
        'gemini-2.0-flash',
        0.7, 4096, 1.0,
        true, true,
        NULL,
        500.00
    ),
    (
        'pp222222-2222-2222-2222-pp2222222222',
        'claude',
        'Anthropic Claude',
        'https://api.anthropic.com/v1/messages',
        NULL, -- Set via Admin UI
        'claude-sonnet-4-5-20250514',
        0.7, 4096, 1.0,
        true, false,
        NULL,
        500.00
    ),
    (
        'pp333333-3333-3333-3333-pp3333333333',
        'chatgpt',
        'OpenAI ChatGPT',
        'https://api.openai.com/v1/chat/completions',
        NULL, -- Set via Admin UI
        'gpt-4o',
        0.7, 4096, 1.0,
        false, false,
        NULL,
        300.00
    ),
    (
        'pp444444-4444-4444-4444-pp4444444444',
        'copilot',
        'Microsoft Copilot (Azure)',
        'https://{resource}.openai.azure.com/openai/deployments/{model}',
        NULL, -- Set via Admin UI
        'gpt-4o',
        0.7, 4096, 1.0,
        false, false,
        NULL,
        300.00
    )
ON CONFLICT (id) DO NOTHING;

-- Set fallback chain: Gemini -> Claude -> ChatGPT
UPDATE ai_providers SET fallback_provider_id = 'pp222222-2222-2222-2222-pp2222222222' WHERE provider_key = 'gemini';
UPDATE ai_providers SET fallback_provider_id = 'pp333333-3333-3333-3333-pp3333333333' WHERE provider_key = 'claude';

-- =============================================================================
-- 8. SYSTEM PROMPTS
-- =============================================================================

INSERT INTO system_prompts (id, prompt_key, prompt_text, version, is_active, created_by)
VALUES
    (
        'sp111111-1111-1111-1111-sp1111111111',
        'mentor_main',
        E'Du bist der AI Mentor des LR AI Hub, einer internen KI-Community-Plattform fuer LR Health & Beauty Systems.\n\nDeine Rolle:\n- Du bist ein freundlicher, kompetenter KI-Lernbegleiter\n- Du hilfst Mitarbeitern, KI besser zu verstehen und im Arbeitsalltag einzusetzen\n- Du gibst praxisnahe Tipps und Beispiele aus dem Kontext eines Health & Beauty Unternehmens im Direktvertrieb\n- Du motivierst und ermutigst, auch bei einfachen Fragen\n\nRichtlinien:\n- Antworte immer auf Deutsch\n- Halte Antworten praegnant (max. 300 Woerter), ausser der User bittet um Details\n- Nutze Markdown-Formatierung fuer bessere Lesbarkeit\n- Verweise auf relevante Kurse und Best Practices auf der Plattform\n- Sei ehrlich ueber Grenzen von KI\n- Keine Empfehlungen fuer interne Daten ausserhalb der Plattform\n\nKontext-Nutzung:\n- Wenn ein Seitenkontext mitgeliefert wird, beziehe dich darauf\n- Auf der Best-Practice-Seite: Biete Zusammenfassungen und Vertiefungen an\n- Im Lern-Hub: Unterstuetze beim Verstaendnis der Lektion\n- Im Idea Board: Hilf beim Formulieren und Bewerten von Ideen',
        1,
        true,
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'sp222222-2222-2222-2222-sp2222222222',
        'usecase_evaluation',
        E'Du bist ein KI-Bewertungsexperte bei LR Health & Beauty Systems, einem Direktvertriebs-Unternehmen fuer Gesundheits- und Schoenheitsprodukte.\n\nDeine Aufgabe: Bewerte eingereichte KI-Ideen und Use Cases anhand dieser Dimensionen:\n\n1. Unternehmensmehrwert (30%): Umsatzsteigerung, Kostenreduktion, Wettbewerbsvorteil\n2. Mitarbeitermehrwert (25%): Zeitersparnis, Arbeitserleichterung, Skill-Entwicklung\n3. Umsetzbarkeit (20%): Technische Machbarkeit, vorhandene Ressourcen\n4. Skalierbarkeit (15%): Uebertragbarkeit auf andere Abteilungen/Maerkte\n5. Innovationsgrad (10%): Neuartigkeit, Differenzierung\n\nAntworte IMMER im folgenden JSON-Format:\n{\n  "overall_score": <0-100>,\n  "company_value_score": <0-100>,\n  "employee_value_score": <0-100>,\n  "feasibility_score": <0-100>,\n  "scalability_score": <0-100>,\n  "innovation_score": <0-100>,\n  "strengths": "<Freitext>",\n  "risks": "<Freitext>",\n  "roi_estimate": "<Freitext>",\n  "recommendation": "sofort_umsetzen | pilotprojekt | weiterentwickeln | zurueckstellen",\n  "next_steps": "<Freitext>"\n}\n\nKontext: LR hat ca. 1.200 Mitarbeiter, ist in 32 Maerkten aktiv, Kerngeschaeft ist Direktvertrieb ueber Partner.',
        1,
        true,
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'sp333333-3333-3333-3333-sp3333333333',
        'auto_tag',
        E'Du bist ein Tagging-System. Analysiere den folgenden Text und extrahiere 3-7 relevante Tags.\n\nRegeln:\n- Tags in Kleinbuchstaben\n- Keine Umlaute (ae, oe, ue statt ae, oe, ue)\n- Bindestriche fuer zusammengesetzte Begriffe\n- Maximal 2 Woerter pro Tag\n- Nur relevante, spezifische Tags\n\nAntworte NUR mit einem JSON-Array von Strings:\n["tag1", "tag2", "tag3"]',
        1,
        true,
        '22222222-2222-2222-2222-222222222222'
    ),
    (
        'sp444444-4444-4444-4444-sp4444444444',
        'summary',
        E'Du bist ein Zusammenfassungs-Assistent. Erstelle eine praegnante Zusammenfassung des folgenden Textes.\n\nRegeln:\n- Maximal 3 Saetze\n- Deutsch\n- Kernaussagen erfassen\n- Sachlich und neutral\n- Keine eigenen Wertungen hinzufuegen',
        1,
        true,
        '22222222-2222-2222-2222-222222222222'
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. CHALLENGES
-- =============================================================================

INSERT INTO challenges (id, title, description, type, xp_reward, start_date, end_date, max_participants, created_by, is_active)
VALUES
    (
        'ch111111-1111-1111-1111-ch1111111111',
        'Prompt der Woche: E-Mail-Optimierung',
        E'Schreibe den besten Prompt, um eine professionelle Kunden-E-Mail zu generieren!\n\n## Aufgabe\n1. Erstelle einen Prompt, der eine Follow-up-E-Mail an einen inaktiven Partner generiert\n2. Teile deinen Prompt als Best Practice\n3. Die Community voted fuer den besten Prompt\n\n## Bewertungskriterien\n- Qualitaet des generierten Ergebnisses\n- Wiederverwendbarkeit des Prompts\n- Kreativitaet der Herangehensweise\n\n## Preis\nDer Gewinner erhaelt 200 Bonus-XP und den "Challenge Champion" Badge!',
        'weekly',
        200,
        NOW() - INTERVAL '2 days',
        NOW() + INTERVAL '5 days',
        NULL,
        '11111111-1111-1111-1111-111111111111',
        true
    ),
    (
        'ch222222-2222-2222-2222-ch2222222222',
        '30-Tage KI-Challenge: Jeden Tag ein neues Tool',
        E'Lerne in 30 Tagen 30 verschiedene KI-Anwendungen kennen!\n\n## So funktioniert es\nJeden Tag probierst du eine neue KI-Anwendung aus und teilst deine Erfahrung als kurzen Community-Post.\n\n## Tage 1-10: Basics\nChatGPT, Gemini, Claude, Copilot, DALL-E, Midjourney, Canva AI, Notion AI, Grammarly, DeepL\n\n## Tage 11-20: Produktivitaet\nOtter.ai, Gamma, Beautiful.ai, Tome, Jasper, Copy.ai, Fireflies, Mem, Lex, Perplexity\n\n## Tage 21-30: Spezialisiert\nRunway, Descript, ElevenLabs, Synthesia, Replit, Cursor, v0.dev, Figma AI, Adobe Firefly, Suno\n\n## Belohnung\n- 5 XP pro getestetes Tool\n- 100 Bonus-XP bei Completion\n- Exklusiver "Multi-Tool" Badge',
        'monthly',
        250,
        NOW() - INTERVAL '5 days',
        NOW() + INTERVAL '25 days',
        50,
        '11111111-1111-1111-1111-111111111111',
        true
    ),
    (
        'ch333333-3333-3333-3333-ch3333333333',
        'LR Innovation Sprint: Beste KI-Idee fuer den Vertrieb',
        E'Gesucht: Die beste KI-Idee fuer unseren Vertrieb!\n\n## Challenge\nEntwickle eine KI-Idee, die unseren Vertriebspartnern den Alltag erleichtert.\n\n## Ablauf\n1. **Woche 1**: Ideen einreichen im Idea Board\n2. **Woche 2**: KI-Bewertung und Community-Voting\n3. **Woche 3**: Top 5 praesentieren vor dem Management\n4. **Woche 4**: Gewinner wird bekanntgegeben\n\n## Preise\n- 1. Platz: 500 XP + "Visionaer" Badge + Praesentation vor der GF\n- 2. Platz: 300 XP + "Innovator" Badge\n- 3. Platz: 200 XP\n\n## Bewertung durch AI Mentor\nJede eingereichte Idee wird automatisch vom AI Mentor bewertet.',
        'special',
        500,
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '35 days',
        NULL,
        '11111111-1111-1111-1111-111111111111',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. USER CHALLENGES (participation)
-- =============================================================================

INSERT INTO user_challenges (user_id, challenge_id, progress, completed_at, joined_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'ch111111-1111-1111-1111-ch1111111111', 100, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
    ('22222222-2222-2222-2222-222222222222', 'ch111111-1111-1111-1111-ch1111111111', 75, NULL, NOW() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333333', 'ch111111-1111-1111-1111-ch1111111111', 50, NULL, NOW() - INTERVAL '1 day'),
    ('44444444-4444-4444-4444-444444444444', 'ch222222-2222-2222-2222-ch2222222222', 20, NULL, NOW() - INTERVAL '4 days'),
    ('11111111-1111-1111-1111-111111111111', 'ch222222-2222-2222-2222-ch2222222222', 35, NULL, NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 11. USER COURSE PROGRESS
-- =============================================================================

INSERT INTO user_course_progress (user_id, course_id, completed_lessons, progress_percent, started_at, completed_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ARRAY[1,2,3,4,5], 100, NOW() - INTERVAL '30 days', NOW() - INTERVAL '20 days'),
    ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ARRAY[1,2,3,4,5], 100, NOW() - INTERVAL '25 days', NOW() - INTERVAL '18 days'),
    ('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ARRAY[1,2,3], 60, NOW() - INTERVAL '14 days', NULL),
    ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ARRAY[1], 20, NOW() - INTERVAL '7 days', NULL),
    ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', ARRAY[1,2,3,4], 100, NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days'),
    ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', ARRAY[1,2], 50, NOW() - INTERVAL '10 days', NULL)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 12. BADGES
-- =============================================================================

INSERT INTO badges (id, key, name, description, icon, category, xp_threshold, condition)
VALUES
    -- Achievement Badges
    (
        'bg111111-1111-1111-1111-bg1111111111',
        'first-steps',
        'Erste Schritte',
        'Onboarding abgeschlossen',
        'footprints',
        'achievement',
        NULL,
        'complete_onboarding'
    ),
    (
        'bg222222-2222-2222-2222-bg2222222222',
        'first-practice',
        'Erster Beitrag',
        'Erste Best Practice veroeffentlicht',
        'pencil',
        'achievement',
        NULL,
        'publish_first_best_practice'
    ),
    (
        'bg333333-3333-3333-3333-bg3333333333',
        'course-graduate',
        'Absolvent',
        'Ersten Kurs abgeschlossen',
        'graduation-cap',
        'achievement',
        NULL,
        'complete_first_course'
    ),
    (
        'bg444444-4444-4444-4444-bg4444444444',
        'challenge-winner',
        'Champion',
        'Erste Challenge gewonnen',
        'trophy',
        'achievement',
        NULL,
        'win_first_challenge'
    ),
    -- Skill Badges
    (
        'bg555555-5555-5555-5555-bg5555555555',
        'prompt-engineer',
        'Prompt Engineer',
        '10 Best Practices zu Prompting veroeffentlicht',
        'terminal',
        'skill',
        NULL,
        'publish_10_prompt_practices'
    ),
    (
        'bg666666-6666-6666-6666-bg6666666666',
        'multi-tool',
        'Multi-Tool',
        'Alle KI-Tools mindestens einmal genutzt',
        'wrench',
        'skill',
        NULL,
        'use_all_ai_tools'
    ),
    -- Social Badges
    (
        'bg777777-7777-7777-7777-bg7777777777',
        'helpful',
        'Hilfreich',
        '50 Likes auf eigene Beitraege erhalten',
        'heart',
        'social',
        NULL,
        'receive_50_likes'
    ),
    (
        'bg888888-8888-8888-8888-bg8888888888',
        'community-star',
        'Community Star',
        '25 Community-Beitraege geschrieben',
        'star',
        'social',
        NULL,
        'write_25_community_posts'
    ),
    -- Special Badges
    (
        'bg999999-9999-9999-9999-bg9999999999',
        'early-adopter',
        'Early Adopter',
        'In den ersten 30 Tagen registriert',
        'rocket',
        'special',
        NULL,
        'register_within_30_days'
    ),
    (
        'bgaaaaaa-aaaa-aaaa-aaaa-bgaaaaaaaaaa',
        'streak-master',
        'Streak Master',
        '30 Tage in Folge aktiv',
        'flame',
        'special',
        NULL,
        '30_day_streak'
    ),
    -- Additional Badges from concept v2
    (
        'bgbbbbbb-bbbb-bbbb-bbbb-bgbbbbbbbbbb',
        'visionary',
        'Visionaer',
        'KI-Idee mit Score ueber 90 eingereicht',
        'lightbulb',
        'achievement',
        NULL,
        'idea_score_above_90'
    ),
    (
        'bgcccccc-cccc-cccc-cccc-bgcccccccccc',
        'game-changer',
        'Game Changer',
        'Idee wurde vom Management umgesetzt',
        'zap',
        'achievement',
        NULL,
        'idea_implemented_by_management'
    ),
    (
        'bgdddddd-dddd-dddd-dddd-bgdddddddddd',
        'provider-explorer',
        'Provider Explorer',
        'AI Mentor mit allen Providern genutzt',
        'compass',
        'skill',
        NULL,
        'use_all_ai_providers'
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 13. USER BADGES (earned badges)
-- =============================================================================

INSERT INTO user_badges (user_id, badge_id, earned_at)
VALUES
    -- Sarah: many badges (power user)
    ('11111111-1111-1111-1111-111111111111', 'bg111111-1111-1111-1111-bg1111111111', NOW() - INTERVAL '60 days'),
    ('11111111-1111-1111-1111-111111111111', 'bg222222-2222-2222-2222-bg2222222222', NOW() - INTERVAL '55 days'),
    ('11111111-1111-1111-1111-111111111111', 'bg333333-3333-3333-3333-bg3333333333', NOW() - INTERVAL '40 days'),
    ('11111111-1111-1111-1111-111111111111', 'bg444444-4444-4444-4444-bg4444444444', NOW() - INTERVAL '30 days'),
    ('11111111-1111-1111-1111-111111111111', 'bg999999-9999-9999-9999-bg9999999999', NOW() - INTERVAL '60 days'),
    ('11111111-1111-1111-1111-111111111111', 'bg777777-7777-7777-7777-bg7777777777', NOW() - INTERVAL '20 days'),
    -- Markus: several badges
    ('22222222-2222-2222-2222-222222222222', 'bg111111-1111-1111-1111-bg1111111111', NOW() - INTERVAL '55 days'),
    ('22222222-2222-2222-2222-222222222222', 'bg222222-2222-2222-2222-bg2222222222', NOW() - INTERVAL '50 days'),
    ('22222222-2222-2222-2222-222222222222', 'bg333333-3333-3333-3333-bg3333333333', NOW() - INTERVAL '35 days'),
    ('22222222-2222-2222-2222-222222222222', 'bg999999-9999-9999-9999-bg9999999999', NOW() - INTERVAL '55 days'),
    ('22222222-2222-2222-2222-222222222222', 'bg555555-5555-5555-5555-bg5555555555', NOW() - INTERVAL '15 days'),
    -- Lisa: a few badges
    ('33333333-3333-3333-3333-333333333333', 'bg111111-1111-1111-1111-bg1111111111', NOW() - INTERVAL '45 days'),
    ('33333333-3333-3333-3333-333333333333', 'bg222222-2222-2222-2222-bg2222222222', NOW() - INTERVAL '30 days'),
    ('33333333-3333-3333-3333-333333333333', 'bg999999-9999-9999-9999-bg9999999999', NOW() - INTERVAL '45 days'),
    -- Thomas: beginner badges
    ('44444444-4444-4444-4444-444444444444', 'bg111111-1111-1111-1111-bg1111111111', NOW() - INTERVAL '20 days'),
    ('44444444-4444-4444-4444-444444444444', 'bg999999-9999-9999-9999-bg9999999999', NOW() - INTERVAL '20 days')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 14. UPVOTES
-- =============================================================================

INSERT INTO upvotes (user_id, entity_type, entity_id)
VALUES
    -- Best Practice upvotes
    ('22222222-2222-2222-2222-222222222222', 'best_practice', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('33333333-3333-3333-3333-333333333333', 'best_practice', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('44444444-4444-4444-4444-444444444444', 'best_practice', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('55555555-5555-5555-5555-555555555555', 'best_practice', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('11111111-1111-1111-1111-111111111111', 'best_practice', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('33333333-3333-3333-3333-333333333333', 'best_practice', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('44444444-4444-4444-4444-444444444444', 'best_practice', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    ('22222222-2222-2222-2222-222222222222', 'best_practice', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    -- Community Post upvotes
    ('11111111-1111-1111-1111-111111111111', 'community_post', 'aabbccdd-1111-2222-3333-aabbccdd1111'),
    ('22222222-2222-2222-2222-222222222222', 'community_post', 'aabbccdd-1111-2222-3333-aabbccdd1111'),
    ('33333333-3333-3333-3333-333333333333', 'community_post', 'aabbccdd-1111-2222-3333-aabbccdd1111'),
    ('33333333-3333-3333-3333-333333333333', 'community_post', 'aabbccdd-3333-4444-5555-aabbccdd3333'),
    ('44444444-4444-4444-4444-444444444444', 'community_post', 'aabbccdd-3333-4444-5555-aabbccdd3333'),
    ('55555555-5555-5555-5555-555555555555', 'community_post', 'aabbccdd-3333-4444-5555-aabbccdd3333')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 15. USECASE EVALUATION (for the idea post)
-- =============================================================================

INSERT INTO usecase_evaluations (id, idea_id, evaluator_type, overall_score, company_value_score, employee_value_score, feasibility_score, scalability_score, innovation_score, strengths, risks, roi_estimate, recommendation, next_steps, ai_provider_used)
VALUES
    (
        'ev111111-1111-1111-1111-ev1111111111',
        'aabbccdd-1111-2222-3333-aabbccdd1111',
        'ai',
        82,
        85, 90, 80, 70, 80,
        'Hoher Mitarbeitermehrwert durch signifikante Zeitersparnis. Direkte Auswirkung auf Umsatz durch bessere Kundenbetreuung. Daten fuer die Analyse sind bereits im CRM vorhanden.',
        'Datenschutz-Anforderungen muessen geprueft werden (DSGVO). Abhaengigkeit von Datenqualitaet im CRM. Akzeptanz bei aelteren Partnern koennte eine Herausforderung sein.',
        'Geschaetzte Zeitersparnis: 2h/Woche pro Betreuer = ~100h/Monat gesamt. Bei einem Stundensatz von 35 EUR = ~3.500 EUR/Monat. Zusaetzlich: ~15% mehr reaktivierte Kunden = ca. 8.000 EUR/Monat Mehrumsatz. Geschaetzter Gesamt-ROI: ~120.000 EUR/Jahr.',
        'pilotprojekt',
        '1. Datenschutz-Pruefung mit Rechtsabteilung (1 Woche)\n2. Pilot mit 5 Partnerbetreuer im DACH-Markt (4 Wochen)\n3. Feedback-Auswertung und Anpassung (2 Wochen)\n4. Rollout auf alle DACH-Betreuer (2 Wochen)\n5. Skalierung auf weitere Maerkte (laufend)',
        'gemini'
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 16. NOTIFICATIONS (sample)
-- =============================================================================

INSERT INTO notifications (id, user_id, type, title, message, link, is_read)
VALUES
    (
        'no111111-1111-1111-1111-no1111111111',
        '44444444-4444-4444-4444-444444444444',
        'achievement',
        'Neuer Badge: Erste Schritte!',
        'Glueckwunsch! Du hast das Onboarding abgeschlossen und den Badge "Erste Schritte" erhalten.',
        '/profile/badges',
        true
    ),
    (
        'no222222-2222-2222-2222-no2222222222',
        '44444444-4444-4444-4444-444444444444',
        'like',
        'Deine Idee wurde geliked!',
        'Sarah Hoffmann hat deine Idee "KI-gestuetzte Kundenanalyse" geliked.',
        '/community/aabbccdd-1111-2222-3333-aabbccdd1111',
        false
    ),
    (
        'no333333-3333-3333-3333-no3333333333',
        '55555555-5555-5555-5555-555555555555',
        'system',
        'Willkommen im LR AI Hub!',
        'Schoen, dass du dabei bist! Starte mit dem Kurs "KI-Grundlagen fuer Einsteiger" und sammle deine ersten XP.',
        '/learn/dddddddd-dddd-dddd-dddd-dddddddddddd',
        false
    ),
    (
        'no444444-4444-4444-4444-no4444444444',
        '33333333-3333-3333-3333-333333333333',
        'comment',
        'Neuer Kommentar auf deinen Post',
        'Thomas Wagner hat auf deine Frage "Welches KI-Tool nutzt ihr fuer Social Media Content?" geantwortet.',
        '/community/aabbccdd-2222-3333-4444-aabbccdd2222',
        false
    ),
    (
        'no555555-5555-5555-5555-no5555555555',
        '11111111-1111-1111-1111-111111111111',
        'challenge',
        'Challenge abgeschlossen!',
        'Du hast die Challenge "Prompt der Woche" erfolgreich abgeschlossen! +200 XP',
        '/challenges/ch111111-1111-1111-1111-ch1111111111',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 17. INNOVATION RADAR ITEMS
-- =============================================================================

INSERT INTO innovation_radar_items (id, title, description, category, relevance_score, trend_direction, related_posts, related_experts)
VALUES
    (
        'ri111111-1111-1111-1111-ri1111111111',
        'Google Gemini 2.0',
        'Googles neuestes KI-Modell mit verbessertem Reasoning, nativem Tool-Use und Multimodalitaet. Besonders relevant fuer unsere Plattform als Primary Provider.',
        'tools',
        92,
        'rising',
        ARRAY['aabbccdd-2222-3333-4444-aabbccdd2222']::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222']::UUID[]
    ),
    (
        'ri222222-2222-2222-2222-ri2222222222',
        'RAG (Retrieval Augmented Generation)',
        'Technik zur Anreicherung von KI-Antworten mit unternehmensspezifischem Wissen. Kernbaustein fuer unseren AI Mentor.',
        'techniques',
        88,
        'rising',
        ARRAY[]::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111']::UUID[]
    ),
    (
        'ri333333-3333-3333-3333-ri3333333333',
        'AI Agents / Agentic Workflows',
        'Autonome KI-Agenten die mehrstufige Aufgaben selbststaendig bearbeiten. Potenzial fuer automatisierte Geschaeftsprozesse.',
        'techniques',
        85,
        'rising',
        ARRAY[]::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222']::UUID[]
    ),
    (
        'ri444444-4444-4444-4444-ri4444444444',
        'Cursor / AI-gestuetzte Entwicklung',
        'KI-gestuetzte Code-Editoren die die Software-Entwicklung revolutionieren. Relevant fuer das IT-Team.',
        'tools',
        78,
        'rising',
        ARRAY[]::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222']::UUID[]
    ),
    (
        'ri555555-5555-5555-5555-ri5555555555',
        'Supabase Edge Functions',
        'Serverless Functions am Edge fuer schnelle API-Endpunkte. Unser Backend-Stack fuer KI-Integrationen.',
        'platforms',
        75,
        'stable',
        ARRAY[]::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222']::UUID[]
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED COMPLETE
-- =============================================================================

-- Verify seed data
DO $$
DECLARE
    profile_count INT;
    bp_count INT;
    course_count INT;
    challenge_count INT;
    badge_count INT;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO bp_count FROM best_practices;
    SELECT COUNT(*) INTO course_count FROM courses;
    SELECT COUNT(*) INTO challenge_count FROM challenges;
    SELECT COUNT(*) INTO badge_count FROM badges;

    RAISE NOTICE '';
    RAISE NOTICE '=== LR AI Hub Seed Summary ===';
    RAISE NOTICE 'Profiles:       %', profile_count;
    RAISE NOTICE 'Best Practices:  %', bp_count;
    RAISE NOTICE 'Courses:         %', course_count;
    RAISE NOTICE 'Challenges:      %', challenge_count;
    RAISE NOTICE 'Badges:          %', badge_count;
    RAISE NOTICE '==============================';
    RAISE NOTICE '';
END $$;
