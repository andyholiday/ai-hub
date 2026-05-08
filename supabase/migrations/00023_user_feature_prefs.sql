-- =============================================================================
-- AI Hub - User Feature Preferences Table
-- Version: 00023
-- Date: 2026-05-07
-- Pattern: P2.2 User-Settings-UX (Plan §5.6)
-- Description: Persists per-user feature toggle overrides. RLS ensures each
--              user can only read and write their own preferences.
--              ON DELETE CASCADE on auth.users satisfies GDPR Right-to-Erasure.
-- =============================================================================

CREATE TABLE user_feature_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id text NOT NULL,
  is_enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_id)
);

ALTER TABLE user_feature_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own" ON user_feature_prefs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users insert own" ON user_feature_prefs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own" ON user_feature_prefs
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete own" ON user_feature_prefs
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_user_feature_prefs_user ON user_feature_prefs (user_id);

COMMENT ON TABLE user_feature_prefs IS 'Pattern P2.2 — User-Toggle-Preferences pro Feature (Plan §5.6)';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
