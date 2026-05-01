-- =============================================================================
-- AI Hub - COMBINED MIGRATION (all 4 files)
-- Paste this into: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ===================== MIGRATION 00001: INITIAL SCHEMA =====================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom Types
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE best_practice_category AS ENUM (
    'prompt_engineering', 'ai_tools', 'automation', 'data_analysis', 'ai_ethics', 'other'
);
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE lesson_type AS ENUM ('text', 'video', 'quiz', 'interactive');
CREATE TYPE community_post_type AS ENUM ('discussion', 'idea', 'show_and_tell', 'question', 'challenge');
CREATE TYPE challenge_type AS ENUM ('weekly', 'monthly', 'special');
CREATE TYPE chat_message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE entity_type AS ENUM ('best_practice', 'community_post');
CREATE TYPE notification_type AS ENUM ('achievement', 'comment', 'like', 'challenge', 'system', 'mention');
CREATE TYPE evaluator_type AS ENUM ('ai', 'human');
CREATE TYPE ai_feature_type AS ENUM ('mentor_chat', 'usecase_eval', 'search', 'auto_tag', 'summary');
CREATE TYPE radar_category AS ENUM ('tools', 'techniques', 'platforms', 'frameworks');
CREATE TYPE trend_direction AS ENUM ('rising', 'stable', 'declining');
CREATE TYPE badge_category AS ENUM ('achievement', 'skill', 'social', 'special');

-- Helper Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_moderator_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('moderator', 'admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TABLE: profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    department TEXT,
    position TEXT,
    bio TEXT,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    role user_role NOT NULL DEFAULT 'user',
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_level ON profiles(level);
CREATE INDEX idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_username ON profiles(username);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE TO authenticated USING (is_admin());

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- TABLE: best_practices
CREATE TABLE best_practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category best_practice_category NOT NULL DEFAULT 'other',
    tags TEXT[] DEFAULT '{}',
    status content_status NOT NULL DEFAULT 'draft',
    views_count INTEGER NOT NULL DEFAULT 0,
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    ai_summary TEXT,
    ai_tags TEXT[] DEFAULT '{}',
    embedding vector(1536),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER best_practices_updated_at BEFORE UPDATE ON best_practices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_best_practices_author ON best_practices(author_id);
CREATE INDEX idx_best_practices_category ON best_practices(category);
CREATE INDEX idx_best_practices_status ON best_practices(status);
CREATE INDEX idx_best_practices_created_at ON best_practices(created_at DESC);
CREATE INDEX idx_best_practices_upvotes ON best_practices(upvotes_count DESC);
CREATE INDEX idx_best_practices_views ON best_practices(views_count DESC);
CREATE INDEX idx_best_practices_featured ON best_practices(is_featured) WHERE is_featured = true;
CREATE INDEX idx_best_practices_tags ON best_practices USING GIN(tags);
CREATE INDEX idx_best_practices_ai_tags ON best_practices USING GIN(ai_tags);
CREATE INDEX idx_best_practices_title_trgm ON best_practices USING GIN(title gin_trgm_ops);
CREATE INDEX idx_best_practices_content_trgm ON best_practices USING GIN(content gin_trgm_ops);
-- NOTE: ivfflat index requires data in the table. Add later with:
-- CREATE INDEX idx_best_practices_embedding ON best_practices USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "best_practices_select_published" ON best_practices FOR SELECT TO authenticated USING (status = 'published' OR author_id = auth.uid() OR is_admin());
CREATE POLICY "best_practices_insert_own" ON best_practices FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "best_practices_update_own_or_admin" ON best_practices FOR UPDATE TO authenticated USING (author_id = auth.uid() OR is_moderator_or_above());
CREATE POLICY "best_practices_delete_own_or_admin" ON best_practices FOR DELETE TO authenticated USING (author_id = auth.uid() OR is_admin());

-- TABLE: courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT NOT NULL,
    difficulty difficulty_level NOT NULL DEFAULT 'beginner',
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    lessons_count INTEGER NOT NULL DEFAULT 0,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    is_published BOOLEAN NOT NULL DEFAULT false,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_published ON courses(is_published) WHERE is_published = true;
CREATE INDEX idx_courses_author ON courses(author_id);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select_published" ON courses FOR SELECT TO authenticated USING (is_published = true OR author_id = auth.uid() OR is_admin());
CREATE POLICY "courses_insert_admin" ON courses FOR INSERT TO authenticated WITH CHECK (is_moderator_or_above());
CREATE POLICY "courses_update_admin" ON courses FOR UPDATE TO authenticated USING (author_id = auth.uid() OR is_admin());
CREATE POLICY "courses_delete_admin" ON courses FOR DELETE TO authenticated USING (is_admin());

-- TABLE: lessons
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type lesson_type NOT NULL DEFAULT 'text',
    order_index INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, order_index);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_select_via_course" ON lessons FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM courses c WHERE c.id = lessons.course_id AND (c.is_published = true OR c.author_id = auth.uid() OR is_admin())));
CREATE POLICY "lessons_insert_admin" ON lessons FOR INSERT TO authenticated WITH CHECK (is_moderator_or_above());
CREATE POLICY "lessons_update_admin" ON lessons FOR UPDATE TO authenticated USING (is_moderator_or_above());
CREATE POLICY "lessons_delete_admin" ON lessons FOR DELETE TO authenticated USING (is_admin());

-- TABLE: community_posts
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type community_post_type NOT NULL DEFAULT 'discussion',
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    views_count INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    ai_evaluation_score INTEGER CHECK (ai_evaluation_score IS NULL OR (ai_evaluation_score >= 0 AND ai_evaluation_score <= 100)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_type ON community_posts(type);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_upvotes ON community_posts(upvotes_count DESC);
CREATE INDEX idx_community_posts_pinned ON community_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_community_posts_tags ON community_posts USING GIN(tags);
CREATE INDEX idx_community_posts_title_trgm ON community_posts USING GIN(title gin_trgm_ops);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_posts_select_all" ON community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "community_posts_insert_own" ON community_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "community_posts_update_own_or_mod" ON community_posts FOR UPDATE TO authenticated USING (author_id = auth.uid() OR is_moderator_or_above());
CREATE POLICY "community_posts_delete_own_or_admin" ON community_posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR is_admin());

-- TABLE: comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(entity_type, entity_id, created_at);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_all" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own" ON comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_update_own" ON comments FOR UPDATE TO authenticated USING (author_id = auth.uid() OR is_moderator_or_above());
CREATE POLICY "comments_delete_own_or_admin" ON comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR is_admin());

-- TABLE: ai_providers
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_key TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    api_endpoint TEXT NOT NULL,
    api_key_encrypted TEXT,
    model TEXT NOT NULL,
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7,
    max_tokens INTEGER NOT NULL DEFAULT 4096,
    top_p DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    fallback_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
    monthly_budget_limit DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ai_providers_updated_at BEFORE UPDATE ON ai_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_ai_providers_active ON ai_providers(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_providers_primary ON ai_providers(is_primary) WHERE is_primary = true;

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_providers_select_admin" ON ai_providers FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "ai_providers_insert_admin" ON ai_providers FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "ai_providers_update_admin" ON ai_providers FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "ai_providers_delete_admin" ON ai_providers FOR DELETE TO authenticated USING (is_admin());

-- TABLE: system_prompts
CREATE TABLE system_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_key TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_prompts_key ON system_prompts(prompt_key);
CREATE INDEX idx_system_prompts_active ON system_prompts(prompt_key, is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_system_prompts_key_version ON system_prompts(prompt_key, version);

ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_prompts_select_admin" ON system_prompts FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "system_prompts_insert_admin" ON system_prompts FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "system_prompts_update_admin" ON system_prompts FOR UPDATE TO authenticated USING (is_admin());

-- TABLE: ai_cost_log
CREATE TABLE ai_cost_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    feature ai_feature_type NOT NULL,
    tokens_input INTEGER NOT NULL DEFAULT 0,
    tokens_output INTEGER NOT NULL DEFAULT 0,
    estimated_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_cost_log_provider ON ai_cost_log(provider_id);
CREATE INDEX idx_ai_cost_log_feature ON ai_cost_log(feature);
CREATE INDEX idx_ai_cost_log_user ON ai_cost_log(user_id);
CREATE INDEX idx_ai_cost_log_created_at ON ai_cost_log(created_at DESC);
CREATE INDEX idx_ai_cost_log_monthly ON ai_cost_log(provider_id, created_at);

ALTER TABLE ai_cost_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_cost_log_select_admin" ON ai_cost_log FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "ai_cost_log_insert_service" ON ai_cost_log FOR INSERT TO authenticated WITH CHECK (true);

-- TABLE: ai_chat_sessions
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Neue Unterhaltung',
    context_type TEXT,
    context_id UUID,
    provider_used TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ai_chat_sessions_updated_at BEFORE UPDATE ON ai_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_updated ON ai_chat_sessions(user_id, updated_at DESC);

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chat_sessions_select_own" ON ai_chat_sessions FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "ai_chat_sessions_insert_own" ON ai_chat_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_chat_sessions_update_own" ON ai_chat_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ai_chat_sessions_delete_own" ON ai_chat_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TABLE: ai_chat_messages
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role chat_message_role NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_session_order ON ai_chat_messages(session_id, created_at);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chat_messages_select_own" ON ai_chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM ai_chat_sessions s WHERE s.id = ai_chat_messages.session_id AND (s.user_id = auth.uid() OR is_admin())));
CREATE POLICY "ai_chat_messages_insert_own" ON ai_chat_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM ai_chat_sessions s WHERE s.id = ai_chat_messages.session_id AND s.user_id = auth.uid()));

-- TABLE: usecase_evaluations
CREATE TABLE usecase_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    evaluator_type evaluator_type NOT NULL DEFAULT 'ai',
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    company_value_score INTEGER CHECK (company_value_score >= 0 AND company_value_score <= 100),
    employee_value_score INTEGER CHECK (employee_value_score >= 0 AND employee_value_score <= 100),
    feasibility_score INTEGER CHECK (feasibility_score >= 0 AND feasibility_score <= 100),
    scalability_score INTEGER CHECK (scalability_score >= 0 AND scalability_score <= 100),
    innovation_score INTEGER CHECK (innovation_score >= 0 AND innovation_score <= 100),
    strengths TEXT,
    risks TEXT,
    roi_estimate TEXT,
    recommendation TEXT,
    next_steps TEXT,
    ai_provider_used TEXT,
    evaluated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usecase_evaluations_idea ON usecase_evaluations(idea_id);
CREATE INDEX idx_usecase_evaluations_type ON usecase_evaluations(evaluator_type);
CREATE INDEX idx_usecase_evaluations_score ON usecase_evaluations(overall_score DESC);

ALTER TABLE usecase_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usecase_evaluations_select_all" ON usecase_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "usecase_evaluations_insert_service" ON usecase_evaluations FOR INSERT TO authenticated WITH CHECK (is_admin() OR evaluator_type = 'ai');
CREATE POLICY "usecase_evaluations_update_admin" ON usecase_evaluations FOR UPDATE TO authenticated USING (is_admin());

-- TABLE: challenges
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type challenge_type NOT NULL DEFAULT 'weekly',
    xp_reward INTEGER NOT NULL DEFAULT 100,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    max_participants INTEGER,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_challenges_active ON challenges(is_active) WHERE is_active = true;
CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_challenges_created_by ON challenges(created_by);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_select_all" ON challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "challenges_insert_mod" ON challenges FOR INSERT TO authenticated WITH CHECK (is_moderator_or_above());
CREATE POLICY "challenges_update_mod" ON challenges FOR UPDATE TO authenticated USING (is_moderator_or_above());
CREATE POLICY "challenges_delete_admin" ON challenges FOR DELETE TO authenticated USING (is_admin());

-- TABLE: user_challenges
CREATE TABLE user_challenges (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, challenge_id)
);

CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge ON user_challenges(challenge_id);

ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_challenges_select_all" ON user_challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_challenges_insert_own" ON user_challenges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_challenges_update_own" ON user_challenges FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_challenges_delete_own" ON user_challenges FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_admin());

-- TABLE: user_course_progress
CREATE TABLE user_course_progress (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed_lessons INTEGER[] DEFAULT '{}',
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, course_id)
);

CREATE INDEX idx_user_course_progress_user ON user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_course ON user_course_progress(course_id);

ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_course_progress_select_own" ON user_course_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_course_progress_insert_own" ON user_course_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_course_progress_update_own" ON user_course_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- TABLE: badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category badge_category NOT NULL DEFAULT 'achievement',
    xp_threshold INTEGER,
    condition TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_key ON badges(key);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select_all" ON badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "badges_insert_admin" ON badges FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "badges_update_admin" ON badges FOR UPDATE TO authenticated USING (is_admin());

-- TABLE: user_badges
CREATE TABLE user_badges (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_select_all" ON user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_badges_insert_service" ON user_badges FOR INSERT TO authenticated WITH CHECK (is_admin() OR user_id = auth.uid());

-- TABLE: notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_service" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TABLE: upvotes
CREATE TABLE upvotes (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX idx_upvotes_entity ON upvotes(entity_type, entity_id);
CREATE INDEX idx_upvotes_user ON upvotes(user_id);

ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upvotes_select_all" ON upvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "upvotes_insert_own" ON upvotes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "upvotes_delete_own" ON upvotes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TABLE: innovation_radar_items
CREATE TABLE innovation_radar_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category radar_category NOT NULL,
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    trend_direction trend_direction NOT NULL DEFAULT 'stable',
    related_posts UUID[] DEFAULT '{}',
    related_experts UUID[] DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER innovation_radar_items_updated_at BEFORE UPDATE ON innovation_radar_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_radar_items_category ON innovation_radar_items(category);
CREATE INDEX idx_radar_items_relevance ON innovation_radar_items(relevance_score DESC);
CREATE INDEX idx_radar_items_trend ON innovation_radar_items(trend_direction);
CREATE INDEX idx_radar_items_created_at ON innovation_radar_items(created_at DESC);
-- NOTE: ivfflat index requires data in the table. Add later with:
-- CREATE INDEX idx_radar_items_embedding ON innovation_radar_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

ALTER TABLE innovation_radar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "radar_items_select_all" ON innovation_radar_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "radar_items_insert_mod" ON innovation_radar_items FOR INSERT TO authenticated WITH CHECK (is_moderator_or_above());
CREATE POLICY "radar_items_update_mod" ON innovation_radar_items FOR UPDATE TO authenticated USING (is_moderator_or_above());
CREATE POLICY "radar_items_delete_admin" ON innovation_radar_items FOR DELETE TO authenticated USING (is_admin());

-- DATABASE FUNCTIONS
CREATE OR REPLACE FUNCTION search_best_practices(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID, title TEXT, excerpt TEXT, category best_practice_category, similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT bp.id, bp.title, bp.excerpt, bp.category, 1 - (bp.embedding <=> query_embedding) AS similarity
    FROM best_practices bp
    WHERE bp.status = 'published' AND bp.embedding IS NOT NULL AND 1 - (bp.embedding <=> query_embedding) > match_threshold
    ORDER BY bp.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INT DEFAULT 20, offset_count INT DEFAULT 0)
RETURNS TABLE (user_id UUID, full_name TEXT, avatar_url TEXT, level INT, xp INT, rank BIGINT, badge_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id AS user_id, p.full_name, p.avatar_url, p.level, p.xp,
        ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.created_at ASC) AS rank,
        (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = p.id) AS badge_count
    FROM profiles p ORDER BY p.xp DESC, p.created_at ASC LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION increment_field(table_name TEXT, row_id UUID, field_name TEXT, increment_by INT DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', table_name, field_name, field_name) USING increment_by, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION award_xp(target_user_id UUID, xp_amount INT)
RETURNS TABLE (new_xp INT, new_level INT, leveled_up BOOLEAN) AS $$
DECLARE
    current_xp INT; current_level INT; calculated_level INT;
BEGIN
    SELECT p.xp, p.level INTO current_xp, current_level FROM profiles p WHERE p.id = target_user_id;
    current_xp := current_xp + xp_amount;
    calculated_level := CASE
        WHEN current_xp >= 5500 THEN 10 WHEN current_xp >= 4000 THEN 9 WHEN current_xp >= 3000 THEN 8
        WHEN current_xp >= 2200 THEN 7 WHEN current_xp >= 1500 THEN 6 WHEN current_xp >= 1000 THEN 5
        WHEN current_xp >= 600 THEN 4 WHEN current_xp >= 300 THEN 3 WHEN current_xp >= 100 THEN 2 ELSE 1
    END;
    UPDATE profiles p SET xp = current_xp, level = calculated_level WHERE p.id = target_user_id;
    RETURN QUERY SELECT current_xp, calculated_level, (calculated_level > current_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_login_streak(target_user_id UUID)
RETURNS TABLE (streak INT, streak_bonus_xp INT) AS $$
DECLARE
    last_login TIMESTAMPTZ; current_streak INT; bonus_xp INT := 0;
BEGIN
    SELECT p.last_login_at, p.streak_days INTO last_login, current_streak FROM profiles p WHERE p.id = target_user_id;
    IF last_login IS NULL OR (NOW() - last_login) > INTERVAL '48 hours' THEN current_streak := 1;
    ELSIF (NOW() - last_login) > INTERVAL '20 hours' THEN current_streak := current_streak + 1;
    END IF;
    IF current_streak > 0 AND current_streak % 7 = 0 THEN bonus_xp := 50; END IF;
    UPDATE profiles p SET streak_days = current_streak, last_login_at = NOW() WHERE p.id = target_user_id;
    RETURN QUERY SELECT current_streak, bonus_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER FUNCTIONS FOR COUNTER MAINTENANCE
CREATE OR REPLACE FUNCTION update_entity_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.entity_type = 'best_practice' THEN UPDATE best_practices SET comments_count = comments_count + 1 WHERE id = NEW.entity_id;
        ELSIF NEW.entity_type = 'community_post' THEN UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.entity_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.entity_type = 'best_practice' THEN UPDATE best_practices SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.entity_id;
        ELSIF OLD.entity_type = 'community_post' THEN UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.entity_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_entity_comments_count();

CREATE OR REPLACE FUNCTION update_entity_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.entity_type = 'best_practice' THEN UPDATE best_practices SET upvotes_count = upvotes_count + 1 WHERE id = NEW.entity_id;
        ELSIF NEW.entity_type = 'community_post' THEN UPDATE community_posts SET upvotes_count = upvotes_count + 1 WHERE id = NEW.entity_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.entity_type = 'best_practice' THEN UPDATE best_practices SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.entity_id;
        ELSIF OLD.entity_type = 'community_post' THEN UPDATE community_posts SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.entity_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_upvote_change AFTER INSERT OR DELETE ON upvotes FOR EACH ROW EXECUTE FUNCTION update_entity_upvotes_count();

CREATE OR REPLACE FUNCTION update_course_lessons_count()
RETURNS TRIGGER AS $$
DECLARE target_course_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN target_course_id := OLD.course_id; ELSE target_course_id := NEW.course_id; END IF;
    UPDATE courses SET lessons_count = (SELECT COUNT(*) FROM lessons WHERE course_id = target_course_id) WHERE id = target_course_id;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lesson_change AFTER INSERT OR DELETE ON lessons FOR EACH ROW EXECUTE FUNCTION update_course_lessons_count();

-- VIEWS
CREATE OR REPLACE VIEW active_challenges_view AS
SELECT c.*, COALESCE(uc.participant_count, 0) AS participant_count
FROM challenges c LEFT JOIN (SELECT challenge_id, COUNT(*) AS participant_count FROM user_challenges GROUP BY challenge_id) uc ON uc.challenge_id = c.id
WHERE c.is_active = true AND c.end_date > NOW() ORDER BY c.start_date;

CREATE OR REPLACE VIEW trending_best_practices_view AS
SELECT bp.id, bp.title, bp.excerpt, bp.category, bp.author_id, p.full_name AS author_name, p.avatar_url AS author_avatar,
    bp.upvotes_count, bp.views_count, bp.comments_count, bp.created_at,
    (bp.upvotes_count * 3 + bp.comments_count * 2 + bp.views_count) AS trending_score
FROM best_practices bp JOIN profiles p ON p.id = bp.author_id
WHERE bp.status = 'published' AND bp.created_at > NOW() - INTERVAL '7 days' ORDER BY trending_score DESC;

CREATE OR REPLACE VIEW monthly_ai_costs_view AS
SELECT ap.provider_key, ap.display_name, acl.feature, DATE_TRUNC('month', acl.created_at) AS month,
    SUM(acl.tokens_input) AS total_tokens_input, SUM(acl.tokens_output) AS total_tokens_output,
    SUM(acl.estimated_cost) AS total_cost, COUNT(*) AS request_count
FROM ai_cost_log acl JOIN ai_providers ap ON ap.id = acl.provider_id
GROUP BY ap.provider_key, ap.display_name, acl.feature, DATE_TRUNC('month', acl.created_at) ORDER BY month DESC, total_cost DESC;

-- ===================== MIGRATION 00002: FEATURE FLAGS =====================

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

CREATE TRIGGER feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_flags_select_all" ON feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "feature_flags_insert_admin" ON feature_flags FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "feature_flags_update_admin" ON feature_flags FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "feature_flags_delete_admin" ON feature_flags FOR DELETE TO authenticated USING (is_admin());

INSERT INTO feature_flags (flag_key, name, description, enabled) VALUES
    ('ai-mentor', 'AI Mentor', 'KI-Chat-Assistent fuer alle Benutzer', true),
    ('usecase-eval', 'Use-Case Bewertung', 'Automatische KI-Bewertung eingereichte Ideen', true),
    ('semantic-search', 'Semantische Suche', 'KI-gestuetzte Suche via pgvector', true),
    ('auto-tagging', 'Auto-Tagging', 'Automatische Verschlagwortung neuer Inhalte', true),
    ('ai-orb', 'AI Orb (Floating Assistant)', 'Persistenter KI-Begleiter auf allen Seiten', true),
    ('gamification', 'Gamification', 'XP-System, Levels und Badges', true);

-- ===================== MIGRATION 00003: SEMANTIC SEARCH =====================

CREATE OR REPLACE FUNCTION match_best_practices(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  match_offset int DEFAULT 0,
  filter_category text DEFAULT NULL,
  filter_tags text[] DEFAULT NULL,
  filter_difficulty text DEFAULT NULL
)
RETURNS TABLE (
  id UUID, title TEXT, content TEXT, excerpt TEXT, category best_practice_category,
  tags TEXT[], ai_tags TEXT[], difficulty TEXT, author_id UUID, author_name TEXT, author_avatar TEXT,
  views_count INTEGER, upvotes_count INTEGER, comments_count INTEGER, similarity FLOAT, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT bp.id, bp.title, bp.content, bp.excerpt, bp.category, bp.tags, bp.ai_tags,
    bp.category::text AS difficulty, bp.author_id, p.full_name AS author_name, p.avatar_url AS author_avatar,
    bp.views_count, bp.upvotes_count, bp.comments_count,
    1 - (bp.embedding <=> query_embedding) AS similarity, bp.created_at
  FROM best_practices bp LEFT JOIN profiles p ON p.id = bp.author_id
  WHERE bp.status = 'published' AND bp.embedding IS NOT NULL AND 1 - (bp.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR bp.category::text = filter_category)
    AND (filter_tags IS NULL OR bp.tags && filter_tags OR bp.ai_tags && filter_tags)
    AND (filter_difficulty IS NULL OR filter_difficulty = ANY(bp.tags))
  ORDER BY bp.embedding <=> query_embedding LIMIT match_count OFFSET match_offset;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION match_best_practices_count(
  query_embedding vector(1536), match_threshold float DEFAULT 0.7,
  filter_category text DEFAULT NULL, filter_tags text[] DEFAULT NULL, filter_difficulty text DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE total INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO total FROM best_practices bp
  WHERE bp.status = 'published' AND bp.embedding IS NOT NULL AND 1 - (bp.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR bp.category::text = filter_category)
    AND (filter_tags IS NULL OR bp.tags && filter_tags OR bp.ai_tags && filter_tags)
    AND (filter_difficulty IS NULL OR filter_difficulty = ANY(bp.tags));
  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================== MIGRATION 00004: LEARN HUB =====================

ALTER TABLE user_course_progress ADD COLUMN IF NOT EXISTS certificate_id UUID UNIQUE DEFAULT NULL;

CREATE TABLE IF NOT EXISTS user_lesson_progress (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quiz_score INTEGER CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 100)),
    PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(completed_at DESC);

ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_lesson_progress_select_own" ON user_lesson_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_lesson_progress_insert_own" ON user_lesson_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_lesson_progress_update_own" ON user_lesson_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_lesson_progress_delete_own" ON user_lesson_progress FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE OR REPLACE FUNCTION update_course_progress_on_lesson_complete()
RETURNS TRIGGER AS $$
DECLARE v_course_id UUID; v_total_lessons INT; v_completed_lessons INT; v_progress INT;
BEGIN
    SELECT course_id INTO v_course_id FROM lessons WHERE id = NEW.lesson_id;
    IF v_course_id IS NULL THEN RETURN NEW; END IF;
    SELECT COUNT(*) INTO v_total_lessons FROM lessons WHERE course_id = v_course_id;
    SELECT COUNT(*) INTO v_completed_lessons FROM user_lesson_progress ulp JOIN lessons l ON l.id = ulp.lesson_id WHERE l.course_id = v_course_id AND ulp.user_id = NEW.user_id;
    IF v_total_lessons > 0 THEN v_progress := ROUND((v_completed_lessons::DECIMAL / v_total_lessons) * 100); ELSE v_progress := 0; END IF;
    INSERT INTO user_course_progress (user_id, course_id, progress_percent, started_at) VALUES (NEW.user_id, v_course_id, v_progress, NOW()) ON CONFLICT (user_id, course_id) DO UPDATE SET progress_percent = v_progress;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lesson_progress_change AFTER INSERT ON user_lesson_progress FOR EACH ROW EXECUTE FUNCTION update_course_progress_on_lesson_complete();

-- =============================================================================
-- ALL MIGRATIONS COMPLETE
-- =============================================================================
