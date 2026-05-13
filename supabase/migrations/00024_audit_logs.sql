-- =============================================================================
-- AI Hub - C2PA Audit-Log fuer AI Act Art. 50 Transparenz
-- Version: 00024
-- Date: 2026-05-07
-- Description: Pattern P4.3 — C2PA-konforme Audit-Logs per LLM-Response.
--              Phase 1: Manifest-Schema only, kein X.509-Signing (Phase 2).
--              Pseudonymisierung via SHA-256(auth.uid()) und SHA-256(content).
-- ADR: docs/architecture/adr/ADR-012-c2pa-audit-log-art50.md
-- =============================================================================

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_hash text NOT NULL,        -- SHA-256(auth.uid()) — DSGVO-pseudonymisiert
  model_id text NOT NULL,
  provider text NOT NULL,
  region text NOT NULL,
  privacy_mode boolean NOT NULL DEFAULT false,
  content_hash text NOT NULL,        -- SHA-256 des Response-Texts
  manifest_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit-Logs sind administrativ — User darf NICHT lesen (eigene Daten sind anonymisiert via Hash)
-- Service-Role schreibt; Admin/Auditor liest via separate Admin-Route (out-of-scope fuer P4.3)
CREATE POLICY "service inserts" ON audit_logs
  FOR INSERT WITH CHECK (true);  -- Server schreibt mit Service-Role-Key
-- KEINE SELECT/UPDATE/DELETE-Policies fuer regulaere Users (RLS deny-all)
-- Admin-Lesepfad in Wave 5 ergaenzen

CREATE INDEX idx_audit_logs_user_hash ON audit_logs (user_id_hash, created_at DESC);
CREATE INDEX idx_audit_logs_provider ON audit_logs (provider, created_at DESC);

COMMENT ON TABLE audit_logs IS 'Pattern P4.3 — C2PA-konforme Audit-Logs fuer AI Act Art. 50 Transparenz (ADR-012)';
COMMENT ON COLUMN audit_logs.user_id_hash IS 'SHA-256 des auth.uid() — pseudonymisiert (DSGVO Art. 4 Nr. 5)';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
