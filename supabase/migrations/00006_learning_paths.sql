-- =============================================================================
-- AI Hub - Learning Paths Migration
-- Version: 00006
-- Date: 2026-02-21
-- Description: Adds learning_paths, learning_path_courses, and
--   user_learning_path_progress tables for curated course sequences
--   that guide users through structured learning journeys.
-- =============================================================================

-- =============================================================================
-- 1. TABLE: learning_paths
-- =============================================================================

CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    difficulty difficulty_level NOT NULL DEFAULT 'beginner',
    estimated_hours DECIMAL(5,1) NOT NULL DEFAULT 0,
    icon TEXT DEFAULT 'Route',
    color TEXT DEFAULT 'green',
    is_published BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE learning_paths IS 'Curated sequences of courses forming structured learning journeys';
COMMENT ON COLUMN learning_paths.slug IS 'URL-friendly unique identifier for the learning path';
COMMENT ON COLUMN learning_paths.icon IS 'Lucide icon name for visual representation';
COMMENT ON COLUMN learning_paths.color IS 'Theme color key (green, blue, gold, purple)';
COMMENT ON COLUMN learning_paths.estimated_hours IS 'Total estimated hours to complete all courses';

-- Trigger: auto-update updated_at
CREATE TRIGGER learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_paths_slug ON learning_paths(slug);
CREATE INDEX IF NOT EXISTS idx_learning_paths_published ON learning_paths(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_learning_paths_order ON learning_paths(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON learning_paths(difficulty);

-- RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_paths_select_published"
    ON learning_paths FOR SELECT
    TO authenticated
    USING (is_published = true OR is_admin());

CREATE POLICY "learning_paths_insert_admin"
    ON learning_paths FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "learning_paths_update_admin"
    ON learning_paths FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "learning_paths_delete_admin"
    ON learning_paths FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 2. TABLE: learning_path_courses (join table with ordering)
-- =============================================================================

CREATE TABLE IF NOT EXISTS learning_path_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (learning_path_id, course_id)
);

COMMENT ON TABLE learning_path_courses IS 'Maps courses to learning paths with ordering and requirement flags';
COMMENT ON COLUMN learning_path_courses.order_index IS 'Position of the course within the learning path (0-based)';
COMMENT ON COLUMN learning_path_courses.is_required IS 'Whether this course must be completed to finish the path';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lpc_path ON learning_path_courses(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_lpc_course ON learning_path_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_lpc_order ON learning_path_courses(learning_path_id, order_index ASC);

-- RLS
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_path_courses_select"
    ON learning_path_courses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM learning_paths lp
            WHERE lp.id = learning_path_courses.learning_path_id
            AND (lp.is_published = true OR is_admin())
        )
    );

CREATE POLICY "learning_path_courses_insert_admin"
    ON learning_path_courses FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "learning_path_courses_update_admin"
    ON learning_path_courses FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "learning_path_courses_delete_admin"
    ON learning_path_courses FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 3. TABLE: user_learning_path_progress
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_learning_path_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    current_course_index INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, learning_path_id)
);

COMMENT ON TABLE user_learning_path_progress IS 'Tracks user enrollment and progress through learning paths';
COMMENT ON COLUMN user_learning_path_progress.current_course_index IS 'Index of the course the user is currently working on';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ulpp_user ON user_learning_path_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ulpp_path ON user_learning_path_progress(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_ulpp_started ON user_learning_path_progress(started_at DESC);

-- RLS
ALTER TABLE user_learning_path_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_learning_path_progress_select_own"
    ON user_learning_path_progress FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "user_learning_path_progress_insert_own"
    ON user_learning_path_progress FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_learning_path_progress_update_own"
    ON user_learning_path_progress FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "user_learning_path_progress_delete_own"
    ON user_learning_path_progress FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
