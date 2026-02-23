-- =============================================================================
-- Migration: 00012_user_approval.sql
-- Description: Adds is_approved column to profiles to require manual approval
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Auto-approve existing users so they don't get locked out
UPDATE profiles SET is_approved = true;
