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
        'aa111111-1111-1111-1111-aa1111111111',
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
        'aa222222-2222-2222-2222-aa2222222222',
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
        'aa333333-3333-3333-3333-aa3333333333',
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
        'aa444444-4444-4444-4444-aa4444444444',
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
UPDATE ai_providers SET fallback_provider_id = 'aa222222-2222-2222-2222-aa2222222222' WHERE provider_key = 'gemini';
UPDATE ai_providers SET fallback_provider_id = 'aa333333-3333-3333-3333-aa3333333333' WHERE provider_key = 'claude';

-- =============================================================================
-- 8. SYSTEM PROMPTS
-- =============================================================================

INSERT INTO system_prompts (id, prompt_key, prompt_text, version, is_active, created_by)
VALUES
    (
        'af111111-1111-1111-1111-af1111111111',
        'mentor_main',
        E'Du bist der AI Mentor des LR AI Hub, einer internen KI-Community-Plattform fuer LR Health & Beauty Systems.\n\nDeine Rolle:\n- Du bist ein freundlicher, kompetenter KI-Lernbegleiter\n- Du hilfst Mitarbeitern, KI besser zu verstehen und im Arbeitsalltag einzusetzen\n- Du gibst praxisnahe Tipps und Beispiele aus dem Kontext eines Health & Beauty Unternehmens im Direktvertrieb\n- Du motivierst und ermutigst, auch bei einfachen Fragen\n\nRichtlinien:\n- Antworte immer auf Deutsch\n- Halte Antworten praegnant (max. 300 Woerter), ausser der User bittet um Details\n- Nutze Markdown-Formatierung fuer bessere Lesbarkeit\n- Verweise auf relevante Kurse und Best Practices auf der Plattform\n- Sei ehrlich ueber Grenzen von KI\n- Keine Empfehlungen fuer interne Daten ausserhalb der Plattform\n\nKontext-Nutzung:\n- Wenn ein Seitenkontext mitgeliefert wird, beziehe dich darauf\n- Auf der Best-Practice-Seite: Biete Zusammenfassungen und Vertiefungen an\n- Im Lern-Hub: Unterstuetze beim Verstaendnis der Lektion\n- Im Idea Board: Hilf beim Formulieren und Bewerten von Ideen',
        1,
        true,
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'af222222-2222-2222-2222-af2222222222',
        'usecase_evaluation',
        E'Du bist ein KI-Bewertungsexperte bei LR Health & Beauty Systems, einem Direktvertriebs-Unternehmen fuer Gesundheits- und Schoenheitsprodukte.\n\nDeine Aufgabe: Bewerte eingereichte KI-Ideen und Use Cases anhand dieser Dimensionen:\n\n1. Unternehmensmehrwert (30%): Umsatzsteigerung, Kostenreduktion, Wettbewerbsvorteil\n2. Mitarbeitermehrwert (25%): Zeitersparnis, Arbeitserleichterung, Skill-Entwicklung\n3. Umsetzbarkeit (20%): Technische Machbarkeit, vorhandene Ressourcen\n4. Skalierbarkeit (15%): Uebertragbarkeit auf andere Abteilungen/Maerkte\n5. Innovationsgrad (10%): Neuartigkeit, Differenzierung\n\nAntworte IMMER im folgenden JSON-Format:\n{\n  "overall_score": <0-100>,\n  "company_value_score": <0-100>,\n  "employee_value_score": <0-100>,\n  "feasibility_score": <0-100>,\n  "scalability_score": <0-100>,\n  "innovation_score": <0-100>,\n  "strengths": "<Freitext>",\n  "risks": "<Freitext>",\n  "roi_estimate": "<Freitext>",\n  "recommendation": "sofort_umsetzen | pilotprojekt | weiterentwickeln | zurueckstellen",\n  "next_steps": "<Freitext>"\n}\n\nKontext: LR hat ca. 1.200 Mitarbeiter, ist in 32 Maerkten aktiv, Kerngeschaeft ist Direktvertrieb ueber Partner.',
        1,
        true,
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'af333333-3333-3333-3333-af3333333333',
        'auto_tag',
        E'Du bist ein Tagging-System. Analysiere den folgenden Text und extrahiere 3-7 relevante Tags.\n\nRegeln:\n- Tags in Kleinbuchstaben\n- Keine Umlaute (ae, oe, ue statt ae, oe, ue)\n- Bindestriche fuer zusammengesetzte Begriffe\n- Maximal 2 Woerter pro Tag\n- Nur relevante, spezifische Tags\n\nAntworte NUR mit einem JSON-Array von Strings:\n["tag1", "tag2", "tag3"]',
        1,
        true,
        '22222222-2222-2222-2222-222222222222'
    ),
    (
        'af444444-4444-4444-4444-af4444444444',
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
        'ca111111-1111-1111-1111-ca1111111111',
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
        'ca222222-2222-2222-2222-ca2222222222',
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
        'ca333333-3333-3333-3333-ca3333333333',
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
    ('11111111-1111-1111-1111-111111111111', 'ca111111-1111-1111-1111-ca1111111111', 100, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
    ('22222222-2222-2222-2222-222222222222', 'ca111111-1111-1111-1111-ca1111111111', 75, NULL, NOW() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333333', 'ca111111-1111-1111-1111-ca1111111111', 50, NULL, NOW() - INTERVAL '1 day'),
    ('44444444-4444-4444-4444-444444444444', 'ca222222-2222-2222-2222-ca2222222222', 20, NULL, NOW() - INTERVAL '4 days'),
    ('11111111-1111-1111-1111-111111111111', 'ca222222-2222-2222-2222-ca2222222222', 35, NULL, NOW() - INTERVAL '5 days')
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
        'ba111111-1111-1111-1111-ba1111111111',
        'first-steps',
        'Erste Schritte',
        'Onboarding abgeschlossen',
        'footprints',
        'achievement',
        NULL,
        'complete_onboarding'
    ),
    (
        'ba222222-2222-2222-2222-ba2222222222',
        'first-practice',
        'Erster Beitrag',
        'Erste Best Practice veroeffentlicht',
        'pencil',
        'achievement',
        NULL,
        'publish_first_best_practice'
    ),
    (
        'ba333333-3333-3333-3333-ba3333333333',
        'course-graduate',
        'Absolvent',
        'Ersten Kurs abgeschlossen',
        'graduation-cap',
        'achievement',
        NULL,
        'complete_first_course'
    ),
    (
        'ba444444-4444-4444-4444-ba4444444444',
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
        'ba555555-5555-5555-5555-ba5555555555',
        'prompt-engineer',
        'Prompt Engineer',
        '10 Best Practices zu Prompting veroeffentlicht',
        'terminal',
        'skill',
        NULL,
        'publish_10_prompt_practices'
    ),
    (
        'ba666666-6666-6666-6666-ba6666666666',
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
        'ba777777-7777-7777-7777-ba7777777777',
        'helpful',
        'Hilfreich',
        '50 Likes auf eigene Beitraege erhalten',
        'heart',
        'social',
        NULL,
        'receive_50_likes'
    ),
    (
        'ba888888-8888-8888-8888-ba8888888888',
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
        'ba999999-9999-9999-9999-ba9999999999',
        'early-adopter',
        'Early Adopter',
        'In den ersten 30 Tagen registriert',
        'rocket',
        'special',
        NULL,
        'register_within_30_days'
    ),
    (
        'baaaaaa0-aaaa-aaaa-aaaa-baaaaaa0aaaa',
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
        'babbbbbb-bbbb-bbbb-bbbb-babbbbbbbbbb',
        'visionary',
        'Visionaer',
        'KI-Idee mit Score ueber 90 eingereicht',
        'lightbulb',
        'achievement',
        NULL,
        'idea_score_above_90'
    ),
    (
        'bacccccc-cccc-cccc-cccc-bacccccccccc',
        'game-changer',
        'Game Changer',
        'Idee wurde vom Management umgesetzt',
        'zap',
        'achievement',
        NULL,
        'idea_implemented_by_management'
    ),
    (
        'badddddd-dddd-dddd-dddd-badddddddddd',
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
    ('11111111-1111-1111-1111-111111111111', 'ba111111-1111-1111-1111-ba1111111111', NOW() - INTERVAL '60 days'),
    ('11111111-1111-1111-1111-111111111111', 'ba222222-2222-2222-2222-ba2222222222', NOW() - INTERVAL '55 days'),
    ('11111111-1111-1111-1111-111111111111', 'ba333333-3333-3333-3333-ba3333333333', NOW() - INTERVAL '40 days'),
    ('11111111-1111-1111-1111-111111111111', 'ba444444-4444-4444-4444-ba4444444444', NOW() - INTERVAL '30 days'),
    ('11111111-1111-1111-1111-111111111111', 'ba999999-9999-9999-9999-ba9999999999', NOW() - INTERVAL '60 days'),
    ('11111111-1111-1111-1111-111111111111', 'ba777777-7777-7777-7777-ba7777777777', NOW() - INTERVAL '20 days'),
    -- Markus: several badges
    ('22222222-2222-2222-2222-222222222222', 'ba111111-1111-1111-1111-ba1111111111', NOW() - INTERVAL '55 days'),
    ('22222222-2222-2222-2222-222222222222', 'ba222222-2222-2222-2222-ba2222222222', NOW() - INTERVAL '50 days'),
    ('22222222-2222-2222-2222-222222222222', 'ba333333-3333-3333-3333-ba3333333333', NOW() - INTERVAL '35 days'),
    ('22222222-2222-2222-2222-222222222222', 'ba999999-9999-9999-9999-ba9999999999', NOW() - INTERVAL '55 days'),
    ('22222222-2222-2222-2222-222222222222', 'ba555555-5555-5555-5555-ba5555555555', NOW() - INTERVAL '15 days'),
    -- Lisa: a few badges
    ('33333333-3333-3333-3333-333333333333', 'ba111111-1111-1111-1111-ba1111111111', NOW() - INTERVAL '45 days'),
    ('33333333-3333-3333-3333-333333333333', 'ba222222-2222-2222-2222-ba2222222222', NOW() - INTERVAL '30 days'),
    ('33333333-3333-3333-3333-333333333333', 'ba999999-9999-9999-9999-ba9999999999', NOW() - INTERVAL '45 days'),
    -- Thomas: beginner badges
    ('44444444-4444-4444-4444-444444444444', 'ba111111-1111-1111-1111-ba1111111111', NOW() - INTERVAL '20 days'),
    ('44444444-4444-4444-4444-444444444444', 'ba999999-9999-9999-9999-ba9999999999', NOW() - INTERVAL '20 days')
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
        'e0111111-1111-1111-1111-e01111111111',
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
        'de111111-1111-1111-1111-de1111111111',
        '44444444-4444-4444-4444-444444444444',
        'achievement',
        'Neuer Badge: Erste Schritte!',
        'Glueckwunsch! Du hast das Onboarding abgeschlossen und den Badge "Erste Schritte" erhalten.',
        '/profile/badges',
        true
    ),
    (
        'de222222-2222-2222-2222-de2222222222',
        '44444444-4444-4444-4444-444444444444',
        'like',
        'Deine Idee wurde geliked!',
        'Sarah Hoffmann hat deine Idee "KI-gestuetzte Kundenanalyse" geliked.',
        '/community/aabbccdd-1111-2222-3333-aabbccdd1111',
        false
    ),
    (
        'de333333-3333-3333-3333-de3333333333',
        '55555555-5555-5555-5555-555555555555',
        'system',
        'Willkommen im LR AI Hub!',
        'Schoen, dass du dabei bist! Starte mit dem Kurs "KI-Grundlagen fuer Einsteiger" und sammle deine ersten XP.',
        '/learn/dddddddd-dddd-dddd-dddd-dddddddddddd',
        false
    ),
    (
        'de444444-4444-4444-4444-de4444444444',
        '33333333-3333-3333-3333-333333333333',
        'comment',
        'Neuer Kommentar auf deinen Post',
        'Thomas Wagner hat auf deine Frage "Welches KI-Tool nutzt ihr fuer Social Media Content?" geantwortet.',
        '/community/aabbccdd-2222-3333-4444-aabbccdd2222',
        false
    ),
    (
        'de555555-5555-5555-5555-de5555555555',
        '11111111-1111-1111-1111-111111111111',
        'challenge',
        'Challenge abgeschlossen!',
        'Du hast die Challenge "Prompt der Woche" erfolgreich abgeschlossen! +200 XP',
        '/challenges/ca111111-1111-1111-1111-ca1111111111',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 17. INNOVATION RADAR ITEMS
-- =============================================================================

INSERT INTO innovation_radar_items (id, title, description, category, relevance_score, trend_direction, related_posts, related_experts)
VALUES
    (
        'da111111-1111-1111-1111-da1111111111',
        'Google Gemini 2.0',
        'Googles neuestes KI-Modell mit verbessertem Reasoning, nativem Tool-Use und Multimodalitaet. Besonders relevant fuer unsere Plattform als Primary Provider.',
        'tools',
        92,
        'rising',
        ARRAY['aabbccdd-2222-3333-4444-aabbccdd2222']::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222']::UUID[]
    ),
    (
        'da222222-2222-2222-2222-da2222222222',
        'RAG (Retrieval Augmented Generation)',
        'Technik zur Anreicherung von KI-Antworten mit unternehmensspezifischem Wissen. Kernbaustein fuer unseren AI Mentor.',
        'techniques',
        88,
        'rising',
        ARRAY[]::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111']::UUID[]
    ),
    (
        'da333333-3333-3333-3333-da3333333333',
        'AI Agents / Agentic Workflows',
        'Autonome KI-Agenten die mehrstufige Aufgaben selbststaendig bearbeiten. Potenzial fuer automatisierte Geschaeftsprozesse.',
        'techniques',
        85,
        'rising',
        ARRAY[]::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222']::UUID[]
    ),
    (
        'da444444-4444-4444-4444-da4444444444',
        'Cursor / AI-gestuetzte Entwicklung',
        'KI-gestuetzte Code-Editoren die die Software-Entwicklung revolutionieren. Relevant fuer das IT-Team.',
        'tools',
        78,
        'rising',
        ARRAY[]::UUID[],
        ARRAY['22222222-2222-2222-2222-222222222222']::UUID[]
    ),
    (
        'da555555-5555-5555-5555-da5555555555',
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
-- 18. ADDITIONAL COURSES (3 KI-Kurse mit Lektionen und Quizzes)
-- =============================================================================

-- Course 1: KI-Grundlagen fuer den Arbeitsalltag (Beginner)
-- Course 2: Prompt Engineering Masterclass (Intermediate)
-- Course 3: KI-Ethik und verantwortungsvoller Einsatz (Advanced)

INSERT INTO courses (id, title, description, thumbnail_url, category, difficulty, duration_minutes, lessons_count, xp_reward, is_published, author_id)
VALUES
    (
        'c0000000-0000-0000-0000-c00000000001',
        'KI-Grundlagen fuer den Arbeitsalltag',
        'Entdecke die Welt der Kuenstlichen Intelligenz und lerne, wie du KI-Tools effektiv in deinem taeglichen Arbeitsablauf einsetzen kannst. Von den Basics bis zum ersten eigenen Prompt -- dieser Kurs macht dich fit fuer die KI-gestuetzte Zukunft bei LR.',
        '/images/courses/ki-grundlagen-arbeitsalltag.jpg',
        'grundlagen',
        'beginner',
        60, 5, 150,
        true,
        NULL
    ),
    (
        'c0000000-0000-0000-0000-c00000000002',
        'Prompt Engineering Masterclass',
        'Werde zum Prompt-Profi! In dieser Masterclass lernst du fortgeschrittene Prompting-Techniken und erhaeltst praxiserprobte Vorlagen fuer Vertrieb, Marketing und Analyse -- massgeschneidert fuer den LR-Alltag im Direktvertrieb.',
        '/images/courses/prompt-engineering-masterclass.jpg',
        'prompt-engineering',
        'intermediate',
        90, 6, 250,
        true,
        NULL
    ),
    (
        'c0000000-0000-0000-0000-c00000000003',
        'KI-Ethik und verantwortungsvoller Einsatz',
        'KI verantwortungsvoll nutzen: Verstehe die ethischen Herausforderungen, lerne Datenschutz-Grundlagen (DSGVO) und erfahre, wie du Halluzinationen erkennst. Unverzichtbares Wissen fuer jeden, der KI im Unternehmen einsetzt.',
        '/images/courses/ki-ethik.jpg',
        'ethik',
        'advanced',
        75, 5, 200,
        true,
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 18a. LESSONS - Course 1: KI-Grundlagen fuer den Arbeitsalltag
-- =============================================================================

INSERT INTO lessons (id, course_id, title, content, type, order_index, duration_minutes)
VALUES
    -- Lesson 1.1: Was ist Kuenstliche Intelligenz?
    (
        'e0000000-0000-0000-0000-eeee00000001',
        'c0000000-0000-0000-0000-c00000000001',
        'Was ist Kuenstliche Intelligenz?',
        E'## Was ist Kuenstliche Intelligenz?\n\nKuenstliche Intelligenz (KI) ist eines der praegendsten Themen unserer Zeit. Doch was steckt eigentlich dahinter? In dieser Lektion lernst du die Grundlagen kennen, die du brauchst, um KI im Arbeitsalltag bei LR sinnvoll einzusetzen.\n\n---\n\n### Definition: Kuenstliche Intelligenz\n\n**Kuenstliche Intelligenz** bezeichnet Computersysteme, die Aufgaben erledigen koennen, die normalerweise menschliche Intelligenz erfordern. Dazu gehoeren:\n\n- Sprache verstehen und generieren\n- Muster in Daten erkennen\n- Entscheidungen treffen\n- Aus Erfahrung lernen\n\n---\n\n### Machine Learning vs. Deep Learning\n\nInnerhalb der KI gibt es wichtige Unterkategorien:\n\n**Machine Learning (ML)**\n- Computer lernen aus Daten, ohne explizit programmiert zu werden\n- Beispiel: Ein Spam-Filter lernt anhand von Beispielen, welche E-Mails Spam sind\n- Benoetigt strukturierte Daten und menschlich definierte Features\n\n**Deep Learning (DL)**\n- Eine Weiterentwicklung von ML mit kuenstlichen neuronalen Netzen\n- Kann selbststaendig relevante Muster erkennen\n- Grundlage fuer ChatGPT, Gemini, Claude und andere moderne KI-Tools\n- Benoetigt grosse Datenmengen und Rechenleistung\n\n> **Tipp:** Du musst kein Informatiker sein, um KI zu nutzen! Moderne KI-Tools sind so gestaltet, dass jeder sie bedienen kann -- aehnlich wie du kein Mechaniker sein musst, um Auto zu fahren.\n\n---\n\n### KI-Beispiele aus dem Alltag\n\nDu nutzt bereits taeglich KI, oft ohne es zu wissen:\n\n- **Sprachassistenten**: Siri, Alexa, Google Assistant\n- **Empfehlungssysteme**: Netflix-Vorschlaege, Spotify-Playlists\n- **Navigation**: Google Maps berechnet optimale Routen in Echtzeit\n- **E-Mail**: Gmail sortiert automatisch Spam und kategorisiert Nachrichten\n- **Fotografie**: Dein Smartphone optimiert Fotos automatisch mit KI\n\n---\n\n### KI im Arbeitskontext bei LR\n\nFuer uns bei LR Health & Beauty Systems eroeffnet KI spannende Moeglichkeiten:\n\n- **Vertrieb**: Kundenanalyse, personalisierte Ansprache, automatisierte Follow-ups\n- **Marketing**: Content-Erstellung, Social-Media-Posts, Kampagnen-Optimierung\n- **Produktentwicklung**: Trend-Analyse, Marktforschung, Wettbewerbsanalyse\n- **HR**: Bewerber-Screening, Onboarding-Unterstuetzung\n- **Kundenservice**: Chatbots, FAQ-Automatisierung, Ticket-Priorisierung\n\n---\n\n### Zusammenfassung\n\n- KI ist ein Oberbegriff fuer Systeme, die menschenaehnliche Aufgaben erledigen\n- Machine Learning und Deep Learning sind die wichtigsten Unterkategorien\n- KI ist bereits allgegenwaertig in unserem Alltag\n- Fuer LR bietet KI enormes Potenzial in Vertrieb, Marketing und vielen weiteren Bereichen\n\n> **Merke:** KI ersetzt keine Menschen -- sie verstaerkt unsere Faehigkeiten und befreit uns von Routineaufgaben.',
        'text',
        1,
        10
    ),
    -- Lesson 1.2: Wie KI-Chatbots funktionieren
    (
        'e0000000-0000-0000-0000-eeee00000002',
        'c0000000-0000-0000-0000-c00000000001',
        'Wie KI-Chatbots funktionieren',
        E'## Wie KI-Chatbots funktionieren\n\nChatGPT, Gemini, Claude -- diese Namen hoerst du ueberall. Doch wie funktionieren diese KI-Chatbots eigentlich unter der Haube? In dieser Lektion entmystifizieren wir die Technologie.\n\n---\n\n### Was sind Large Language Models (LLMs)?\n\nDie KI-Chatbots, die wir heute nutzen, basieren auf **Large Language Models (LLMs)** -- grossen Sprachmodellen. Das sind neuronale Netze, die mit riesigen Textmengen trainiert wurden.\n\n**Wichtige Fakten:**\n- GPT-4 wurde mit Hunderten Milliarden Texten trainiert\n- Das Training kostet mehrere Millionen Dollar\n- Das Modell lernt statistische Zusammenhaenge zwischen Woertern\n\n> **Tipp:** Ein LLM \"versteht\" Sprache nicht wirklich -- es ist extrem gut darin, vorherzusagen, welches Wort als naechstes kommen sollte.\n\n---\n\n### Tokens: Die Bausteine der KI-Sprache\n\nLLMs arbeiten nicht mit ganzen Woertern, sondern mit **Tokens**:\n\n- Ein Token ist ein Wortfragment (ca. 3-4 Zeichen im Deutschen)\n- \"Kuenstliche Intelligenz\" = ca. 4-5 Tokens\n- Ein typischer Absatz = ca. 50-100 Tokens\n\n**Warum ist das wichtig?**\n- Jedes KI-Tool hat ein **Token-Limit** (z.B. 128.000 Tokens bei GPT-4)\n- Mehr Tokens = hoehere Kosten\n- Effiziente Prompts sparen Tokens und liefern bessere Ergebnisse\n\n---\n\n### Prompts: Deine Anweisungen an die KI\n\nEin **Prompt** ist die Eingabe, die du an ein KI-Tool sendest. Die Qualitaet deines Prompts bestimmt die Qualitaet der Antwort.\n\n**Einfacher Prompt:**\n```text\nSchreib mir eine E-Mail.\n```\n\n**Besserer Prompt:**\n```text\nSchreibe eine freundliche Follow-up-E-Mail an einen LR-Partner,\nder seit 2 Monaten keine Bestellung aufgegeben hat.\nTon: warmherzig, motivierend, nicht aufdringlich.\nLaenge: maximal 100 Woerter.\n```\n\nDer Unterschied ist enorm! Je mehr Kontext du lieferst, desto besser das Ergebnis.\n\n---\n\n### Context Windows: Das Gedaechtnis der KI\n\nDas **Context Window** ist der Bereich, den die KI \"sehen\" kann -- also dein Prompt plus die bisherige Konversation.\n\n- **GPT-4**: bis zu 128.000 Tokens (~100 Seiten Text)\n- **Claude 3.5**: bis zu 200.000 Tokens (~150 Seiten Text)\n- **Gemini 2.0**: bis zu 1.000.000 Tokens (~750 Seiten Text)\n\n**Praxistipp fuer LR:**\n- Du kannst ganze Produktkataloge oder Vertriebsleitfaeden in den Kontext geben\n- Die KI kann dann spezifisch auf Basis dieser Dokumente antworten\n- Je laenger die Konversation, desto mehr Token werden verbraucht\n\n> **Tipp:** Starte bei komplexen Aufgaben lieber eine neue Konversation, statt eine alte fortzusetzen. So vermeidest du, dass die KI durch zu viel Kontext verwirrt wird.\n\n---\n\n### Der Ablauf einer KI-Anfrage\n\n1. **Du schreibst einen Prompt** (Eingabe)\n2. **Der Prompt wird in Tokens umgewandelt**\n3. **Das Modell berechnet Wahrscheinlichkeiten** fuer die naechsten Tokens\n4. **Token fuer Token wird die Antwort generiert**\n5. **Die Tokens werden in lesbaren Text umgewandelt** (Ausgabe)\n\nDieser Prozess dauert nur Sekunden -- obwohl Milliarden von Berechnungen stattfinden!\n\n---\n\n### Zusammenfassung\n\n- LLMs sind statistische Modelle, die auf riesigen Textmengen trainiert wurden\n- Tokens sind die kleinsten Einheiten, mit denen KI arbeitet\n- Die Qualitaet deines Prompts bestimmt die Qualitaet der Antwort\n- Das Context Window begrenzt, wie viel Information die KI gleichzeitig verarbeiten kann',
        'text',
        2,
        12
    ),
    -- Lesson 1.3: Die wichtigsten KI-Tools im Ueberblick
    (
        'e0000000-0000-0000-0000-eeee00000003',
        'c0000000-0000-0000-0000-c00000000001',
        'Die wichtigsten KI-Tools im Ueberblick',
        E'## Die wichtigsten KI-Tools im Ueberblick\n\nDer KI-Markt ist riesig und waechst rasant. In dieser Lektion stellen wir dir die vier wichtigsten KI-Assistenten vor und zeigen dir, welches Tool sich fuer welche Aufgabe am besten eignet.\n\n---\n\n### ChatGPT (OpenAI)\n\n**Staerken:**\n- Allrounder fuer nahezu jede Textaufgabe\n- Sehr gute Code-Generierung\n- Grosses Plugin-Oekosystem\n- Bildgenerierung mit DALL-E integriert\n- Kann im Internet suchen und aktuelle Informationen liefern\n\n**Ideal fuer:**\n- Brainstorming und Ideenfindung\n- E-Mail-Entwuerfe und Geschaeftskorrespondenz\n- Datenanalyse (mit Code Interpreter)\n- Allgemeine Fragen und Recherche\n\n**LR-Praxis-Beispiel:**\n```prompt\nDu bist ein erfahrener LR-Vertriebscoach. Erstelle 5 verschiedene\nSocial-Media-Posts fuer Instagram, die das neue Aloe Vera Drinking\nGel bewerben. Zielgruppe: gesundheitsbewusste Frauen, 25-45 Jahre.\nTon: authentisch, begeisternd, nicht zu werblich.\nJeder Post: max. 150 Zeichen + 5 relevante Hashtags.\n```\n\n---\n\n### Google Gemini\n\n**Staerken:**\n- Hervorragende Integration in Google Workspace (Docs, Sheets, Gmail)\n- Sehr grosses Context Window (bis zu 1 Mio. Tokens)\n- Starke multimodale Faehigkeiten (Text, Bild, Audio, Video)\n- Gute Echtzeit-Informationen durch Google-Suche-Integration\n\n**Ideal fuer:**\n- Arbeiten mit Google-Dokumenten und Tabellen\n- Analyse langer Dokumente\n- Multimediale Aufgaben (Bilder beschreiben, Videos analysieren)\n- Recherche mit aktuellen Daten\n\n**LR-Praxis-Beispiel:**\n```prompt\nAnalysiere die angehaengte Verkaufsstatistik (Google Sheet) und\nerstelle einen Management-Summary mit:\n1. Top 3 Produkte nach Umsatz\n2. Wachstumstrends im DACH-Markt\n3. Handlungsempfehlungen fuer Q2\nFormat: Bullet Points, maximal 1 Seite.\n```\n\n---\n\n### Claude (Anthropic)\n\n**Staerken:**\n- Exzellent bei langen, nuancierten Texten\n- Sehr gutes Verstaendnis von Kontext und Feinheiten\n- Starker Fokus auf Sicherheit und Ehrlichkeit\n- Sehr grosses Context Window (200K Tokens)\n- Besonders gut im Zusammenfassen und Analysieren\n\n**Ideal fuer:**\n- Lange Dokumente analysieren und zusammenfassen\n- Komplexe Texte schreiben (Reports, Whitepapers)\n- Kritische Analyse und Feedback\n- Aufgaben, die Genauigkeit und Sorgfalt erfordern\n\n**LR-Praxis-Beispiel:**\n```prompt\nHier ist unser 45-seitiger Jahresbericht. Bitte erstelle:\n1. Eine Executive Summary (max. 300 Woerter)\n2. Die 5 wichtigsten Kennzahlen mit Trend-Bewertung\n3. Eine SWOT-Analyse basierend auf dem Bericht\nSprache: Professionelles Deutsch, geeignet fuer die Geschaeftsleitung.\n```\n\n---\n\n### Microsoft Copilot\n\n**Staerken:**\n- Nahtlose Integration in Microsoft 365 (Word, Excel, PowerPoint, Outlook, Teams)\n- Arbeitet direkt mit deinen Unternehmensdaten\n- Kann Praesentationen automatisch erstellen\n- E-Mail-Zusammenfassungen und Meeting-Protokolle\n\n**Ideal fuer:**\n- PowerPoint-Praesentationen aus Briefings erstellen\n- Excel-Daten analysieren mit natuerlicher Sprache\n- E-Mails in Outlook zusammenfassen und beantworten\n- Teams-Meeting-Zusammenfassungen\n\n**LR-Praxis-Beispiel:**\n```prompt\nErstelle aus diesem Briefing-Dokument eine PowerPoint-Praesentation\nfuer das naechste Partner-Event:\n- 10 Folien\n- LR-Branding\n- Fokus auf neue Produkte und Vertriebschancen 2025\n- Sprechernotizen fuer jede Folie\n```\n\n---\n\n### Welches Tool wann? -- Schnellguide\n\n| Aufgabe | Empfohlenes Tool |\n|---------|------------------|\n| Schnelle Fragen & Brainstorming | ChatGPT |\n| Google-Docs-Arbeit & Recherche | Gemini |\n| Lange Analysen & Reports | Claude |\n| Office-365-Integration | Copilot |\n| Social-Media-Content | ChatGPT oder Gemini |\n| Datenanalyse in Excel | Copilot oder ChatGPT |\n| Praesentation erstellen | Copilot |\n\n> **Tipp:** Nutze nicht nur ein Tool! Jedes hat seine Staerken. Probiere verschiedene Tools fuer die gleiche Aufgabe aus und vergleiche die Ergebnisse.\n\n---\n\n### Zusammenfassung\n\n- **ChatGPT**: Der Allrounder fuer fast alles\n- **Gemini**: Am besten im Google-Oekosystem und bei langen Dokumenten\n- **Claude**: Spitze bei Analyse, langen Texten und Genauigkeit\n- **Copilot**: Perfekt fuer die taegliche Arbeit in Microsoft 365',
        'text',
        3,
        15
    ),
    -- Lesson 1.4: Dein erster Prompt (interactive)
    (
        'e0000000-0000-0000-0000-eeee00000004',
        'c0000000-0000-0000-0000-c00000000001',
        'Dein erster Prompt',
        E'## Dein erster Prompt -- Interaktive Uebung\n\nJetzt wird es praktisch! In dieser Lektion schreibst du deine ersten Prompts und lernst das **CRISP-Framework** kennen -- eine bewaehrte Methode fuer effektive KI-Anweisungen.\n\n---\n\n### Das CRISP-Framework\n\nCRISP steht fuer fuenf Elemente, die einen guten Prompt ausmachen:\n\n- **C -- Context** (Kontext): Beschreibe die Ausgangssituation\n- **R -- Role** (Rolle): Weise der KI eine Experten-Rolle zu\n- **I -- Instruction** (Anweisung): Formuliere die Aufgabe klar und praezise\n- **S -- Specifics** (Details): Definiere Format, Laenge, Stil und Einschraenkungen\n- **P -- Perspective** (Perspektive): Bestimme die Zielgruppe der Ausgabe\n\n---\n\n### Uebung 1: Vom schlechten zum guten Prompt\n\n**Schlechter Prompt:**\n```prompt\nSchreib mir was ueber LR-Produkte.\n```\n\n**Warum ist das schlecht?**\n- Kein Kontext (welche Produkte?)\n- Keine Rolle (als wer soll die KI schreiben?)\n- Keine klare Aufgabe (was genau?)\n- Keine Details (Format? Laenge? Stil?)\n- Keine Zielgruppe (fuer wen?)\n\n**Guter Prompt mit CRISP:**\n```prompt\nContext: LR Health & Beauty Systems vertreibt hochwertige\nAloe-Vera-Produkte und Nahrungsergaenzungsmittel im Direktvertrieb.\n\nRole: Du bist ein erfahrener Produktberater bei LR.\n\nInstruction: Erstelle eine ueberzeugende Produktbeschreibung fuer\ndas \"Aloe Vera Drinking Gel Honey\".\n\nSpecifics:\n- Laenge: 100-150 Woerter\n- Tone: begeisternd aber sachlich\n- 3 Key Benefits hervorheben\n- Einen Call-to-Action am Ende\n- Keine medizinischen Heilversprechen\n\nPerspective: Die Beschreibung richtet sich an\ngesundheitsbewusste Endkunden (30-55 Jahre).\n```\n\n> **Tipp:** Du musst nicht immer alle fuenf CRISP-Elemente nutzen. Bei einfachen Aufgaben reichen oft Context + Instruction + Specifics.\n\n---\n\n### Uebung 2: Dein eigener CRISP-Prompt\n\nProbiere es selbst! Schreibe einen CRISP-Prompt fuer eine dieser Aufgaben:\n\n**Aufgabe A -- Kunden-E-Mail:**\nSchreibe eine Reaktivierungs-E-Mail an einen LR-Partner, der seit 3 Monaten nicht bestellt hat.\n\n**Aufgabe B -- Social-Media-Post:**\nErstelle einen Instagram-Post fuer ein neues Parfum aus der LR-Kollektion.\n\n**Aufgabe C -- Meeting-Vorbereitung:**\nFasse die wichtigsten Punkte fuer ein Team-Meeting zum Thema \"KI-Einsatz im Vertrieb\" zusammen.\n\n---\n\n### Uebung 3: Prompt-Verbesserung -- Vorher & Nachher\n\nVerbessere diese Prompts mit dem CRISP-Framework:\n\n**Prompt 1 (vorher):**\n```prompt\nMach mir einen Newsletter.\n```\n\n**Dein verbesserter Prompt:**\nDenke an: Wer schreibt? An wen? Worueber? Wie lang? Welcher Ton?\n\n**Prompt 2 (vorher):**\n```prompt\nAnalysiere diese Zahlen.\n```\n\n**Dein verbesserter Prompt:**\nDenke an: Welche Zahlen? Was soll analysiert werden? In welchem Format?\n\n---\n\n### Best Practices fuer Prompts\n\n1. **Sei spezifisch**: \"Schreibe 3 Bullet Points\" statt \"Schreibe etwas\"\n2. **Gib Beispiele**: Zeige der KI, was du erwartest (Few-Shot)\n3. **Definiere Einschraenkungen**: \"Keine Fachbegriffe\", \"Max. 200 Woerter\"\n4. **Iteriere**: Der erste Prompt ist selten perfekt -- verfeinere ihn\n5. **Nutze Markdown**: Strukturiere deinen Prompt mit Ueberschriften und Listen\n\n> **Tipp:** Speichere deine besten Prompts! Erstelle dir eine persoenliche Prompt-Bibliothek fuer wiederkehrende Aufgaben im LR-Alltag.\n\n---\n\n### Zusammenfassung\n\n- Das CRISP-Framework (Context, Role, Instruction, Specifics, Perspective) ist dein Werkzeug fuer gute Prompts\n- Je mehr relevanten Kontext du lieferst, desto besser die Ergebnisse\n- Uebung macht den Meister -- probiere verschiedene Formulierungen aus\n- Teile deine besten Prompts als Best Practice mit der LR AI Hub Community!',
        'interactive',
        4,
        13
    ),
    -- Lesson 1.5: Quiz: KI-Grundlagen
    (
        'e0000000-0000-0000-0000-eeee00000005',
        'c0000000-0000-0000-0000-c00000000001',
        'Quiz: KI-Grundlagen',
        E'{"questions":[{"question":"Was bedeutet die Abkuerzung LLM?","options":["Large Language Model","Local Learning Machine","Linear Logic Module","Language Learning Method"],"correctIndex":0,"explanation":"LLM steht fuer Large Language Model. Es bezeichnet grosse Sprachmodelle wie GPT-4, Claude oder Gemini, die mit riesigen Textmengen trainiert wurden und natuerliche Sprache verstehen und generieren koennen."},{"question":"Welches Element gehoert NICHT zum CRISP-Framework fuer Prompts?","options":["Context (Kontext)","Role (Rolle)","Speed (Geschwindigkeit)","Perspective (Perspektive)"],"correctIndex":2,"explanation":"Das CRISP-Framework besteht aus Context, Role, Instruction, Specifics und Perspective. Speed (Geschwindigkeit) ist kein Bestandteil des Frameworks."},{"question":"Was sind Tokens in Bezug auf KI-Sprachmodelle?","options":["Bezahleinheiten fuer KI-Dienste","Wortfragmente, die kleinste Verarbeitungseinheit von LLMs","Sicherheitsschluessel fuer API-Zugang","Bewertungspunkte fuer die Antwortqualitaet"],"correctIndex":1,"explanation":"Tokens sind Wortfragmente und die kleinste Einheit, mit der Sprachmodelle arbeiten. Ein deutsches Wort besteht typischerweise aus 1-4 Tokens. Das Token-Limit bestimmt, wie viel Text die KI verarbeiten kann."},{"question":"Welches KI-Tool eignet sich laut dem Kurs am besten fuer die Analyse langer Dokumente und Reports?","options":["Microsoft Copilot","ChatGPT","Claude (Anthropic)","Google Gemini"],"correctIndex":2,"explanation":"Claude von Anthropic zeichnet sich besonders durch exzellente Leistungen bei langen, nuancierten Texten, Zusammenfassungen und Analysen aus. Mit einem Context Window von 200K Tokens kann Claude sehr umfangreiche Dokumente verarbeiten."},{"question":"Was ist der wichtigste Unterschied zwischen Machine Learning und Deep Learning?","options":["Deep Learning ist aelter als Machine Learning","Machine Learning nutzt neuronale Netze, Deep Learning nicht","Deep Learning nutzt kuenstliche neuronale Netze und kann selbststaendig Muster erkennen","Machine Learning braucht mehr Daten als Deep Learning"],"correctIndex":2,"explanation":"Deep Learning ist eine Weiterentwicklung von Machine Learning, die kuenstliche neuronale Netze einsetzt. Der Hauptunterschied ist, dass Deep Learning selbststaendig relevante Muster in Daten erkennen kann, waehrend klassisches ML auf menschlich definierte Features angewiesen ist."}]}',
        'quiz',
        5,
        10
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 18b. LESSONS - Course 2: Prompt Engineering Masterclass
-- =============================================================================

INSERT INTO lessons (id, course_id, title, content, type, order_index, duration_minutes)
VALUES
    -- Lesson 2.1: Die Anatomie eines guten Prompts
    (
        'e0000000-0000-0000-0000-eeee00000006',
        'c0000000-0000-0000-0000-c00000000002',
        'Die Anatomie eines guten Prompts',
        E'## Die Anatomie eines guten Prompts\n\nEin gut strukturierter Prompt ist der Schluessel zu exzellenten KI-Ergebnissen. In dieser Lektion analysieren wir die fuenf Kernelemente, die jeden Prompt von \"okay\" zu \"hervorragend\" machen.\n\n---\n\n### Die 5 Saeule eines Prompts\n\n#### 1. Rolle (Role)\n\nWeise der KI eine spezifische Identitaet zu. Das veraendert den Stil, die Tiefe und die Perspektive der Antwort fundamental.\n\n**Beispiel:**\n```prompt\nDu bist ein erfahrener Vertriebscoach mit 15 Jahren Erfahrung\nim Direktvertrieb fuer Health & Beauty Produkte.\n```\n\n**Warum das wirkt:** Die KI aktiviert relevantes \"Wissen\" aus ihrem Training, das zu dieser Rolle passt. Ein Vertriebscoach schreibt anders als ein Wissenschaftler.\n\n---\n\n#### 2. Aufgabe (Task)\n\nFormuliere praezise, was die KI tun soll. Verwende starke Verben und sei unmissverstaendlich.\n\n**Schwach:** \"Sag mir was ueber Kundenbindung\"\n**Stark:** \"Erstelle eine Liste mit 7 konkreten Massnahmen zur Reaktivierung inaktiver LR-Partner, sortiert nach Aufwand (gering bis hoch)\"\n\n> **Tipp:** Beginne die Aufgabe immer mit einem Aktionsverb: Erstelle, Analysiere, Vergleiche, Formuliere, Entwickle, Optimiere.\n\n---\n\n#### 3. Kontext (Context)\n\nGib der KI alle relevanten Hintergrundinformationen, die sie fuer eine gute Antwort braucht.\n\n**Wichtige Kontext-Elemente:**\n- Branche und Unternehmen (z.B. LR, Direktvertrieb)\n- Aktuelle Situation oder Problemstellung\n- Bisherige Versuche oder bestehende Ansaetze\n- Relevante Daten oder Kennzahlen\n\n```prompt\nKontext: LR Health & Beauty Systems ist ein Direktvertriebsunternehmen\nmit 1.200 Mitarbeitern und ueber 300.000 Partnern weltweit.\nUnsere Kernprodukte sind Aloe-Vera-Produkte, Nahrungsergaenzung\nund Parfums. Im letzten Quartal ist die Partner-Aktivitaetsrate\num 8% gesunken.\n```\n\n---\n\n#### 4. Format (Format)\n\nDefiniere exakt, wie die Ausgabe aussehen soll.\n\n**Format-Optionen:**\n- Laenge: \"Maximal 200 Woerter\" oder \"3-5 Saetze\"\n- Struktur: \"Bullet Points\", \"Nummerierte Liste\", \"Tabelle\"\n- Stil: \"Professionell\", \"Locker\", \"Motivierend\"\n- Sprache: \"Einfaches Deutsch\", \"Business-Deutsch\"\n- Spezial: \"Mit Emojis\", \"Als JSON\", \"Als Markdown\"\n\n```prompt\nFormat:\n- Strukturiert als nummerierte Liste\n- Jeder Punkt: Ueberschrift (fett) + 2-3 Saetze Erklaerung\n- Gesamtlaenge: 300-400 Woerter\n- Ton: motivierend und praxisnah\n- Sprache: verstaendliches Deutsch, keine Anglizismen\n```\n\n---\n\n#### 5. Einschraenkungen (Constraints)\n\nSage der KI, was sie NICHT tun soll. Das ist oft genauso wichtig wie die eigentliche Aufgabe.\n\n**Beispiele fuer Constraints:**\n```prompt\nEinschraenkungen:\n- Keine medizinischen Heilversprechen (Compliance!)\n- Keine direkten Produktpreise nennen\n- Keine Vergleiche mit Wettbewerbern\n- Keine erfundenen Statistiken oder Studien\n- Halte dich ausschliesslich an die bereitgestellten Informationen\n```\n\n> **Tipp:** Constraints sind besonders wichtig im LR-Kontext, da wir als Unternehmen regulatorische Vorgaben einhalten muessen (z.B. Heilmittelwerbegesetz).\n\n---\n\n### Komplett-Beispiel: Alle 5 Elemente\n\n```prompt\n[Rolle]\nDu bist ein Senior Content Manager bei LR Health & Beauty Systems\nmit Expertise in Social-Media-Marketing fuer Direktvertrieb.\n\n[Aufgabe]\nErstelle 3 verschiedene LinkedIn-Posts, die unsere Partnerschaft\nmit dem Weltsportler XY fuer die neue Parfum-Kollektion bewerben.\n\n[Kontext]\nLR hat eine neue Parfum-Kollektion in Zusammenarbeit mit dem\nWeltsportler XY lanciert. Die Kollektion umfasst 2 Duefte\n(fuer Sie und Ihn). Launch-Datum ist naechste Woche.\n\n[Format]\n- 3 Posts mit unterschiedlichem Blickwinkel\n- Jeder Post: 100-150 Woerter\n- Inklusive 3-5 relevante Hashtags\n- Emojis sparsam einsetzen\n\n[Constraints]\n- Keine Preisnennung\n- Professioneller LinkedIn-Ton (kein Instagram-Stil)\n- Keine uebertriebenen Superlative\n```\n\n---\n\n### Zusammenfassung\n\n- **Rolle**: Gibt der KI eine Identitaet und Perspektive\n- **Aufgabe**: Klare, aktionsbasierte Anweisung\n- **Kontext**: Alle relevanten Hintergrundinformationen\n- **Format**: Exakte Definition der gewuenschten Ausgabe\n- **Constraints**: Grenzen und Verbote fuer die Antwort',
        'text',
        1,
        12
    ),
    -- Lesson 2.2: Fortgeschrittene Techniken
    (
        'e0000000-0000-0000-0000-eeee00000007',
        'c0000000-0000-0000-0000-c00000000002',
        'Fortgeschrittene Techniken',
        E'## Fortgeschrittene Prompting-Techniken\n\nNachdem du die Grundlagen beherrschst, ist es Zeit fuer die Profi-Techniken. Diese Methoden werden von KI-Experten weltweit eingesetzt und koennen die Qualitaet deiner Ergebnisse drastisch verbessern.\n\n---\n\n### 1. Chain-of-Thought (CoT) Prompting\n\n**Was ist das?**\nDu forderst die KI auf, Schritt fuer Schritt zu denken, bevor sie eine Antwort gibt. Das verbessert die Qualitaet bei komplexen Aufgaben enorm.\n\n**Ohne CoT:**\n```prompt\nSollten wir in Markt X expandieren?\n```\n\n**Mit CoT:**\n```prompt\nAnalysiere, ob LR in den skandinavischen Markt expandieren sollte.\nDenke Schritt fuer Schritt:\n\n1. Analysiere die Marktgroesse und das Wachstumspotenzial\n2. Bewerte die Wettbewerbssituation\n3. Identifiziere regulatorische Huerden\n4. Schaetze den Investitionsbedarf\n5. Formuliere eine klare Empfehlung mit Begruendung\n\nZeige deine Ueberlegungen bei jedem Schritt.\n```\n\n> **Tipp:** CoT ist besonders effektiv bei Analyse-Aufgaben, Entscheidungsfindung und mathematischen Berechnungen.\n\n---\n\n### 2. Few-Shot Prompting\n\n**Was ist das?**\nDu gibst der KI 2-3 Beispiele, bevor du die eigentliche Aufgabe stellst. Die KI erkennt das Muster und wendet es an.\n\n**Beispiel fuer LR-Produktbeschreibungen:**\n```prompt\nErstelle Produktbeschreibungen im folgenden Stil:\n\nBeispiel 1:\nProdukt: Aloe Vera Drinking Gel Honey\nBeschreibung: Verwoehnend und wohltuend -- unser Klassiker\nverbindet die Kraft der Aloe Vera mit natuerlichem Honig.\n99,7% reines Aloe-Vera-Gel fuer dein taegliches Wohlbefinden.\n\nBeispiel 2:\nProdukt: Mind Master Brain & Body Performance Drink\nBeschreibung: Dein taeglicher Performance-Booster -- Mind Master\nunterstuetzt mit einer einzigartigen Naehrstoffkombination\ndeine geistige und koerperliche Leistungsfaehigkeit.\n\nJetzt erstelle eine Beschreibung fuer:\nProdukt: Protein Power Shake Schokolade\n```\n\n**Warum das wirkt:** Die KI uebernimmt automatisch:\n- Den Schreibstil (begeisternd, aber sachlich)\n- Die Laenge (2-3 Saetze)\n- Die Struktur (Eigenschaft + Nutzen)\n\n---\n\n### 3. Zero-Shot Prompting\n\n**Was ist das?**\nDu gibst keine Beispiele, sondern verlasst dich auf klare Anweisungen und die vortrainierte Faehigkeit der KI.\n\n**Wann Zero-Shot nutzen:**\n- Einfache, klar definierte Aufgaben\n- Die KI kennt das gewuenschte Format bereits gut\n- Du brauchst schnelle Ergebnisse ohne Beispiel-Vorbereitung\n\n```prompt\nKlassifiziere die folgende Kundenanfrage in eine der Kategorien:\n[Bestellung] [Reklamation] [Produktfrage] [Partnerschaft] [Sonstiges]\n\nKundenanfrage: \"Ich habe letzte Woche das Aloe Vera Set bestellt,\naber es ist noch nicht angekommen. Koennen Sie mir sagen, wo\nmeine Lieferung ist?\"\n```\n\n---\n\n### 4. Prompt Chaining (Verkettung)\n\n**Was ist das?**\nDu teilst eine komplexe Aufgabe in mehrere aufeinanderfolgende Prompts auf, wobei das Ergebnis eines Prompts als Input fuer den naechsten dient.\n\n**Beispiel -- Kampagnen-Erstellung in 3 Schritten:**\n\n**Prompt 1 -- Analyse:**\n```prompt\nAnalysiere die aktuelle Marktsituation fuer Aloe-Vera-Produkte\nim DACH-Raum. Identifiziere 3 Trends und 3 Zielgruppen.\n```\n\n**Prompt 2 -- Strategie (mit Ergebnis aus Prompt 1):**\n```prompt\nBasierend auf diesen Trends und Zielgruppen:\n[Ergebnis aus Prompt 1 einfuegen]\n\nEntwickle eine Content-Strategie fuer Q2 mit konkreten\nThemen fuer jede Zielgruppe.\n```\n\n**Prompt 3 -- Umsetzung (mit Ergebnis aus Prompt 2):**\n```prompt\nBasierend auf dieser Content-Strategie:\n[Ergebnis aus Prompt 2 einfuegen]\n\nErstelle den konkreten Content-Kalender fuer April\nmit Posts fuer Instagram, LinkedIn und Newsletter.\n```\n\n> **Tipp:** Prompt Chaining liefert deutlich bessere Ergebnisse als ein einzelner Mega-Prompt, weil die KI sich auf jeden Schritt fokussieren kann.\n\n---\n\n### 5. Selbstkritik-Prompting\n\n**Was ist das?**\nDu forderst die KI auf, ihre eigene Antwort kritisch zu bewerten und zu verbessern.\n\n```prompt\nErstelle einen Entwurf fuer eine Partner-Newsletter-Einleitung.\n\nBewerte anschliessend deinen eigenen Entwurf nach diesen Kriterien:\n- Ist er motivierend genug?\n- Ist er zu lang/zu kurz?\n- Passt der Ton zur LR-Marke?\n\nErstelle dann eine verbesserte Version basierend auf deiner Kritik.\n```\n\n---\n\n### Zusammenfassung\n\n| Technik | Wann einsetzen |\n|---------|----------------|\n| Chain-of-Thought | Komplexe Analysen, Entscheidungsfindung |\n| Few-Shot | Konsistenter Stil, spezifische Formate |\n| Zero-Shot | Einfache, klar definierte Aufgaben |\n| Prompt Chaining | Mehrstufige, komplexe Projekte |\n| Selbstkritik | Qualitaetsoptimierung von Texten |',
        'text',
        2,
        15
    ),
    -- Lesson 2.3: Prompts fuer den Vertrieb
    (
        'e0000000-0000-0000-0000-eeee00000008',
        'c0000000-0000-0000-0000-c00000000002',
        'Prompts fuer den Vertrieb',
        E'## Prompts fuer den Vertrieb\n\nDer Vertrieb ist das Herzstueck von LR. In dieser Lektion erhaeltst du praxiserprobte Prompt-Vorlagen, die du sofort in deinem Vertriebsalltag einsetzen kannst.\n\n---\n\n### 1. E-Mail-Vorlagen generieren\n\n#### Erstansprache eines potenziellen Partners\n\n```prompt\nRolle: Du bist ein erfahrener LR-Vertriebspartner, der persoenlich\nund authentisch kommuniziert.\n\nAufgabe: Schreibe eine Erstansprache-E-Mail an eine Person,\ndie auf einer Gesundheitsmesse Interesse an den LR-Produkten\ngezeigt hat.\n\nKontext:\n- Name: [Name einfuegen]\n- Interesse: Aloe Vera Drinking Gel und Nahrungsergaenzung\n- Beruf: Fitness-Trainerin\n- Kontakt: Messegespraech vor 3 Tagen\n\nFormat:\n- Betreffzeile + E-Mail-Text\n- Maximal 150 Woerter\n- Persoenlicher Ton, nicht zu verkaeuflich\n- Call-to-Action: Terminvorschlag fuer ein Telefonat\n\nConstraints:\n- Keine Preise nennen\n- Keine Einkommensversprechen\n- Kein Druck aufbauen\n```\n\n---\n\n#### Reaktivierung eines inaktiven Partners\n\n```prompt\nRolle: Fuersorglicher Team-Leader im LR-Vertrieb.\n\nAufgabe: Schreibe eine Reaktivierungs-E-Mail an einen Partner,\nder seit 3 Monaten keine Bestellung aufgegeben hat.\n\nTon: Warmherzig, verstaendnisvoll, motivierend.\nStruktur:\n1. Persoenliche Anrede\n2. Wertschaetzung ausdruecken\n3. Behutsam nach dem Grund fragen\n4. Neuigkeiten/Anreiz bieten\n5. Niedrigschwelliges Angebot (z.B. kurzes Telefonat)\n\nMaximal 120 Woerter. Keine Vorwuerfe, kein Druck.\n```\n\n---\n\n### 2. Kundenanalyse mit KI\n\n#### Kundenprofil erstellen\n\n```prompt\nAnalysiere das folgende Kundenprofil und erstelle eine\npersonalisierte Vertriebsstrategie:\n\nKundendaten:\n- Kundin seit: 2 Jahren\n- Hauptprodukte: Aloe Vera Gel, Zeitgard Pflegeserie\n- Bestellfrequenz: monatlich\n- Durchschnittlicher Bestellwert: 85 EUR\n- Letzte Bestellung: vor 6 Wochen\n\nErstelle:\n1. Kundenprofil-Zusammenfassung (3 Saetze)\n2. Cross-Selling-Empfehlungen (3 Produkte mit Begruendung)\n3. Optimaler Kontakt-Zeitpunkt und -Kanal\n4. Personalisierte Ansprache-Idee\n```\n\n---\n\n#### Zielgruppen-Segmentierung\n\n```prompt\nIch habe eine Liste von 500 LR-Kunden mit folgenden Datenpunkten:\n- Alter, Geschlecht, Region\n- Produktkategorien (Aloe Vera, Parfum, Nahrungsergaenzung, Pflege)\n- Bestellhaeufigkeit und -wert\n- Kanal (Online/Offline)\n\nErstelle ein Segmentierungsmodell mit:\n1. 4-5 klar definierte Kundensegmente\n2. Fuer jedes Segment: Name, Beschreibung, Groesse (geschaetzt)\n3. Fuer jedes Segment: Top-3-Produktempfehlungen\n4. Fuer jedes Segment: Bevorzugter Kommunikationskanal\n\nFormat: Tabelle mit anschliessender Detailbeschreibung.\n```\n\n---\n\n### 3. Pitch und Praesentation\n\n#### Elevator Pitch generieren\n\n```prompt\nErstelle einen 30-Sekunden-Elevator-Pitch fuer LR Health & Beauty\nfuer folgende Situation:\n\nSituation: Networking-Event, Gespraechspartner ist eine\ngesundheitsbewusste Unternehmerin, 40 Jahre.\n\nDer Pitch soll:\n- Neugier wecken, nicht verkaufen\n- Das Geschaeftsmodell in einem Satz erklaeren\n- Einen konkreten Mehrwert nennen\n- Mit einer offenen Frage enden\n\nMaximal 60 Woerter. Natuerlich und nicht auswendig gelernt klingend.\n```\n\n---\n\n#### Einwandbehandlung\n\n```prompt\nErstelle professionelle Antworten auf die 5 haeufigsten Einwaende\nim LR-Vertrieb:\n\n1. \"Das ist doch Pyramidenvertrieb!\"\n2. \"Die Produkte sind zu teuer.\"\n3. \"Ich habe keine Zeit dafuer.\"\n4. \"Ich kenne niemanden, dem ich das verkaufen koennte.\"\n5. \"Ich bin kein Verkaeufer-Typ.\"\n\nFuer jeden Einwand:\n- Empathische Reaktion (1 Satz)\n- Sachliche Aufklaerung (2-3 Saetze)\n- Bruecke zur Loesung (1-2 Saetze)\n- Abschluss-Frage (1 Satz)\n\nTon: Ruhig, kompetent, verstaendnisvoll. Kein aggressives Verkaufen.\n```\n\n---\n\n### 4. Reporting und Follow-up\n\n```prompt\nErstelle eine Vorlage fuer einen woechentlichen Vertriebs-Report\nmit folgender Struktur:\n\n1. Zusammenfassung der Woche (3 Bullet Points)\n2. Kennzahlen: Neue Kontakte, Termine, Abschluesse, Umsatz\n3. Top-3-Erfolge\n4. Herausforderungen und Loesungsansaetze\n5. Prioritaeten fuer naechste Woche\n\nFormat: Professionell, aber nicht zu formell.\nLaenge: Maximal 1 Seite.\n```\n\n> **Tipp:** Speichere deine besten Vertriebs-Prompts in der Best-Practice-Sektion des LR AI Hub, damit das gesamte Team davon profitiert!\n\n---\n\n### Zusammenfassung\n\n- KI kann im Vertrieb enorm Zeit sparen: E-Mails, Analysen, Pitches\n- Immer Kontext ueber LR und die spezifische Situation mitgeben\n- Constraints beachten: keine Heilversprechen, kein Einkommensdruck\n- Ergebnisse immer persoenlich pruefen und anpassen\n- Die besten Prompts mit dem Team teilen',
        'text',
        3,
        15
    ),
    -- Lesson 2.4: Prompts fuer Marketing & Content
    (
        'e0000000-0000-0000-0000-eeee00000009',
        'c0000000-0000-0000-0000-c00000000002',
        'Prompts fuer Marketing & Content',
        E'## Prompts fuer Marketing & Content\n\nContent ist King -- und KI ist dein kreativster Mitarbeiter. In dieser Lektion lernst du Prompts kennen, die dir bei der taeglichen Content-Erstellung fuer Social Media, Blog und SEO helfen.\n\n---\n\n### 1. Social-Media-Content\n\n#### Instagram-Karussell erstellen\n\n```prompt\nRolle: Social-Media-Manager bei LR Health & Beauty Systems.\n\nAufgabe: Erstelle ein Instagram-Karussell (8 Slides) zum Thema\n\"5 Gruende, warum Aloe Vera gut fuer deine Haut ist\".\n\nFuer jede Slide:\n- Ueberschrift (max. 5 Woerter, aufmerksamkeitsstark)\n- Kernaussage (2-3 Saetze)\n- Emoji-Vorschlag\n\nSlide 1: Cover (Hook-Ueberschrift)\nSlide 2-6: Die 5 Gruende\nSlide 7: Zusammenfassung / Fazit\nSlide 8: Call-to-Action (Link in Bio / Kontakt)\n\nTon: Edukativ, nahbar, Instagram-tauglich.\nCaption fuer den Post: 200-250 Zeichen + 15 Hashtags.\n```\n\n---\n\n#### LinkedIn-Thought-Leadership\n\n```prompt\nSchreibe einen LinkedIn-Post im Thought-Leadership-Stil.\n\nThema: Wie Direktvertriebsunternehmen KI nutzen koennen,\num ihre Partner besser zu unterstuetzen.\n\nStruktur:\n1. Hook (erster Satz, der zum Weiterlesen motiviert)\n2. Persoenliche Erfahrung / Beobachtung\n3. 3 konkrete Einsatzmoeglichkeiten\n4. Fazit / Ausblick\n5. Engagement-Frage am Ende\n\nLaenge: 150-200 Woerter (LinkedIn-optimiert).\nTon: Professionell, aber persoenlich. Keine Buzzwords.\n5 relevante Hashtags am Ende.\n```\n\n---\n\n### 2. Blog-Artikel\n\n#### SEO-optimierten Blogpost planen\n\n```prompt\nErstelle eine detaillierte Outline fuer einen SEO-optimierten\nBlogartikel.\n\nThema: \"Aloe Vera fuer die Hautpflege -- Der ultimative Guide\"\nZiel-Keyword: \"Aloe Vera Hautpflege\"\nNeben-Keywords: \"Aloe Vera Gel Anwendung\", \"Aloe Vera Vorteile Haut\"\n\nErstelle:\n1. SEO-Title (max. 60 Zeichen)\n2. Meta-Description (max. 155 Zeichen)\n3. H1-Ueberschrift\n4. Gliederung mit H2- und H3-Ueberschriften\n5. Fuer jeden Abschnitt: 2-3 Stichpunkte zum Inhalt\n6. Vorschlaege fuer interne Links (zu LR-Produkten)\n7. Call-to-Action am Ende\n\nZiellaenge: 1.500-2.000 Woerter.\nZielgruppe: Gesundheitsbewusste Frauen, 25-50 Jahre.\n```\n\n---\n\n#### Content-Repurposing\n\n```prompt\nIch habe folgenden Blogartikel (1.500 Woerter):\n[Artikel hier einfuegen]\n\nErstelle daraus:\n1. 3 Instagram-Posts (je 100-150 Zeichen + 5 Hashtags)\n2. 1 LinkedIn-Post (200 Woerter)\n3. 1 Newsletter-Teaser (80 Woerter)\n4. 5 Twitter/X-Posts (je max. 280 Zeichen)\n5. 3 Pinterest-Pin-Beschreibungen (je 100 Zeichen)\n\nBehalte die Kernbotschaften bei, passe aber Ton und Laenge\nan den jeweiligen Kanal an.\n```\n\n---\n\n### 3. Newsletter\n\n#### Monatlicher Partner-Newsletter\n\n```prompt\nErstelle den monatlichen LR-Partner-Newsletter fuer [Monat].\n\nStruktur:\n1. Persoenliche Begruessung (3 Saetze, motivierend)\n2. Top-News des Monats (2-3 Highlights)\n3. Produkt-Spotlight: [Produktname]\n4. Erfolgsgeschichte eines Partners (fiktiv aber realistisch)\n5. Tipp des Monats (Vertriebstipp oder KI-Tipp)\n6. Termine und Events\n7. Motivierender Abschluss\n\nTon: Begeisternd, wertschaetzend, informativ.\nLaenge pro Abschnitt: 50-80 Woerter.\nZielgruppe: Aktive LR-Vertriebspartner.\n```\n\n---\n\n### 4. SEO-Optimierung\n\n#### Meta-Daten optimieren\n\n```prompt\nOptimiere die folgenden Meta-Daten fuer SEO:\n\nAktuelle Seite: LR Aloe Vera Produktkategorie\nAktueller Title: \"Aloe Vera Produkte\"\nAktuelle Description: \"Unsere Aloe Vera Produkte\"\n\nErstelle:\n1. 3 Vorschlaege fuer den SEO-Title (max. 60 Zeichen)\n2. 3 Vorschlaege fuer die Meta-Description (max. 155 Zeichen)\n3. 5 Keyword-Vorschlaege fuer die Seite\n4. Schema-Markup-Vorschlag (Produkt-Schema)\n\nZiel: Hoehere Klickrate in den Google-Suchergebnissen.\n```\n\n---\n\n### 5. Bildideen und Visuals\n\n```prompt\nErstelle 5 Bild-Konzepte fuer eine Instagram-Kampagne\nzum Thema \"Sommerfrische mit LR\".\n\nFuer jedes Bild-Konzept:\n- Beschreibung der Szene (3-4 Saetze)\n- Farbpalette (3-4 Farben)\n- Stimmung / Mood\n- Text-Overlay-Vorschlag\n- Welches LR-Produkt integriert wird\n\nStil: Hell, frisch, natuerlich, lifestyle-orientiert.\nKein Stock-Photo-Look. Authentisch und modern.\n```\n\n> **Tipp:** KI kann keine Bilder fuer dich stylen, aber sie kann brillante Briefings fuer Fotografen oder Grafiker erstellen. Nutze die Bild-Konzepte als kreative Grundlage!\n\n---\n\n### Zusammenfassung\n\n- KI ist ideal fuer die Content-Ideenfindung und Erst-Entwuerfe\n- Passe den Ton immer an den jeweiligen Kanal an\n- Content-Repurposing spart enorm Zeit: ein Artikel, viele Formate\n- SEO-Optimierung mit KI macht deine Inhalte besser auffindbar\n- Immer dran denken: KI liefert den Entwurf, du lieferst die Seele',
        'text',
        4,
        15
    ),
    -- Lesson 2.5: Prompts fuer Analyse & Reporting
    (
        'e0000000-0000-0000-0000-eeee00000010',
        'c0000000-0000-0000-0000-c00000000002',
        'Prompts fuer Analyse & Reporting',
        E'## Prompts fuer Analyse & Reporting\n\nDatenanalyse und Reporting gehoeren zu den zeitaufwaendigsten Aufgaben im Unternehmen. KI kann diese Prozesse drastisch beschleunigen -- wenn du die richtigen Prompts kennst.\n\n---\n\n### 1. Datenanalyse-Prompts\n\n#### Verkaufsdaten analysieren\n\n```prompt\nAnalysiere die folgenden Verkaufsdaten und erstelle einen\nstrukturierten Report:\n\n[Daten hier einfuegen oder als CSV/Tabelle bereitstellen]\n\nBitte analysiere:\n1. Top 10 Produkte nach Umsatz (mit Veraenderung zum Vormonat)\n2. Umsatzverteilung nach Regionen (DACH, Europa, International)\n3. Trends: Welche Produktkategorien wachsen, welche schrumpfen?\n4. Saisonale Muster: Gibt es auffaellige Schwankungen?\n5. Anomalien: Ungewoehnliche Ausreisser nach oben oder unten\n\nFormat:\n- Executive Summary (5 Bullet Points)\n- Detailanalyse pro Bereich\n- 3 konkrete Handlungsempfehlungen\n- Visualisierungsvorschlaege (welche Charts waeren sinnvoll?)\n```\n\n---\n\n#### Wettbewerbsanalyse\n\n```prompt\nFuehre eine strukturierte Wettbewerbsanalyse durch.\n\nUnser Unternehmen: LR Health & Beauty Systems\nBranche: Direktvertrieb, Health & Beauty\nHauptprodukte: Aloe Vera, Nahrungsergaenzung, Parfum, Pflege\n\nAnalysiere diese Wettbewerber:\n1. [Wettbewerber 1]\n2. [Wettbewerber 2]\n3. [Wettbewerber 3]\n\nFuer jeden Wettbewerber:\n- Kernprodukte und USPs\n- Geschaetzter Marktanteil\n- Staerken und Schwaechen vs. LR\n- Digitalisierungsgrad\n\nAbschluss:\n- SWOT-Analyse fuer LR\n- 3 strategische Empfehlungen\n- Differenzierungspotenziale\n\nHinweis: Basiere die Analyse auf oeffentlich verfuegbaren\nInformationen. Kennzeichne Schaetzungen als solche.\n```\n\n---\n\n### 2. Zusammenfassungen erstellen\n\n#### Meeting-Protokoll aus Notizen\n\n```prompt\nErstelle ein professionelles Meeting-Protokoll aus diesen\nhandschriftlichen Notizen:\n\n[Notizen hier einfuegen]\n\nFormat:\n- Datum, Teilnehmer, Dauer\n- Tagesordnungspunkte (nummeriert)\n- Fuer jeden Punkt: Diskussion (2-3 Saetze) + Ergebnis/Beschluss\n- Offene Punkte mit Verantwortlichem und Deadline\n- Naechste Schritte\n\nStil: Sachlich, klar, actionable.\nFehlende Informationen als [TBD] markieren.\n```\n\n---\n\n#### Langen Report zusammenfassen\n\n```prompt\nFasse den folgenden Report zusammen:\n\n[Report hier einfuegen]\n\nErstelle 3 Versionen der Zusammenfassung:\n\n1. Executive Summary (5 Saetze) -- fuer die Geschaeftsleitung\n2. Detaillierte Zusammenfassung (1 Seite) -- fuer das Management\n3. Team-Briefing (5 Bullet Points) -- fuer das operative Team\n\nJede Version soll:\n- Die 3 wichtigsten Erkenntnisse enthalten\n- Konkrete Zahlen/Fakten hervorheben\n- Mit einer klaren Handlungsempfehlung enden\n```\n\n---\n\n### 3. KPI-Dashboards und Reports\n\n#### Monatlichen KPI-Report erstellen\n\n```prompt\nErstelle einen monatlichen KPI-Report fuer die Vertriebsleitung.\n\nVerfuegbare Daten:\n- Gesamtumsatz: [X] EUR (Vormonat: [Y] EUR)\n- Neue Partner: [X] (Vormonat: [Y])\n- Aktive Partner: [X] von [Y] gesamt\n- Durchschnittlicher Bestellwert: [X] EUR\n- Top-Markt: [Land]\n- Retouren-Quote: [X]%\n\nErstelle:\n1. Dashboard-Uebersicht mit Ampelsystem (gruen/gelb/rot)\n2. Trend-Analyse (Vergleich 3 Monate)\n3. Highlight des Monats (beste Entwicklung)\n4. Sorgenkind des Monats (groesster Rueckgang)\n5. 3 Fokus-Themen fuer den kommenden Monat\n\nFormat: Klar strukturiert, mit Emojis als visuelle Indikatoren.\n```\n\n---\n\n### 4. Prognosen und Szenarien\n\n```prompt\nErstelle eine Szenario-Analyse fuer den LR-Vertrieb im\nkommenden Quartal.\n\nAktuelle Situation:\n- Umsatz Q4: [X] EUR\n- Partner-Wachstum: [X]% YoY\n- Neue Produktlinie startet im Februar\n- Markt [X] zeigt Schwaeche\n\nErstelle 3 Szenarien:\n\n1. Best Case: Was muss passieren?\n   - Erwarteter Umsatz\n   - Annahmen\n   - Erforderliche Massnahmen\n\n2. Base Case: Realistische Fortschreibung\n   - Erwarteter Umsatz\n   - Annahmen\n   - Notwendige Aktivitaeten\n\n3. Worst Case: Risiko-Szenario\n   - Erwarteter Umsatz\n   - Risikofaktoren\n   - Gegenmassnahmen\n\nFuege eine Wahrscheinlichkeits-Einschaetzung fuer jedes Szenario hinzu.\n```\n\n> **Tipp:** Gib der KI immer echte Daten, wenn moeglich. Je realistischer die Eingabe, desto wertvoller die Analyse. Aber: Pruefe KI-generierte Prognosen immer kritisch -- sie sind Hilfsmittel, keine Kristallkugel!\n\n---\n\n### 5. Automatisierte Report-Vorlagen\n\n```prompt\nErstelle ein wiederverwendbares Template fuer einen\nwoechentlichen Vertriebs-Flash-Report.\n\nDas Template soll Platzhalter enthalten, die ich jede Woche\nmit aktuellen Daten fuellen kann:\n\n[DATUM_VON] bis [DATUM_BIS]\n[UMSATZ_WOCHE]\n[VERGLEICH_VORWOCHE_%]\n[NEUE_PARTNER_ANZAHL]\n[TOP_PRODUKT]\n[HIGHLIGHT]\n[FOKUS_NAECHSTE_WOCHE]\n\nFormat: Professionell, auf einer halben Seite.\nMit Farbcodierung-Hinweisen fuer positive/negative Entwicklungen.\n```\n\n---\n\n### Zusammenfassung\n\n- KI kann Rohdaten in actionable Insights verwandeln\n- Liefere immer konkrete Daten und definiere das gewuenschte Output-Format\n- Nutze Szenario-Analysen fuer strategische Planung\n- Meeting-Protokolle und Report-Zusammenfassungen sparen enorm Zeit\n- Erstelle wiederverwendbare Templates fuer regelmaessige Reports',
        'text',
        5,
        18
    ),
    -- Lesson 2.6: Quiz: Prompt Engineering
    (
        'e0000000-0000-0000-0000-eeee00000011',
        'c0000000-0000-0000-0000-c00000000002',
        'Quiz: Prompt Engineering',
        E'{"questions":[{"question":"Was ist Chain-of-Thought (CoT) Prompting?","options":["Eine Technik, bei der man mehrere KI-Tools miteinander verkettet","Eine Methode, bei der die KI aufgefordert wird, Schritt fuer Schritt zu denken","Ein Ansatz, bei dem man mehrere Prompts gleichzeitig sendet","Eine Technik zum Training von KI-Modellen"],"correctIndex":1,"explanation":"Chain-of-Thought Prompting ist eine Technik, bei der man die KI auffordert, ihre Ueberlegungen Schritt fuer Schritt offenzulegen. Das verbessert die Qualitaet bei komplexen Analyse- und Entscheidungsaufgaben erheblich."},{"question":"Was ist der Hauptvorteil von Few-Shot Prompting gegenueber Zero-Shot Prompting?","options":["Few-Shot ist immer schneller","Few-Shot liefert konsistentere Ergebnisse durch mitgelieferte Beispiele","Few-Shot verbraucht weniger Tokens","Few-Shot funktioniert nur mit ChatGPT"],"correctIndex":1,"explanation":"Der Hauptvorteil von Few-Shot Prompting ist die Konsistenz. Durch 2-3 mitgelieferte Beispiele erkennt die KI das gewuenschte Muster (Stil, Format, Laenge, Ton) und wendet es zuverlaessig auf die neue Aufgabe an."},{"question":"Welches Element gehoert zu den 5 Saeulen eines guten Prompts?","options":["Geschwindigkeit","Kosten","Constraints (Einschraenkungen)","Modellauswahl"],"correctIndex":2,"explanation":"Die 5 Saeulen eines guten Prompts sind: Rolle, Aufgabe, Kontext, Format und Constraints (Einschraenkungen). Constraints definieren, was die KI NICHT tun soll, und sind besonders im Unternehmenskontext wichtig (z.B. keine Heilversprechen bei LR)."},{"question":"Was ist Prompt Chaining?","options":["Mehrere Nutzer arbeiten am gleichen Prompt","Eine komplexe Aufgabe wird in mehrere aufeinanderfolgende Prompts aufgeteilt","Man sendet den gleichen Prompt an verschiedene KI-Tools","Eine Methode zur Prompt-Verschluesselung"],"correctIndex":1,"explanation":"Prompt Chaining bedeutet, eine komplexe Aufgabe in mehrere aufeinanderfolgende Prompts aufzuteilen. Das Ergebnis eines Prompts dient als Input fuer den naechsten. Dies liefert deutlich bessere Ergebnisse als ein einzelner Mega-Prompt."},{"question":"Warum sind Constraints in Prompts fuer den LR-Kontext besonders wichtig?","options":["Weil KI sonst zu langsam antwortet","Weil regulatorische Vorgaben wie das Heilmittelwerbegesetz eingehalten werden muessen","Weil Constraints die Kosten senken","Weil sie das Modell schneller trainieren"],"correctIndex":1,"explanation":"Im LR-Kontext sind Constraints besonders wichtig, weil als Direktvertriebsunternehmen fuer Health & Beauty Produkte regulatorische Vorgaben eingehalten werden muessen. Das Heilmittelwerbegesetz verbietet z.B. Heilversprechen, und Einkommensversprechen im Vertrieb sind ebenfalls reguliert."},{"question":"Welche Prompting-Technik ist am besten geeignet, um die Qualitaet eines KI-generierten Textes zu verbessern?","options":["Zero-Shot Prompting","Selbstkritik-Prompting","Token-Optimierung","Batch-Prompting"],"correctIndex":1,"explanation":"Beim Selbstkritik-Prompting fordert man die KI auf, ihre eigene Antwort kritisch zu bewerten und eine verbesserte Version zu erstellen. Die KI analysiert Schwaechen im ersten Entwurf und korrigiert sie eigenstaendig -- eine einfache aber wirkungsvolle Technik zur Qualitaetssteigerung."}]}',
        'quiz',
        6,
        15
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 18c. LESSONS - Course 3: KI-Ethik und verantwortungsvoller Einsatz
-- =============================================================================

INSERT INTO lessons (id, course_id, title, content, type, order_index, duration_minutes)
VALUES
    -- Lesson 3.1: Bias und Fairness in KI-Systemen
    (
        'e0000000-0000-0000-0000-eeee00000012',
        'c0000000-0000-0000-0000-c00000000003',
        'Bias und Fairness in KI-Systemen',
        E'## Bias und Fairness in KI-Systemen\n\nKI-Systeme sind nur so gut wie die Daten, mit denen sie trainiert wurden. In dieser Lektion lernst du, welche Verzerrungen (Bias) in KI auftreten koennen und wie du als Nutzer damit umgehst.\n\n---\n\n### Was ist KI-Bias?\n\n**Bias** (Voreingenommenheit) in KI-Systemen entsteht, wenn die Trainingsdaten oder die Algorithmen systematische Verzerrungen enthalten. Das fuehrt dazu, dass die KI bestimmte Gruppen bevorzugt oder benachteiligt.\n\n> **Merke:** KI ist nicht objektiv. Sie spiegelt die Muster und Vorurteile in ihren Trainingsdaten wider.\n\n---\n\n### Arten von Bias\n\n#### 1. Datenbias (Data Bias)\nDie Trainingsdaten sind nicht repraesentativ.\n\n**Beispiel:** Eine KI fuer Bewerbungs-Screening, die hauptsaechlich mit Daten maennlicher Bewerber trainiert wurde, bevorzugt maennliche Kandidaten.\n\n**LR-Relevanz:** Wenn du KI fuer Kundenanalyse nutzt und die Daten ueberwiegend aus dem DACH-Markt stammen, koennen Empfehlungen fuer andere Maerkte verzerrt sein.\n\n---\n\n#### 2. Selektionsbias (Selection Bias)\nBestimmte Gruppen sind in den Daten ueber- oder unterrepraesentiert.\n\n**Beispiel:** Online-Bewertungen kommen ueberproportional von sehr zufriedenen oder sehr unzufriedenen Kunden -- die \"stille Mitte\" fehlt.\n\n**LR-Relevanz:** Wenn du KI auf Basis von Feedback-Daten analysieren laesst, bekomm ein verzerrtes Bild, weil zufriedene Kunden seltener Feedback geben.\n\n---\n\n#### 3. Bestaeitigungsbias (Confirmation Bias)\nDie KI verstaerkt bestehende Muster, statt neue Perspektiven zu liefern.\n\n**Beispiel:** Du fragst die KI nach Gruenden, warum dein Produkt erfolgreich ist. Sie wird immer Gruende finden -- auch wenn es eigentlich Probleme gibt.\n\n**LR-Relevanz:** Wenn du die KI bittest, eine Vertriebsstrategie zu bewerten, die du selbst erstellt hast, neigt sie dazu, deine Idee zu bestaetigen.\n\n---\n\n#### 4. Sprachbias (Language Bias)\nKI-Modelle verstehen und generieren englische Texte besser als deutsche.\n\n**Beispiel:** Die gleiche Aufgabe auf Englisch liefert oft detailliertere und nuanciertere Ergebnisse als auf Deutsch.\n\n**LR-Relevanz:** Fuer laenderspezifische Maerkte (z.B. Tuerkei, Polen) koennen KI-Ergebnisse in den jeweiligen Landessprachen qualitativ schwaecher sein.\n\n---\n\n### Reale Beispiele fuer KI-Bias\n\n1. **Amazon Recruiting-KI (2018)**: Bevorzugte maennliche Bewerber, weil die historischen Einstellungsdaten diese Verzerrung enthielten.\n2. **Gesichtserkennung**: Funktioniert bei hellhaeutigen Maennern deutlich zuverlaessiger als bei dunkelhaeutigen Frauen.\n3. **Uebersetzungs-KI**: \"The doctor\" wird auf Deutsch zu \"der Arzt\" (maennlich), \"the nurse\" zu \"die Krankenschwester\" (weiblich).\n4. **Kreditwuerdigkeits-KI**: Benachteiligte in einigen Faellen bestimmte Stadtteile oder ethnische Gruppen.\n\n---\n\n### Strategien gegen Bias im Arbeitsalltag\n\n#### Fuer dich als KI-Nutzer bei LR:\n\n1. **Ergebnisse hinterfragen**: Akzeptiere KI-Output nie unkritisch\n2. **Diverse Perspektiven anfordern**: Bitte die KI explizit um verschiedene Blickwinkel\n3. **Gegenpositionen einholen**: Frage die KI aktiv nach Gegenargumenten\n4. **Datenquellen pruefen**: Frage, auf welcher Basis die KI ihre Antwort gibt\n5. **Mehrere Tools nutzen**: Vergleiche Ergebnisse verschiedener KI-Anbieter\n\n**Prompt-Beispiel gegen Bias:**\n```prompt\nAnalysiere unsere Vertriebsstrategie fuer den skandinavischen Markt.\nBeruecksichtige dabei bewusst:\n- Kulturelle Unterschiede zu unserem DACH-Heimatmarkt\n- Moegliche Verzerrungen durch unsere DACH-zentrische Perspektive\n- Spezifische Beduerfnisse skandinavischer Konsumenten\n- Sowohl Argumente dafuer als auch dagegen\n```\n\n> **Tipp:** Bias-Bewusstsein ist keine Schwaeche -- es ist professionelle Sorgfalt. Wer Bias erkennt und anspricht, trifft bessere Entscheidungen.\n\n---\n\n### Zusammenfassung\n\n- KI-Bias entsteht durch verzerrte Trainingsdaten und verstaerkt bestehende Muster\n- Es gibt verschiedene Bias-Arten: Daten-, Selektions-, Bestaetigungs- und Sprachbias\n- Reale Faelle zeigen, dass Bias ernsthafte Konsequenzen haben kann\n- Als KI-Nutzer kannst du aktiv gegensteuern: Hinterfrage, diversifiziere, pruefe\n- Im LR-Kontext: Achte besonders auf laender- und kulturspezifische Verzerrungen',
        'text',
        1,
        15
    ),
    -- Lesson 3.2: Datenschutz und DSGVO
    (
        'e0000000-0000-0000-0000-eeee00000013',
        'c0000000-0000-0000-0000-c00000000003',
        'Datenschutz und DSGVO',
        E'## Datenschutz und DSGVO beim Einsatz von KI\n\nDer Datenschutz ist beim Einsatz von KI-Tools im Unternehmen nicht optional -- er ist Pflicht. In dieser Lektion lernst du die wichtigsten Regeln fuer den DSGVO-konformen Umgang mit KI.\n\n---\n\n### Die DSGVO in 60 Sekunden\n\nDie **Datenschutz-Grundverordnung (DSGVO)** ist die europaeische Verordnung zum Schutz personenbezogener Daten. Sie gilt seit Mai 2018 und betrifft jedes Unternehmen, das Daten von EU-Buergern verarbeitet.\n\n**Kerngrundsaetze:**\n- **Rechtmaessigkeit**: Daten duerfen nur mit Rechtsgrundlage verarbeitet werden\n- **Zweckbindung**: Daten nur fuer den angegebenen Zweck nutzen\n- **Datenminimierung**: Nur die noetigsten Daten erheben\n- **Richtigkeit**: Daten muessen korrekt und aktuell sein\n- **Speicherbegrenzung**: Daten loeschen, wenn nicht mehr benoetigt\n\n---\n\n### Was du NIEMALS in eine KI eingeben darfst\n\nDiese Daten gehoeren **unter keinen Umstaenden** in ein KI-Tool:\n\n#### Absolut verboten:\n- **Personenbezogene Daten**: Namen, Adressen, E-Mails, Telefonnummern von Kunden oder Partnern\n- **Finanzdaten**: Kontonummern, Kreditkartendaten, Gehaelter\n- **Gesundheitsdaten**: Medizinische Informationen (besonders sensibel!)\n- **Zugangsdaten**: Passwoerter, API-Keys, interne System-Zugaenge\n- **Vertrauliche Geschaeftsdaten**: Unveroffentlichte Finanzzahlen, geheime Strategien, Patente\n\n> **WICHTIG:** Alles, was du in ein KI-Tool eingibst, wird potenziell vom Anbieter gespeichert und kann fuer Training verwendet werden. Behandle jede KI-Eingabe wie eine oeffentliche Nachricht!\n\n---\n\n### Praxis-Beispiele: Richtig vs. Falsch\n\n#### Beispiel 1: Kunden-E-Mail\n\n**FALSCH:**\n```text\nSchreibe eine E-Mail an Frau Mueller (maria.mueller@email.de),\nKundenNr. 12345, die ihr Abo kuendigen will.\nSie hat am 15.03.2024 das Aloe Vera Set fuer 89,90 EUR bestellt.\n```\n\n**RICHTIG:**\n```text\nSchreibe eine E-Mail an eine Kundin, die ihr Abo kuendigen will.\nSie ist seit 2 Jahren Kundin und kauft hauptsaechlich\nAloe-Vera-Produkte im mittleren Preissegment.\nTon: verstaendnisvoll, Ziel: Kuendigung abwenden.\n```\n\n---\n\n#### Beispiel 2: Vertriebsanalyse\n\n**FALSCH:**\n```text\nHier ist die Excel-Tabelle mit allen 5.000 Partnern:\nName, Umsatz, Adresse, Bankverbindung...\n```\n\n**RICHTIG:**\n```text\nAnalysiere diese anonymisierten Vertriebsdaten:\n- Region A: 120 Partner, Durchschnittsumsatz 850 EUR/Monat\n- Region B: 85 Partner, Durchschnittsumsatz 620 EUR/Monat\n- Region C: 200 Partner, Durchschnittsumsatz 1.100 EUR/Monat\n```\n\n---\n\n### Die goldene Regel: Anonymisierung\n\nBevor du Daten in eine KI eingibst, **anonymisiere sie immer**:\n\n1. **Namen ersetzen**: \"Frau Mueller\" wird zu \"Kundin A\"\n2. **Adressen entfernen**: Stattdessen nur Region/PLZ-Bereich angeben\n3. **Kontaktdaten weglassen**: Keine E-Mails, Telefonnummern\n4. **Aggregieren**: Statt Einzeldaten nur Durchschnitte und Summen\n5. **Zeitraeume verallgemeinern**: \"Q1 2024\" statt \"15.03.2024\"\n\n> **Tipp:** Erstelle dir eine Checkliste fuer die Anonymisierung, die du vor jeder KI-Eingabe durchgehst.\n\n---\n\n### Unternehmensrichtlinien bei LR\n\nAls LR-Mitarbeiter gelten zusaetzlich zu den DSGVO-Anforderungen:\n\n1. **Genehmigte Tools**: Nutze nur die KI-Tools, die von der IT-Abteilung freigegeben sind\n2. **Enterprise-Versionen**: Bevorzuge Business-Versionen (z.B. ChatGPT Enterprise), da diese staerkere Datenschutzgarantien bieten\n3. **Kein Upload sensibler Dokumente**: Lade keine internen Dokumente in oeffentliche KI-Tools hoch\n4. **Protokollierung**: Dokumentiere, wofuer du KI-Tools einsetzt (fuer Audit-Zwecke)\n5. **Meldepflicht**: Melde Datenschutz-Vorfaelle sofort an den Datenschutzbeauftragten\n\n---\n\n### Was passiert bei Verstoessen?\n\n- **DSGVO-Bussgelder**: Bis zu 20 Mio. EUR oder 4% des Jahresumsatzes\n- **Reputationsschaden**: Vertrauensverlust bei Kunden und Partnern\n- **Arbeitsrechtliche Konsequenzen**: Abmahnung bis Kuendigung\n- **Persoenliche Haftung**: In schweren Faellen auch persoenliche Haftung\n\n> **Merke:** Datenschutz ist kein Hindernis -- er ist ein Qualitaetsmerkmal. Unternehmen, die verantwortungsvoll mit Daten umgehen, geniessen mehr Vertrauen.\n\n---\n\n### Zusammenfassung\n\n- Gib niemals personenbezogene Daten in KI-Tools ein\n- Anonymisiere alle Daten vor der KI-Eingabe\n- Nutze nur freigegebene Enterprise-Versionen von KI-Tools\n- Die DSGVO gilt ohne Ausnahme -- auch fuer \"kurze Tests\"\n- Im Zweifel: Frage den Datenschutzbeauftragten',
        'text',
        2,
        15
    ),
    -- Lesson 3.3: Halluzinationen erkennen und vermeiden
    (
        'e0000000-0000-0000-0000-eeee00000014',
        'c0000000-0000-0000-0000-c00000000003',
        'Halluzinationen erkennen und vermeiden',
        E'## Halluzinationen erkennen und vermeiden\n\nKI-Halluzinationen sind eines der groessten Risiken beim Einsatz von KI im Unternehmen. In dieser Lektion lernst du, was Halluzinationen sind, wie du sie erkennst und wie du dich davor schuetzen kannst.\n\n---\n\n### Was sind KI-Halluzinationen?\n\nEine **Halluzination** ist eine Antwort der KI, die ueberzeugend klingt, aber faktisch falsch ist. Die KI erfindet Informationen, Quellen oder Zusammenhaenge, die nicht existieren.\n\n**Warum passiert das?**\n- LLMs sagen das wahrscheinlichste naechste Wort voraus -- nicht das korrekteste\n- Sie haben kein echtes Verstaendnis von Wahrheit\n- Sie koennen nicht zwischen Fakten und Fiktion unterscheiden\n- Bei Unsicherheit \"raten\" sie -- und das klingt sehr ueberzeugend\n\n> **Merke:** KI luegt nicht absichtlich. Sie hat kein Konzept von Wahrheit. Sie generiert statistische wahrscheinliche Textfolgen.\n\n---\n\n### Typische Halluzinations-Muster\n\n#### 1. Erfundene Fakten und Zahlen\n**Beispiel:** \"Laut einer Harvard-Studie von 2023 steigert Aloe Vera die Hautfeuchtigkeit um 47%.\"\nDiese Studie existiert moeglicherweise gar nicht.\n\n#### 2. Erfundene Quellen und Zitate\n**Beispiel:** Die KI zitiert ein Buch, einen Artikel oder eine Person mit einem ueberzeugenden, aber komplett erfundenen Zitat.\n\n#### 3. Falsche Zusammenhaenge\n**Beispiel:** Die KI verbindet zwei reale Fakten zu einer falschen Schlussfolgerung.\n\n#### 4. Ueberholte Informationen\n**Beispiel:** Die KI gibt Informationen, die zum Zeitpunkt ihres Trainings korrekt waren, aber inzwischen veraltet sind.\n\n#### 5. Uebertriebene Zuversicht\n**Beispiel:** Die KI praesentiert unsichere Informationen als gesicherte Fakten, ohne Einschraenkungen zu nennen.\n\n---\n\n### So erkennst du Halluzinationen\n\n#### Red Flags -- Wann solltest du skeptisch sein?\n\n1. **Zu spezifische Zahlen**: \"Exakt 73,4% der Kunden bevorzugen...\" -- Woher soll die KI das wissen?\n2. **Unbekannte Studien**: Die KI nennt eine Studie, die du nicht findest\n3. **Prominente Zitate**: Ueberpruefen! KI erfindet gerne Zitate\n4. **Alles klingt perfekt**: Wenn es zu gut klingt, um wahr zu sein...\n5. **Widersprueche**: Die KI widerspricht sich innerhalb der gleichen Antwort\n6. **Sichere Aussagen ueber die Zukunft**: KI kann nicht vorhersagen\n\n---\n\n### Fact-Checking: Dein 4-Schritte-Prozess\n\n#### Schritt 1: Kritisch lesen\nLies die KI-Antwort mit einer gesunden Skepsis. Markiere alle Behauptungen, die du nicht unabhaengig bestaetigen kannst.\n\n#### Schritt 2: Quellen pruefen\nWenn die KI Quellen nennt:\n- Google die genaue Studie/den Artikel\n- Pruefe, ob Autor, Titel und Jahr stimmen\n- Ueberpruefe das Original, nicht nur die KI-Zusammenfassung\n\n#### Schritt 3: Gegenpruefung\n- Frage eine andere KI das Gleiche und vergleiche\n- Konsultiere Fachexperten bei kritischen Themen\n- Nutze verlaessliche Primaerquellen\n\n#### Schritt 4: KI befragen\nFordere die KI auf, ihre Unsicherheit offenzulegen:\n\n```prompt\nWie sicher bist du dir bei diesen Informationen?\nBitte kennzeichne:\n- Gesicherte Fakten (aus deinem Training)\n- Wahrscheinliche Annahmen\n- Bereiche, in denen du dir unsicher bist\n\nWenn du dir bei etwas nicht sicher bist, sage es ehrlich,\nstatt zu raten.\n```\n\n---\n\n### Strategien zur Vermeidung von Halluzinationen\n\n#### 1. Kontext liefern\nJe mehr relevante Informationen du gibst, desto weniger muss die KI \"erfinden\".\n\n```prompt\nBasierend AUSSCHLIEssLICH auf den folgenden Informationen:\n[Deine Informationen hier]\n\nBeantworte die Frage: ...\nWenn die Antwort nicht aus den bereitgestellten Informationen\nabgeleitet werden kann, sage \"Kann ich aus den vorliegenden\nDaten nicht beantworten.\"\n```\n\n#### 2. Quellen-Anker setzen\n```prompt\nZitiere fuer jede Behauptung die Quelle.\nWenn du keine verlaessliche Quelle hast, kennzeichne\ndie Aussage als \"ungesichert\".\n```\n\n#### 3. Konfidenz anfordern\n```prompt\nFuege jeder Aussage eine Konfidenz-Einschaetzung bei:\n[HOCH] - Gesichertes Wissen\n[MITTEL] - Wahrscheinlich korrekt, aber nicht garantiert\n[NIEDRIG] - Beste Schaetzung, Pruefung empfohlen\n```\n\n#### 4. Grenzen akzeptieren\n```prompt\nWenn du etwas nicht weisst oder dir unsicher bist,\nsage es klar und deutlich. \"Ich weiss es nicht\" ist\neine bessere Antwort als eine falsche Information.\n```\n\n---\n\n### LR-spezifische Risiken\n\nBesonders kritisch sind Halluzinationen in diesen LR-Bereichen:\n\n- **Produktinformationen**: Falsche Inhaltsstoffe oder Wirkungen -- Compliance-Risiko!\n- **Regulatorische Aussagen**: Falsche Angaben zu Zulassungen oder Zertifizierungen\n- **Finanzdaten**: Erfundene Umsatzzahlen oder Marktdaten\n- **Wettbewerbsinformationen**: Falsche Aussagen ueber Wettbewerber -- Rechtsrisiko!\n\n> **Tipp:** Bei allen produktbezogenen oder regulatorischen Themen: Pruefe IMMER gegen offizielle LR-Dokumente und Freigaben!\n\n---\n\n### Zusammenfassung\n\n- Halluzinationen sind faktisch falsche, aber ueberzeugend klingende KI-Antworten\n- Sie entstehen, weil KI statistisch wahrscheinliche Texte generiert, nicht Wahrheiten\n- Pruefe alle Fakten, Zahlen und Quellen unabhaengig\n- Nutze spezielle Prompt-Techniken, um Halluzinationen zu reduzieren\n- Im LR-Kontext: Besondere Vorsicht bei Produkt- und Compliance-Themen',
        'text',
        3,
        15
    ),
    -- Lesson 3.4: KI am Arbeitsplatz: Richtlinien
    (
        'e0000000-0000-0000-0000-eeee00000015',
        'c0000000-0000-0000-0000-c00000000003',
        'KI am Arbeitsplatz: Richtlinien',
        E'## KI am Arbeitsplatz: Richtlinien fuer den verantwortungsvollen Einsatz\n\nKI ist ein maechtigtes Werkzeug, aber nicht fuer jede Aufgabe geeignet. In dieser Lektion entwickelst du ein Verstaendnis dafuer, wann und wie KI im Arbeitsalltag bei LR sinnvoll eingesetzt werden sollte.\n\n---\n\n### Wann KI einsetzen? Die Ampel-Regel\n\n#### GRUEN -- KI ideal geeignet\n- Brainstorming und Ideenfindung\n- Textentwuerfe (E-Mails, Posts, Berichte)\n- Zusammenfassungen von langen Dokumenten\n- Uebersetzungen und Sprachoptimierung\n- Recherche und Informationsaufbereitung\n- Strukturierung von Gedanken und Plaenen\n- Vorlagen und Templates erstellen\n\n#### GELB -- KI mit Vorsicht nutzen\n- Datenanalyse (Ergebnisse immer pruefen!)\n- Strategische Empfehlungen (als Input, nicht als Entscheidung)\n- Kundenansprache (immer personalisieren und pruefen)\n- Praesentationen (Fakten verifizieren)\n- Rechtliche Texte (immer von Fachabteilung pruefen lassen)\n\n#### ROT -- KI nicht einsetzen\n- Endgueltige Geschaeftsentscheidungen\n- Rechtlich bindende Dokumente (ohne Juristenpruefung)\n- Verarbeitung personenbezogener Daten\n- Medizinische oder gesundheitliche Beratung\n- Compliance-relevante Freigaben\n- Beurteilung von Mitarbeitern\n\n> **Merke:** KI ist ein Assistent, kein Entscheider. Die Verantwortung liegt immer beim Menschen.\n\n---\n\n### Transparenz: Wann KI-Nutzung offenlegen?\n\n#### Immer offenlegen:\n- In offiziellen Unternehmensdokumenten\n- Bei externen Publikationen und Pressemitteilungen\n- In der Kommunikation mit Behoerden und Regulierern\n- Bei der Erstellung von Vertraegen oder rechtlichen Texten\n\n#### Empfohlen offenzulegen:\n- In Team-Praesentationen (\"Erstellt mit KI-Unterstuetzung\")\n- Bei Best Practices im LR AI Hub\n- In E-Mails, die komplett KI-generiert sind\n\n#### Nicht zwingend offenlegen:\n- Interne Brainstorming-Ergebnisse\n- Persoenliche Recherche-Notizen\n- Sprachliche Optimierungen eigener Texte\n- Ideensammlung und Strukturierung\n\n---\n\n### Die 5 Prinzipien fuer KI am Arbeitsplatz\n\n#### 1. Verantwortung (Accountability)\nDu bist verantwortlich fuer alles, was du mit KI-Hilfe erstellst und veroeffentlichst. \"Die KI hat das so geschrieben\" ist keine Entschuldigung.\n\n**In der Praxis:**\n- Lies jeden KI-Output sorgfaeltig\n- Pruefe Fakten und Zahlen\n- Unterschreibe nur, was du verantwortest\n\n#### 2. Transparenz (Transparency)\nSei ehrlich darueber, wann und wie du KI nutzt.\n\n**In der Praxis:**\n- Informiere dein Team ueber deine KI-Nutzung\n- Teile erfolgreiche Prompts und Workflows\n- Verschweige nicht, wenn KI an einem Ergebnis beteiligt war\n\n#### 3. Fairness (Fairness)\nStelle sicher, dass KI-Ergebnisse niemanden benachteiligen.\n\n**In der Praxis:**\n- Pruefe auf Bias (siehe vorherige Lektion)\n- Nutze KI nicht fuer Personalentscheidungen\n- Achte auf inklusive Sprache in KI-generierten Texten\n\n#### 4. Datenschutz (Privacy)\nSchuetze personenbezogene und vertrauliche Daten.\n\n**In der Praxis:**\n- Anonymisiere alle Daten vor KI-Eingabe\n- Nutze nur genehmigte Tools\n- Loesche sensible Konversationen\n\n#### 5. Qualitaet (Quality)\nStelle sicher, dass KI-gestuetzte Ergebnisse professionellen Standards entsprechen.\n\n**In der Praxis:**\n- Jeder KI-Output durchlaeuft einen Human Review\n- Nutze KI als Startpunkt, nicht als Endergebnis\n- Halte deine eigenen Faehigkeiten weiter aktuell\n\n---\n\n### Der Human-in-the-Loop-Ansatz\n\nDer wichtigste Grundsatz fuer KI im Unternehmen ist der **Human-in-the-Loop**-Ansatz:\n\n```\nKI generiert --> Mensch prueft --> Mensch entscheidet --> Mensch verantwortet\n```\n\n**Warum?**\n- KI hat kein Urteilsvermoegen\n- KI kennt den lokalen Kontext nicht\n- KI kann nicht die Konsequenzen abschaetzen\n- KI hat keine ethische Verantwortung\n\n---\n\n### Checkliste fuer den KI-Einsatz bei LR\n\nBevor du KI fuer eine Aufgabe einsetzt, gehe diese Checkliste durch:\n\n- Ist die Aufgabe fuer KI geeignet (Ampel-Regel)?\n- Enthaelt mein Prompt keine personenbezogenen Daten?\n- Nutze ich ein genehmigtes KI-Tool?\n- Werde ich das Ergebnis vor Verwendung pruefen?\n- Muss ich die KI-Nutzung offenlegen?\n- Koennte das Ergebnis Compliance-relevant sein?\n- Habe ich einen Backup-Plan, falls die KI versagt?\n\n> **Tipp:** Drucke dir diese Checkliste aus und haenge sie neben deinen Monitor -- bis die Routine zur Gewohnheit wird.\n\n---\n\n### Zusammenfassung\n\n- Die Ampel-Regel hilft bei der Entscheidung: gruen (nutzen), gelb (vorsichtig), rot (nicht nutzen)\n- Transparenz ueber KI-Nutzung schafft Vertrauen\n- Die 5 Prinzipien: Verantwortung, Transparenz, Fairness, Datenschutz, Qualitaet\n- Human-in-the-Loop ist nicht verhandelbar: Der Mensch hat immer das letzte Wort\n- Nutze die Checkliste, bis verantwortungsvoller KI-Einsatz zur Gewohnheit wird',
        'text',
        4,
        15
    ),
    -- Lesson 3.5: Quiz: KI-Ethik
    (
        'e0000000-0000-0000-0000-eeee00000016',
        'c0000000-0000-0000-0000-c00000000003',
        'Quiz: KI-Ethik',
        E'{"questions":[{"question":"Was ist eine KI-Halluzination?","options":["Ein technischer Fehler, bei dem die KI abstuerzt","Eine faktisch falsche Antwort, die ueberzeugend klingt","Eine Sicherheitsluecke in KI-Systemen","Ein visueller Fehler bei KI-generierten Bildern"],"correctIndex":1,"explanation":"Eine KI-Halluzination ist eine Antwort, die faktisch falsch ist, aber ueberzeugend und plausibel klingt. KI erfindet dabei Fakten, Quellen oder Zusammenhaenge. Dies passiert, weil LLMs statistisch wahrscheinliche Textfolgen generieren, ohne ein Konzept von Wahrheit zu haben."},{"question":"Welche Daten duerfen laut DSGVO NIEMALS in ein oeffentliches KI-Tool eingegeben werden?","options":["Allgemeine Produktbeschreibungen","Oeffentlich verfuegbare Marktdaten","Personenbezogene Daten von Kunden und Mitarbeitern","Anonymisierte Verkaufsstatistiken"],"correctIndex":2,"explanation":"Personenbezogene Daten wie Namen, E-Mail-Adressen, Telefonnummern oder Gesundheitsdaten von Kunden und Mitarbeitern duerfen niemals in oeffentliche KI-Tools eingegeben werden. Dies verstoesst gegen die DSGVO und kann zu Bussgeldern von bis zu 20 Mio. EUR fuehren."},{"question":"Was bedeutet der Human-in-the-Loop-Ansatz?","options":["Menschen muessen KI-Modelle selbst trainieren","Ein Mensch muss KI-Ergebnisse immer pruefen und die Verantwortung tragen","Menschen und KI wechseln sich bei der Arbeit ab","KI-Systeme muessen von Menschen bedient werden"],"correctIndex":1,"explanation":"Der Human-in-the-Loop-Ansatz bedeutet, dass ein Mensch KI-generierte Ergebnisse immer pruefen, bewerten und die finale Verantwortung uebernehmen muss. KI generiert, der Mensch prueft, entscheidet und verantwortet. Dieser Ansatz ist im Unternehmenskontext nicht verhandelbar."},{"question":"Welche Art von Bias entsteht, wenn KI-Trainingsdaten ueberwiegend aus einem bestimmten Markt stammen?","options":["Bestaeitigungsbias (Confirmation Bias)","Sprachbias (Language Bias)","Datenbias (Data Bias)","Selektionsbias (Selection Bias)"],"correctIndex":2,"explanation":"Wenn die Trainingsdaten ueberwiegend aus einem bestimmten Markt stammen (z.B. DACH), entsteht ein Datenbias. Die KI kennt dann die Muster und Praeferenzen dieses Marktes besonders gut, kann aber fuer andere Maerkte verzerrte oder unpassende Ergebnisse liefern."},{"question":"Laut der Ampel-Regel: Fuer welche Aufgabe sollte KI NICHT eingesetzt werden (rot)?","options":["Brainstorming und Ideenfindung","Textentwuerfe fuer E-Mails","Endgueltige Geschaeftsentscheidungen treffen","Zusammenfassungen von Dokumenten erstellen"],"correctIndex":2,"explanation":"Endgueltige Geschaeftsentscheidungen fallen in die rote Kategorie der Ampel-Regel. KI hat kein Urteilsvermoegen, kennt nicht alle relevanten Kontextfaktoren und kann Konsequenzen nicht abschaetzen. Sie eignet sich als Entscheidungshilfe, aber die finale Entscheidung muss immer ein Mensch treffen."}]}',
        'quiz',
        5,
        15
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
    lesson_count INT;
    challenge_count INT;
    badge_count INT;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO bp_count FROM best_practices;
    SELECT COUNT(*) INTO course_count FROM courses;
    SELECT COUNT(*) INTO lesson_count FROM lessons;
    SELECT COUNT(*) INTO challenge_count FROM challenges;
    SELECT COUNT(*) INTO badge_count FROM badges;

    RAISE NOTICE '';
    RAISE NOTICE '=== LR AI Hub Seed Summary ===';
    RAISE NOTICE 'Profiles:       %', profile_count;
    RAISE NOTICE 'Best Practices:  %', bp_count;
    RAISE NOTICE 'Courses:         %', course_count;
    RAISE NOTICE 'Lessons:         %', lesson_count;
    RAISE NOTICE 'Challenges:      %', challenge_count;
    RAISE NOTICE 'Badges:          %', badge_count;
    RAISE NOTICE '==============================';
    RAISE NOTICE '';
END $$;
