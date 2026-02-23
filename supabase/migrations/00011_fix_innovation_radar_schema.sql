-- =============================================================================
-- Migration 00011: Fix Innovation Radar Schema
-- Adds missing columns that the frontend/API expects:
--   - ring (adopt/trial/assess/hold)
--   - votes_count 
--   - url
--   - added_by
-- =============================================================================

-- 1. Create the ring enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE radar_ring AS ENUM ('adopt', 'trial', 'assess', 'hold');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add missing columns to innovation_radar_items
ALTER TABLE innovation_radar_items
    ADD COLUMN IF NOT EXISTS ring radar_ring NOT NULL DEFAULT 'assess',
    ADD COLUMN IF NOT EXISTS votes_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS url TEXT,
    ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Populate ring from trend_direction for existing rows (sensible mapping)
UPDATE innovation_radar_items
SET ring = CASE trend_direction
    WHEN 'rising' THEN 'adopt'::radar_ring
    WHEN 'stable' THEN 'trial'::radar_ring
    WHEN 'declining' THEN 'hold'::radar_ring
    ELSE 'assess'::radar_ring
END
WHERE ring = 'assess'; -- only update defaults

-- 4. Create index on ring and votes_count for sort/filter performance
CREATE INDEX IF NOT EXISTS idx_radar_items_ring ON innovation_radar_items(ring);
CREATE INDEX IF NOT EXISTS idx_radar_items_votes ON innovation_radar_items(votes_count DESC);

-- 5. Grant permissions (consistent with 00008_fix_grants.sql pattern)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.innovation_radar_items TO authenticated;
GRANT SELECT ON TABLE public.innovation_radar_items TO anon;

-- 6. Insert sample data so the radar is not empty
INSERT INTO innovation_radar_items (title, description, category, ring, votes_count, relevance_score, trend_direction)
VALUES
    ('ChatGPT', 'OpenAIs konversationsbasiertes KI-Modell fuer vielfaeltige Anwendungen im Arbeitsalltag.', 'tools', 'adopt', 24, 95, 'rising'),
    ('Gemini Pro', 'Googles multimodales KI-Modell mit starker Reasoning-Faehigkeit.', 'tools', 'adopt', 18, 90, 'rising'),
    ('Prompt Engineering', 'Systematische Optimierung von KI-Eingaben fuer bessere Ergebnisse.', 'techniques', 'adopt', 21, 92, 'rising'),
    ('RAG (Retrieval Augmented Generation)', 'Kombination von Dokumenten-Suche mit generativer KI fuer faktentreue Antworten.', 'techniques', 'trial', 15, 85, 'rising'),
    ('LangChain', 'Framework zum Erstellen von KI-Anwendungen mit LLM-Ketten und Agenten.', 'frameworks', 'trial', 12, 80, 'rising'),
    ('Microsoft Copilot', 'KI-Assistent integriert in Microsoft 365 Produkte.', 'tools', 'trial', 16, 88, 'rising'),
    ('Claude', 'Anthropics KI-Modell mit starkem Fokus auf Sicherheit und langen Kontexten.', 'tools', 'trial', 14, 82, 'rising'),
    ('AutoGPT', 'Autonome KI-Agenten die selbststaendig Aufgaben loesen koennen.', 'tools', 'assess', 8, 65, 'stable'),
    ('Vector Databases', 'Spezialisierte Datenbanken fuer effiziente Aehnlichkeitssuche mit Embeddings.', 'platforms', 'adopt', 19, 88, 'rising'),
    ('Hugging Face', 'Plattform fuer Open-Source ML-Modelle und Datasets.', 'platforms', 'trial', 11, 75, 'stable'),
    ('Fine-Tuning', 'Anpassung vortrainierter Modelle an spezifische Unternehmensbeduerfnisse.', 'techniques', 'assess', 9, 70, 'stable'),
    ('Stable Diffusion', 'Open-Source Bildgenerierung fuer Marketing und Content-Erstellung.', 'tools', 'assess', 7, 60, 'stable'),
    ('GPT-4 Vision', 'Multimodale KI die Bilder analysieren und beschreiben kann.', 'tools', 'trial', 13, 78, 'rising'),
    ('Ollama', 'Lokale Ausfuehrung von Open-Source LLMs fuer datenschutzkritische Anwendungen.', 'platforms', 'assess', 6, 55, 'rising'),
    ('AI Agents', 'Autonome KI-Systeme die komplexe Workflows selbststaendig ausfuehren.', 'techniques', 'assess', 10, 72, 'rising'),
    ('TensorFlow', 'Googles ML-Framework - etabliert aber zunehmend von PyTorch verdraengt.', 'frameworks', 'hold', 4, 45, 'declining'),
    ('CrewAI', 'Framework fuer Multi-Agent KI-Systeme mit Rollenverteilung.', 'frameworks', 'assess', 5, 58, 'rising'),
    ('Vercel AI SDK', 'TypeScript-Framework fuer Streaming AI-Responses in Web-Apps.', 'frameworks', 'trial', 10, 76, 'rising')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
