-- =============================================================================
-- LR AI Hub - Learn Hub Progress Tracking Migration
-- Version: 00004
-- Date: 2026-02-20
-- Description: Adds user_lesson_progress table and certificate_id to
--   user_course_progress for tracking individual lesson completions,
--   quiz scores, and course certificates.
-- =============================================================================

-- =============================================================================
-- 1. ALTER TABLE: user_course_progress - Add certificate_id
-- =============================================================================

ALTER TABLE user_course_progress
    ADD COLUMN IF NOT EXISTS certificate_id UUID UNIQUE DEFAULT NULL;

COMMENT ON COLUMN user_course_progress.certificate_id IS 'UUID reference for the generated completion certificate';

-- =============================================================================
-- 2. TABLE: user_lesson_progress
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_lesson_progress (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quiz_score INTEGER CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 100)),
    PRIMARY KEY (user_id, lesson_id)
);

COMMENT ON TABLE user_lesson_progress IS 'Tracks individual lesson completions and quiz scores per user';
COMMENT ON COLUMN user_lesson_progress.quiz_score IS 'Score for quiz-type lessons (0-100), NULL for non-quiz lessons';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(completed_at DESC);

-- RLS
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_lesson_progress_select_own"
    ON user_lesson_progress FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "user_lesson_progress_insert_own"
    ON user_lesson_progress FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_lesson_progress_update_own"
    ON user_lesson_progress FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "user_lesson_progress_delete_own"
    ON user_lesson_progress FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- =============================================================================
-- 3. FUNCTION: Update course progress when a lesson is completed
-- =============================================================================

CREATE OR REPLACE FUNCTION update_course_progress_on_lesson_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
    v_total_lessons INT;
    v_completed_lessons INT;
    v_progress INT;
BEGIN
    -- Get course_id from the lesson
    SELECT course_id INTO v_course_id
    FROM lessons
    WHERE id = NEW.lesson_id;

    IF v_course_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count total lessons in course
    SELECT COUNT(*) INTO v_total_lessons
    FROM lessons
    WHERE course_id = v_course_id;

    -- Count completed lessons by this user
    SELECT COUNT(*) INTO v_completed_lessons
    FROM user_lesson_progress ulp
    JOIN lessons l ON l.id = ulp.lesson_id
    WHERE l.course_id = v_course_id
      AND ulp.user_id = NEW.user_id;

    -- Calculate progress percentage
    IF v_total_lessons > 0 THEN
        v_progress := ROUND((v_completed_lessons::DECIMAL / v_total_lessons) * 100);
    ELSE
        v_progress := 0;
    END IF;

    -- Upsert course progress
    INSERT INTO user_course_progress (user_id, course_id, progress_percent, started_at)
    VALUES (NEW.user_id, v_course_id, v_progress, NOW())
    ON CONFLICT (user_id, course_id)
    DO UPDATE SET progress_percent = v_progress;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lesson_progress_change
    AFTER INSERT ON user_lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_course_progress_on_lesson_complete();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
