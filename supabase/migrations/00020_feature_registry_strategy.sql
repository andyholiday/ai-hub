-- =============================================================================
-- AI Hub - Feature Registry: Toggle-Strategy-Spalte
-- Version: 00020
-- Date: 2026-05-07
-- Description: Fuegt toggle_strategy-Spalte zur feature_flags-Tabelle hinzu.
--              Unterstuetzt Pattern P2.1 (Feature-Registry) und P2.3
--              (Dependency-Graph) aus dem v3-Implementationsplan.
-- ADR: docs/architecture/adr/ (kein dedizierter ADR — Plan §5.1)
-- Pattern: P2.1 Feature-Registry
-- =============================================================================

ALTER TABLE feature_flags
  ADD COLUMN IF NOT EXISTS toggle_strategy text
    NOT NULL DEFAULT 'block'
    CHECK (toggle_strategy IN ('cascade-off', 'warn-and-allow', 'block'));

COMMENT ON COLUMN feature_flags.toggle_strategy IS
  'Toggle-Verhalten bei Deaktivierung: cascade-off | warn-and-allow | block (siehe Pattern P2.3 Dependency-Graph)';
