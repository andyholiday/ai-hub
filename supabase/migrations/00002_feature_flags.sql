-- =============================================================================
-- AI Hub - Feature Flags Table
-- Version: 00002
-- Date: 2026-02-20
-- Description: Feature flags table for runtime feature toggling via Admin UI.
-- =============================================================================

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE feature_flags IS 'Runtime feature flags toggled via the Admin Panel';
COMMENT ON COLUMN feature_flags.flag_key IS 'Unique key for programmatic access (e.g. ai-mentor, semantic-search)';

-- Trigger: auto-update updated_at
CREATE TRIGGER feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read feature flags (needed for feature gating)
CREATE POLICY "feature_flags_select_all"
    ON feature_flags FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "feature_flags_insert_admin"
    ON feature_flags FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "feature_flags_update_admin"
    ON feature_flags FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "feature_flags_delete_admin"
    ON feature_flags FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- Seed default feature flags matching the Admin UI defaults
-- =============================================================================

INSERT INTO feature_flags (flag_key, name, description, enabled) VALUES
    ('ai-mentor', 'AI Mentor', 'KI-Chat-Assistent fuer alle Benutzer', true),
    ('usecase-eval', 'Use-Case Bewertung', 'Automatische KI-Bewertung eingereichte Ideen', true),
    ('semantic-search', 'Semantische Suche', 'KI-gestuetzte Suche via pgvector', true),
    ('auto-tagging', 'Auto-Tagging', 'Automatische Verschlagwortung neuer Inhalte', true),
    ('ai-orb', 'AI Orb (Floating Assistant)', 'Persistenter KI-Begleiter auf allen Seiten', true),
    ('gamification', 'Gamification', 'XP-System, Levels und Badges', true);
