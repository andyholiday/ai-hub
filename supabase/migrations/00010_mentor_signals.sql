-- =============================================================================
-- Migration: Mentor Signals System
-- Creates the mentor_signals table for proactive AI mentor suggestions.
-- Signals are context-aware notifications generated based on user behavior.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- mentor_signals table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL CHECK (signal_type IN (
        'page_entry_briefing',   -- Shown when entering a page
        'inline_suggestion',     -- Shown inline next to content
        'scroll_trigger',        -- Triggered by scroll depth
        'inactivity_nudge',      -- After inactivity threshold
        'achievement_congrats',  -- After earning achievement
        'streak_motivation',     -- Streak-related motivation
        'course_reminder',       -- Continue course reminder
        'smart_notification'     -- General smart notification
    )),
    page_context TEXT NOT NULL DEFAULT 'dashboard',  -- dashboard, learn-hub, community, etc.
    title TEXT,
    content TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    metadata JSONB DEFAULT '{}',  -- Flexible data (course_id, post_id, etc.)
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    shown_at TIMESTAMPTZ,         -- When it was actually displayed to the user
    expires_at TIMESTAMPTZ,       -- Auto-expire old signals
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_mentor_signals_user_unread
    ON mentor_signals(user_id, is_read, is_dismissed)
    WHERE is_read = false AND is_dismissed = false;

CREATE INDEX IF NOT EXISTS idx_mentor_signals_user_page
    ON mentor_signals(user_id, page_context, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentor_signals_expires
    ON mentor_signals(expires_at)
    WHERE expires_at IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_mentor_signals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_mentor_signals_updated_at
    BEFORE UPDATE ON mentor_signals
    FOR EACH ROW
    EXECUTE FUNCTION update_mentor_signals_updated_at();

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------
ALTER TABLE mentor_signals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own signals
CREATE POLICY "Users can view own signals"
    ON mentor_signals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can update their own signals (mark as read/dismissed)
CREATE POLICY "Users can update own signals"
    ON mentor_signals
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can insert signals (from API/edge functions)
CREATE POLICY "Service role can insert signals"
    ON mentor_signals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Service role can delete expired signals
CREATE POLICY "Service role can delete own signals"
    ON mentor_signals
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_signals TO authenticated;
GRANT SELECT ON mentor_signals TO anon;

-- ---------------------------------------------------------------------------
-- RPC: Get user's active signals for a specific page context
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_mentor_signals(
    p_user_id UUID,
    p_page_context TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS SETOF mentor_signals
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM mentor_signals
    WHERE user_id = p_user_id
      AND is_read = false
      AND is_dismissed = false
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (p_page_context IS NULL OR page_context = p_page_context)
    ORDER BY priority DESC, created_at DESC
    LIMIT p_limit;
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION get_mentor_signals(UUID, TEXT, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: Generate page-entry briefing signal
-- Creates a contextual briefing when a user enters a specific page.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_page_briefing(
    p_user_id UUID,
    p_page_context TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_signal_id UUID;
    v_profile RECORD;
    v_content TEXT;
    v_title TEXT;
BEGIN
    -- Get user profile data
    SELECT p.full_name, p.xp, p.level, p.streak_days
    INTO v_profile
    FROM profiles p
    WHERE p.id = p_user_id;

    -- Generate context-specific briefing
    CASE p_page_context
        WHEN 'dashboard' THEN
            v_title := 'Willkommen zurück!';
            v_content := format(
                'Hey %s! Du bist auf einer %s-Tage-Streak 🔥 Dein Level: %s mit %s XP.',
                COALESCE(split_part(v_profile.full_name, ' ', 1), 'du'),
                COALESCE(v_profile.streak_days, 0),
                COALESCE(v_profile.level, 1),
                COALESCE(v_profile.xp, 0)
            );

        WHEN 'learn-hub' THEN
            v_title := 'Lernfortschritt';
            v_content := format(
                'Hey %s! Schau dir deine aktiven Kurse an. Nur noch wenige Lektionen bis zum Abschluss! 💪',
                COALESCE(split_part(v_profile.full_name, ' ', 1), 'du')
            );

        WHEN 'community' THEN
            v_title := 'Community Update';
            v_content := 'Es gibt neue Diskussionen in der Community. Schau rein und teile dein Wissen! 💬';

        WHEN 'challenges' THEN
            v_title := 'Challenges warten!';
            v_content := 'Neue Challenges stehen bereit. Schließe eine ab und sammle XP! 🏆';

        ELSE
            v_title := 'AI Mentor Tipp';
            v_content := 'Brauchst du Hilfe? Klick mich an! 🤖';
    END CASE;

    -- Check if a similar briefing was already shown recently (last 30 min)
    IF EXISTS (
        SELECT 1 FROM mentor_signals
        WHERE user_id = p_user_id
          AND page_context = p_page_context
          AND signal_type = 'page_entry_briefing'
          AND created_at > NOW() - INTERVAL '30 minutes'
    ) THEN
        RETURN NULL;
    END IF;

    -- Insert the briefing signal
    INSERT INTO mentor_signals (user_id, signal_type, page_context, title, content, priority, expires_at)
    VALUES (p_user_id, 'page_entry_briefing', p_page_context, v_title, v_content, 7, NOW() + INTERVAL '30 minutes')
    RETURNING id INTO v_signal_id;

    RETURN v_signal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_page_briefing(UUID, TEXT) TO authenticated;
