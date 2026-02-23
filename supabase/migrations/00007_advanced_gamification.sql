-- =============================================================================
-- Migration: Advanced Gamification (Streaks & Achievements)
-- Adds achievements system with categories, requirement types, and user tracking.
-- Extends profiles with longest_streak field.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend profiles with longest_streak
-- ---------------------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0;

-- Backfill longest_streak from current streak_days
UPDATE profiles
SET longest_streak = streak_days
WHERE longest_streak < streak_days;

-- ---------------------------------------------------------------------------
-- 2. ENUM Types
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_requirement_type') THEN
    CREATE TYPE achievement_requirement_type AS ENUM (
      'xp_total',
      'posts_count',
      'comments_count',
      'courses_completed',
      'login_streak',
      'lessons_completed',
      'upvotes_received',
      'badges_earned'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_category') THEN
    CREATE TYPE achievement_category AS ENUM (
      'learning',
      'community',
      'engagement',
      'mastery'
    );
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Achievements Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  title       text NOT NULL,
  description text NOT NULL,
  icon        text NOT NULL DEFAULT 'trophy',
  category    achievement_category NOT NULL DEFAULT 'engagement',
  requirement_type  achievement_requirement_type NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  xp_reward   integer NOT NULL DEFAULT 0,
  is_hidden   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by category
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements (category);

-- ---------------------------------------------------------------------------
-- 4. User Achievements Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_achievements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  notified       boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, achievement_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user    ON user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achiev  ON user_achievements (achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlock  ON user_achievements (unlocked_at DESC);

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements: Everyone authenticated can read, only service role can write
CREATE POLICY "achievements_select_authenticated"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- User Achievements: Users can read their own + others (public achievement display)
CREATE POLICY "user_achievements_select_authenticated"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (true);

-- User Achievements: Insert only via service role (triggered by backend)
-- No INSERT/UPDATE/DELETE policies for authenticated users
-- The backend uses the admin client (service role) to insert achievements

-- ---------------------------------------------------------------------------
-- 6. Seed Data: Achievements
-- ---------------------------------------------------------------------------

INSERT INTO achievements (key, title, description, icon, category, requirement_type, requirement_value, xp_reward, is_hidden) VALUES
  -- Learning Achievements
  ('erster-schritt',      'Erster Schritt',       'Ersten Kurs begonnen',                       'footprints',     'learning',   'courses_completed', 1,   25,  false),
  ('wissensdurst',        'Wissensdurst',         '5 Lektionen abgeschlossen',                  'book-open',      'learning',   'lessons_completed', 5,   50,  false),
  ('fleissiger-schueler', 'Fleissiger Schueler',  '15 Lektionen abgeschlossen',                 'graduation-cap', 'learning',   'lessons_completed', 15,  100, false),
  ('kurssammler',         'Kurssammler',          '3 Kurse abgeschlossen',                      'library',        'learning',   'courses_completed', 3,   75,  false),
  ('alle-kurse',          'Alle Kurse gemeistert','Alle verfuegbaren Kurse abgeschlossen',      'crown',          'learning',   'courses_completed', 99,  500, true),

  -- Community Achievements
  ('community-star',      'Community-Star',       '10 Posts erstellt',                           'star',           'community',  'posts_count',       10,  75,  false),
  ('hilfsbereit',         'Hilfsbereit',          '20 Kommentare geschrieben',                   'message-circle', 'community',  'comments_count',    20,  50,  false),
  ('diskussionsleiter',   'Diskussionsleiter',    '25 Posts erstellt',                           'messages',       'community',  'posts_count',       25,  100, false),
  ('beliebt',             'Beliebt',              '50 Upvotes erhalten',                         'heart',          'community',  'upvotes_received',  50,  100, false),
  ('influencer',          'Influencer',           '200 Upvotes erhalten',                        'trending-up',    'community',  'upvotes_received',  200, 250, true),

  -- Engagement Achievements
  ('flammen-starter',     'Flammen-Starter',      '7-Tage Login-Streak',                         'flame',          'engagement', 'login_streak',      7,   50,  false),
  ('unaufhaltsam',        'Unaufhaltsam',         '30-Tage Login-Streak',                        'zap',            'engagement', 'login_streak',      30,  200, false),
  ('marathonlaeufer',     'Marathonlaeufer',      '60-Tage Login-Streak',                        'rocket',         'engagement', 'login_streak',      60,  400, true),
  ('badge-sammler',       'Badge-Sammler',        '5 Badges verdient',                           'award',          'engagement', 'badges_earned',     5,   75,  false),
  ('badge-jaeger',        'Badge-Jaeger',         '10 Badges verdient',                          'medal',          'engagement', 'badges_earned',     10,  150, true),

  -- Mastery Achievements
  ('meister',             'Meister',              'Level 5 erreicht',                             'shield',         'mastery',    'xp_total',          1000, 100, false),
  ('experte',             'Experte',              'Level 7 erreicht',                             'shield-check',   'mastery',    'xp_total',          2200, 200, false),
  ('legende',             'Legende',              'Level 10 erreicht',                            'sparkles',       'mastery',    'xp_total',          5500, 500, true),
  ('xp-sammler',          'XP-Sammler',           '500 XP gesammelt',                             'coins',          'mastery',    'xp_total',          500,  50,  false),
  ('xp-meister',          'XP-Meister',           '3000 XP gesammelt',                            'gem',            'mastery',    'xp_total',          3000, 200, false)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Update update_login_streak to track longest_streak
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_login_streak(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_login timestamptz;
  v_streak integer;
  v_longest integer;
BEGIN
  SELECT last_login_at, streak_days, longest_streak
  INTO v_last_login, v_streak, v_longest
  FROM profiles
  WHERE id = target_user_id;

  IF v_last_login IS NULL OR (now() - v_last_login) > interval '48 hours' THEN
    -- Streak broken or first login
    v_streak := 1;
  ELSIF (now() - v_last_login) > interval '20 hours' THEN
    -- New day login, increment streak
    v_streak := v_streak + 1;
  END IF;
  -- Else: already logged in today, keep streak unchanged

  -- Update longest streak if current exceeds it
  IF v_streak > v_longest THEN
    v_longest := v_streak;
  END IF;

  UPDATE profiles
  SET
    streak_days = v_streak,
    longest_streak = v_longest,
    last_login_at = now(),
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;
