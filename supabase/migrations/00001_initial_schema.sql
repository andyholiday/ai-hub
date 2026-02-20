-- =============================================================================
-- LR AI Hub - Initial Database Schema Migration
-- Version: 00001
-- Date: 2026-02-20
-- Description: Complete database schema for the LR AI Hub platform including
--   all tables, enums, RLS policies, indexes, triggers, and helper functions.
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgvector";        -- Vector embeddings for semantic search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram-based text search

-- =============================================================================
-- 2. CUSTOM TYPES (ENUMS)
-- =============================================================================

CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');

CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE best_practice_category AS ENUM (
    'prompt_engineering',
    'ai_tools',
    'automation',
    'data_analysis',
    'ai_ethics',
    'other'
);

CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

CREATE TYPE lesson_type AS ENUM ('text', 'video', 'quiz', 'interactive');

CREATE TYPE community_post_type AS ENUM (
    'discussion',
    'idea',
    'show_and_tell',
    'question',
    'challenge'
);

CREATE TYPE challenge_type AS ENUM ('weekly', 'monthly', 'special');

CREATE TYPE chat_message_role AS ENUM ('user', 'assistant', 'system');

CREATE TYPE entity_type AS ENUM ('best_practice', 'community_post');

CREATE TYPE notification_type AS ENUM (
    'achievement',
    'comment',
    'like',
    'challenge',
    'system',
    'mention'
);

CREATE TYPE evaluator_type AS ENUM ('ai', 'human');

CREATE TYPE ai_feature_type AS ENUM (
    'mentor_chat',
    'usecase_eval',
    'search',
    'auto_tag',
    'summary'
);

CREATE TYPE radar_category AS ENUM ('tools', 'techniques', 'platforms', 'frameworks');

CREATE TYPE trend_direction AS ENUM ('rising', 'stable', 'declining');

CREATE TYPE badge_category AS ENUM ('achievement', 'skill', 'social', 'special');

-- =============================================================================
-- 3. HELPER FUNCTIONS
-- =============================================================================

-- Trigger function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if the current user is an admin
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

-- Helper function to check if the current user is a moderator or higher
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

-- =============================================================================
-- 4. TABLE: profiles (extends auth.users)
-- =============================================================================

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

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users with platform-specific data';
COMMENT ON COLUMN profiles.xp IS 'Experience points accumulated through platform actions';
COMMENT ON COLUMN profiles.level IS 'Current gamification level (1-10)';
COMMENT ON COLUMN profiles.streak_days IS 'Consecutive days of login activity';

-- Trigger: auto-update updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_level ON profiles(level);
CREATE INDEX idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_username ON profiles(username);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR is_admin());

CREATE POLICY "profiles_delete_admin"
    ON profiles FOR DELETE
    TO authenticated
    USING (is_admin());

-- Auto-create profile on user signup
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 5. TABLE: best_practices
-- =============================================================================

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

COMMENT ON TABLE best_practices IS 'Knowledge base of AI best practices shared by users';
COMMENT ON COLUMN best_practices.embedding IS 'OpenAI/Gemini embedding vector for semantic search (1536 dimensions)';
COMMENT ON COLUMN best_practices.ai_summary IS 'AI-generated summary of the content';
COMMENT ON COLUMN best_practices.ai_tags IS 'AI-generated tags for automatic categorization';

-- Trigger: auto-update updated_at
CREATE TRIGGER best_practices_updated_at
    BEFORE UPDATE ON best_practices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
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

-- Vector similarity search index (IVFFlat for large datasets)
CREATE INDEX idx_best_practices_embedding ON best_practices
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- RLS
ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "best_practices_select_published"
    ON best_practices FOR SELECT
    TO authenticated
    USING (
        status = 'published'
        OR author_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY "best_practices_insert_own"
    ON best_practices FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "best_practices_update_own_or_admin"
    ON best_practices FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() OR is_moderator_or_above());

CREATE POLICY "best_practices_delete_own_or_admin"
    ON best_practices FOR DELETE
    TO authenticated
    USING (author_id = auth.uid() OR is_admin());

-- =============================================================================
-- 6. TABLE: courses
-- =============================================================================

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

COMMENT ON TABLE courses IS 'Learning courses in the Lern-Hub module';

-- Trigger: auto-update updated_at
CREATE TRIGGER courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_published ON courses(is_published) WHERE is_published = true;
CREATE INDEX idx_courses_author ON courses(author_id);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);

-- RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_published"
    ON courses FOR SELECT
    TO authenticated
    USING (is_published = true OR author_id = auth.uid() OR is_admin());

CREATE POLICY "courses_insert_admin"
    ON courses FOR INSERT
    TO authenticated
    WITH CHECK (is_moderator_or_above());

CREATE POLICY "courses_update_admin"
    ON courses FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() OR is_admin());

CREATE POLICY "courses_delete_admin"
    ON courses FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 7. TABLE: lessons
-- =============================================================================

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

COMMENT ON TABLE lessons IS 'Individual lessons within a course';

-- Indexes
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, order_index);

-- RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_select_via_course"
    ON lessons FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = lessons.course_id
            AND (c.is_published = true OR c.author_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY "lessons_insert_admin"
    ON lessons FOR INSERT
    TO authenticated
    WITH CHECK (is_moderator_or_above());

CREATE POLICY "lessons_update_admin"
    ON lessons FOR UPDATE
    TO authenticated
    USING (is_moderator_or_above());

CREATE POLICY "lessons_delete_admin"
    ON lessons FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 8. TABLE: community_posts
-- =============================================================================

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

COMMENT ON TABLE community_posts IS 'Community forum posts including discussions, ideas, questions, and challenges';
COMMENT ON COLUMN community_posts.ai_evaluation_score IS 'AI-generated evaluation score for idea posts (0-100)';

-- Trigger: auto-update updated_at
CREATE TRIGGER community_posts_updated_at
    BEFORE UPDATE ON community_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_type ON community_posts(type);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_upvotes ON community_posts(upvotes_count DESC);
CREATE INDEX idx_community_posts_pinned ON community_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_community_posts_tags ON community_posts USING GIN(tags);
CREATE INDEX idx_community_posts_title_trgm ON community_posts USING GIN(title gin_trgm_ops);

-- RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select_all"
    ON community_posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "community_posts_insert_own"
    ON community_posts FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "community_posts_update_own_or_mod"
    ON community_posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() OR is_moderator_or_above());

CREATE POLICY "community_posts_delete_own_or_admin"
    ON community_posts FOR DELETE
    TO authenticated
    USING (author_id = auth.uid() OR is_admin());

-- =============================================================================
-- 9. TABLE: comments (polymorphic, supports nested threads)
-- =============================================================================

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

COMMENT ON TABLE comments IS 'Polymorphic comments table supporting nested threads on best_practices and community_posts';
COMMENT ON COLUMN comments.entity_type IS 'Type of the parent entity: best_practice or community_post';
COMMENT ON COLUMN comments.entity_id IS 'UUID of the parent entity (best_practice or community_post)';
COMMENT ON COLUMN comments.parent_id IS 'Self-reference for nested/threaded comments';

-- Trigger: auto-update updated_at
CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(entity_type, entity_id, created_at);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_all"
    ON comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "comments_insert_own"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "comments_update_own"
    ON comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() OR is_moderator_or_above());

CREATE POLICY "comments_delete_own_or_admin"
    ON comments FOR DELETE
    TO authenticated
    USING (author_id = auth.uid() OR is_admin());

-- =============================================================================
-- 10. TABLE: ai_providers
-- =============================================================================

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

COMMENT ON TABLE ai_providers IS 'Configuration for AI providers (Gemini, Claude, ChatGPT, Copilot)';
COMMENT ON COLUMN ai_providers.api_key_encrypted IS 'AES-256 encrypted API key - never exposed to frontend';
COMMENT ON COLUMN ai_providers.provider_key IS 'Unique identifier: gemini, claude, chatgpt, copilot';

-- Trigger: auto-update updated_at
CREATE TRIGGER ai_providers_updated_at
    BEFORE UPDATE ON ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_ai_providers_active ON ai_providers(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_providers_primary ON ai_providers(is_primary) WHERE is_primary = true;

-- RLS
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

-- Only admins can see provider configurations (API keys are sensitive)
CREATE POLICY "ai_providers_select_admin"
    ON ai_providers FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "ai_providers_insert_admin"
    ON ai_providers FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "ai_providers_update_admin"
    ON ai_providers FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "ai_providers_delete_admin"
    ON ai_providers FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 11. TABLE: system_prompts
-- =============================================================================

CREATE TABLE system_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_key TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE system_prompts IS 'Versioned system prompts for AI features (mentor, evaluation, tagging, etc.)';
COMMENT ON COLUMN system_prompts.prompt_key IS 'Key identifier: mentor_main, usecase_evaluation, auto_tag, summary';

-- Indexes
CREATE INDEX idx_system_prompts_key ON system_prompts(prompt_key);
CREATE INDEX idx_system_prompts_active ON system_prompts(prompt_key, is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_system_prompts_key_version ON system_prompts(prompt_key, version);

-- RLS
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_prompts_select_admin"
    ON system_prompts FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "system_prompts_insert_admin"
    ON system_prompts FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "system_prompts_update_admin"
    ON system_prompts FOR UPDATE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 12. TABLE: ai_cost_log
-- =============================================================================

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

COMMENT ON TABLE ai_cost_log IS 'Tracking API costs per provider, feature, and user';

-- Indexes
CREATE INDEX idx_ai_cost_log_provider ON ai_cost_log(provider_id);
CREATE INDEX idx_ai_cost_log_feature ON ai_cost_log(feature);
CREATE INDEX idx_ai_cost_log_user ON ai_cost_log(user_id);
CREATE INDEX idx_ai_cost_log_created_at ON ai_cost_log(created_at DESC);
CREATE INDEX idx_ai_cost_log_monthly ON ai_cost_log(provider_id, created_at);

-- RLS
ALTER TABLE ai_cost_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_cost_log_select_admin"
    ON ai_cost_log FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "ai_cost_log_insert_service"
    ON ai_cost_log FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =============================================================================
-- 13. TABLE: ai_chat_sessions
-- =============================================================================

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

COMMENT ON TABLE ai_chat_sessions IS 'AI Mentor chat sessions per user';
COMMENT ON COLUMN ai_chat_sessions.context_type IS 'Optional context: best_practice, course, community_post';
COMMENT ON COLUMN ai_chat_sessions.context_id IS 'UUID of the contextual entity for context-aware AI responses';

-- Trigger: auto-update updated_at
CREATE TRIGGER ai_chat_sessions_updated_at
    BEFORE UPDATE ON ai_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_updated ON ai_chat_sessions(user_id, updated_at DESC);

-- RLS
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_chat_sessions_select_own"
    ON ai_chat_sessions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "ai_chat_sessions_insert_own"
    ON ai_chat_sessions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_chat_sessions_update_own"
    ON ai_chat_sessions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "ai_chat_sessions_delete_own"
    ON ai_chat_sessions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 14. TABLE: ai_chat_messages
-- =============================================================================

CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role chat_message_role NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_chat_messages IS 'Individual messages within AI Mentor chat sessions';

-- Indexes
CREATE INDEX idx_ai_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_session_order ON ai_chat_messages(session_id, created_at);

-- RLS
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_chat_messages_select_own"
    ON ai_chat_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions s
            WHERE s.id = ai_chat_messages.session_id
            AND (s.user_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY "ai_chat_messages_insert_own"
    ON ai_chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions s
            WHERE s.id = ai_chat_messages.session_id
            AND s.user_id = auth.uid()
        )
    );

-- =============================================================================
-- 15. TABLE: usecase_evaluations
-- =============================================================================

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

COMMENT ON TABLE usecase_evaluations IS 'AI and human evaluations of use-case ideas from the community';
COMMENT ON COLUMN usecase_evaluations.idea_id IS 'References a community_post of type idea';

-- Indexes
CREATE INDEX idx_usecase_evaluations_idea ON usecase_evaluations(idea_id);
CREATE INDEX idx_usecase_evaluations_type ON usecase_evaluations(evaluator_type);
CREATE INDEX idx_usecase_evaluations_score ON usecase_evaluations(overall_score DESC);

-- RLS
ALTER TABLE usecase_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usecase_evaluations_select_all"
    ON usecase_evaluations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "usecase_evaluations_insert_service"
    ON usecase_evaluations FOR INSERT
    TO authenticated
    WITH CHECK (is_admin() OR evaluator_type = 'ai');

CREATE POLICY "usecase_evaluations_update_admin"
    ON usecase_evaluations FOR UPDATE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 16. TABLE: challenges
-- =============================================================================

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

COMMENT ON TABLE challenges IS 'Community challenges (weekly, monthly, special events)';

-- Indexes
CREATE INDEX idx_challenges_active ON challenges(is_active) WHERE is_active = true;
CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_challenges_created_by ON challenges(created_by);

-- RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select_all"
    ON challenges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "challenges_insert_mod"
    ON challenges FOR INSERT
    TO authenticated
    WITH CHECK (is_moderator_or_above());

CREATE POLICY "challenges_update_mod"
    ON challenges FOR UPDATE
    TO authenticated
    USING (is_moderator_or_above());

CREATE POLICY "challenges_delete_admin"
    ON challenges FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 17. TABLE: user_challenges (join table)
-- =============================================================================

CREATE TABLE user_challenges (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, challenge_id)
);

COMMENT ON TABLE user_challenges IS 'Tracks user participation and progress in challenges';

-- Indexes
CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge ON user_challenges(challenge_id);

-- RLS
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_challenges_select_all"
    ON user_challenges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "user_challenges_insert_own"
    ON user_challenges FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_challenges_update_own"
    ON user_challenges FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "user_challenges_delete_own"
    ON user_challenges FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- =============================================================================
-- 18. TABLE: user_course_progress
-- =============================================================================

CREATE TABLE user_course_progress (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed_lessons INTEGER[] DEFAULT '{}',
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, course_id)
);

COMMENT ON TABLE user_course_progress IS 'Tracks user progress through courses';
COMMENT ON COLUMN user_course_progress.completed_lessons IS 'Array of completed lesson order_index values';

-- Indexes
CREATE INDEX idx_user_course_progress_user ON user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_course ON user_course_progress(course_id);

-- RLS
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_course_progress_select_own"
    ON user_course_progress FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "user_course_progress_insert_own"
    ON user_course_progress FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_course_progress_update_own"
    ON user_course_progress FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 19. TABLE: badges
-- =============================================================================

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

COMMENT ON TABLE badges IS 'Definition of all available badges/achievements';
COMMENT ON COLUMN badges.key IS 'Unique string key for programmatic access (e.g. first-steps, prompt-engineer)';
COMMENT ON COLUMN badges.condition IS 'Human-readable condition description for earning the badge';

-- Indexes
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_key ON badges(key);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_all"
    ON badges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "badges_insert_admin"
    ON badges FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "badges_update_admin"
    ON badges FOR UPDATE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 20. TABLE: user_badges (join table)
-- =============================================================================

CREATE TABLE user_badges (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

COMMENT ON TABLE user_badges IS 'Tracks which badges users have earned';

-- Indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_all"
    ON user_badges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "user_badges_insert_service"
    ON user_badges FOR INSERT
    TO authenticated
    WITH CHECK (is_admin() OR user_id = auth.uid());

-- =============================================================================
-- 21. TABLE: notifications
-- =============================================================================

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

COMMENT ON TABLE notifications IS 'User notifications for achievements, comments, likes, etc.';

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_service"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
    ON notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 22. TABLE: upvotes (polymorphic)
-- =============================================================================

CREATE TABLE upvotes (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, entity_type, entity_id)
);

COMMENT ON TABLE upvotes IS 'Polymorphic upvotes for best_practices and community_posts (one vote per user per entity)';

-- Indexes
CREATE INDEX idx_upvotes_entity ON upvotes(entity_type, entity_id);
CREATE INDEX idx_upvotes_user ON upvotes(user_id);

-- RLS
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upvotes_select_all"
    ON upvotes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "upvotes_insert_own"
    ON upvotes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "upvotes_delete_own"
    ON upvotes FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 23. TABLE: innovation_radar_items
-- =============================================================================

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

COMMENT ON TABLE innovation_radar_items IS 'Innovation Radar entries tracking AI tools, techniques, platforms, and frameworks';
COMMENT ON COLUMN innovation_radar_items.related_posts IS 'Array of community_post UUIDs related to this radar item';
COMMENT ON COLUMN innovation_radar_items.related_experts IS 'Array of profile UUIDs identified as experts on this topic';

-- Trigger: auto-update updated_at
CREATE TRIGGER innovation_radar_items_updated_at
    BEFORE UPDATE ON innovation_radar_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_radar_items_category ON innovation_radar_items(category);
CREATE INDEX idx_radar_items_relevance ON innovation_radar_items(relevance_score DESC);
CREATE INDEX idx_radar_items_trend ON innovation_radar_items(trend_direction);
CREATE INDEX idx_radar_items_created_at ON innovation_radar_items(created_at DESC);

-- Vector similarity search index for radar items
CREATE INDEX idx_radar_items_embedding ON innovation_radar_items
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- RLS
ALTER TABLE innovation_radar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "radar_items_select_all"
    ON innovation_radar_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "radar_items_insert_mod"
    ON innovation_radar_items FOR INSERT
    TO authenticated
    WITH CHECK (is_moderator_or_above());

CREATE POLICY "radar_items_update_mod"
    ON innovation_radar_items FOR UPDATE
    TO authenticated
    USING (is_moderator_or_above());

CREATE POLICY "radar_items_delete_admin"
    ON innovation_radar_items FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================================================
-- 24. DATABASE FUNCTIONS
-- =============================================================================

-- Function: Semantic search over best practices
CREATE OR REPLACE FUNCTION search_best_practices(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    excerpt TEXT,
    category best_practice_category,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bp.id,
        bp.title,
        bp.excerpt,
        bp.category,
        1 - (bp.embedding <=> query_embedding) AS similarity
    FROM best_practices bp
    WHERE bp.status = 'published'
        AND bp.embedding IS NOT NULL
        AND 1 - (bp.embedding <=> query_embedding) > match_threshold
    ORDER BY bp.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
    limit_count INT DEFAULT 20,
    offset_count INT DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    level INT,
    xp INT,
    rank BIGINT,
    badge_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.full_name,
        p.avatar_url,
        p.level,
        p.xp,
        ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.created_at ASC) AS rank,
        (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = p.id) AS badge_count
    FROM profiles p
    ORDER BY p.xp DESC, p.created_at ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Increment field (for atomic counter updates)
CREATE OR REPLACE FUNCTION increment_field(
    table_name TEXT,
    row_id UUID,
    field_name TEXT,
    increment_by INT DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'UPDATE %I SET %I = %I + $1 WHERE id = $2',
        table_name, field_name, field_name
    ) USING increment_by, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Award XP to a user and recalculate level
CREATE OR REPLACE FUNCTION award_xp(
    target_user_id UUID,
    xp_amount INT
)
RETURNS TABLE (new_xp INT, new_level INT, leveled_up BOOLEAN) AS $$
DECLARE
    current_xp INT;
    current_level INT;
    calculated_level INT;
BEGIN
    -- Get current state
    SELECT p.xp, p.level INTO current_xp, current_level
    FROM profiles p
    WHERE p.id = target_user_id;

    -- Calculate new XP
    current_xp := current_xp + xp_amount;

    -- Calculate new level based on XP thresholds
    -- Matches the LEVELS constant from gamification.ts
    calculated_level := CASE
        WHEN current_xp >= 5500 THEN 10
        WHEN current_xp >= 4000 THEN 9
        WHEN current_xp >= 3000 THEN 8
        WHEN current_xp >= 2200 THEN 7
        WHEN current_xp >= 1500 THEN 6
        WHEN current_xp >= 1000 THEN 5
        WHEN current_xp >= 600  THEN 4
        WHEN current_xp >= 300  THEN 3
        WHEN current_xp >= 100  THEN 2
        ELSE 1
    END;

    -- Update profile
    UPDATE profiles p
    SET xp = current_xp, level = calculated_level
    WHERE p.id = target_user_id;

    -- Return results
    RETURN QUERY SELECT current_xp, calculated_level, (calculated_level > current_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update login streak
CREATE OR REPLACE FUNCTION update_login_streak(target_user_id UUID)
RETURNS TABLE (streak INT, streak_bonus_xp INT) AS $$
DECLARE
    last_login TIMESTAMPTZ;
    current_streak INT;
    bonus_xp INT := 0;
BEGIN
    SELECT p.last_login_at, p.streak_days INTO last_login, current_streak
    FROM profiles p
    WHERE p.id = target_user_id;

    IF last_login IS NULL OR (NOW() - last_login) > INTERVAL '48 hours' THEN
        -- Streak broken or first login
        current_streak := 1;
    ELSIF (NOW() - last_login) > INTERVAL '20 hours' THEN
        -- New day login (between 20h and 48h since last)
        current_streak := current_streak + 1;
    END IF;
    -- If less than 20 hours, do not increment (same-day login)

    -- Award streak bonus every 7 days
    IF current_streak > 0 AND current_streak % 7 = 0 THEN
        bonus_xp := 50;
    END IF;

    -- Update profile
    UPDATE profiles p
    SET
        streak_days = current_streak,
        last_login_at = NOW()
    WHERE p.id = target_user_id;

    RETURN QUERY SELECT current_streak, bonus_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 25. TRIGGER FUNCTIONS FOR COUNTER MAINTENANCE
-- =============================================================================

-- Trigger function: Update comments_count on best_practices when a comment is added/removed
CREATE OR REPLACE FUNCTION update_entity_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.entity_type = 'best_practice' THEN
            UPDATE best_practices SET comments_count = comments_count + 1 WHERE id = NEW.entity_id;
        ELSIF NEW.entity_type = 'community_post' THEN
            UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.entity_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.entity_type = 'best_practice' THEN
            UPDATE best_practices SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.entity_id;
        ELSIF OLD.entity_type = 'community_post' THEN
            UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.entity_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_entity_comments_count();

-- Trigger function: Update upvotes_count on entities when upvote is added/removed
CREATE OR REPLACE FUNCTION update_entity_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.entity_type = 'best_practice' THEN
            UPDATE best_practices SET upvotes_count = upvotes_count + 1 WHERE id = NEW.entity_id;
        ELSIF NEW.entity_type = 'community_post' THEN
            UPDATE community_posts SET upvotes_count = upvotes_count + 1 WHERE id = NEW.entity_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.entity_type = 'best_practice' THEN
            UPDATE best_practices SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.entity_id;
        ELSIF OLD.entity_type = 'community_post' THEN
            UPDATE community_posts SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.entity_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_upvote_change
    AFTER INSERT OR DELETE ON upvotes
    FOR EACH ROW
    EXECUTE FUNCTION update_entity_upvotes_count();

-- Trigger function: Update lessons_count on courses when lessons change
CREATE OR REPLACE FUNCTION update_course_lessons_count()
RETURNS TRIGGER AS $$
DECLARE
    target_course_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_course_id := OLD.course_id;
    ELSE
        target_course_id := NEW.course_id;
    END IF;

    UPDATE courses
    SET lessons_count = (
        SELECT COUNT(*) FROM lessons WHERE course_id = target_course_id
    )
    WHERE id = target_course_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lesson_change
    AFTER INSERT OR DELETE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_course_lessons_count();

-- =============================================================================
-- 26. VIEWS
-- =============================================================================

-- View: Active challenges with participant count
CREATE OR REPLACE VIEW active_challenges_view AS
SELECT
    c.*,
    COALESCE(uc.participant_count, 0) AS participant_count
FROM challenges c
LEFT JOIN (
    SELECT challenge_id, COUNT(*) AS participant_count
    FROM user_challenges
    GROUP BY challenge_id
) uc ON uc.challenge_id = c.id
WHERE c.is_active = true
    AND c.end_date > NOW()
ORDER BY c.start_date;

-- View: Trending best practices (last 7 days)
CREATE OR REPLACE VIEW trending_best_practices_view AS
SELECT
    bp.id,
    bp.title,
    bp.excerpt,
    bp.category,
    bp.author_id,
    p.full_name AS author_name,
    p.avatar_url AS author_avatar,
    bp.upvotes_count,
    bp.views_count,
    bp.comments_count,
    bp.created_at,
    (bp.upvotes_count * 3 + bp.comments_count * 2 + bp.views_count) AS trending_score
FROM best_practices bp
JOIN profiles p ON p.id = bp.author_id
WHERE bp.status = 'published'
    AND bp.created_at > NOW() - INTERVAL '7 days'
ORDER BY trending_score DESC;

-- View: Monthly AI cost summary
CREATE OR REPLACE VIEW monthly_ai_costs_view AS
SELECT
    ap.provider_key,
    ap.display_name,
    acl.feature,
    DATE_TRUNC('month', acl.created_at) AS month,
    SUM(acl.tokens_input) AS total_tokens_input,
    SUM(acl.tokens_output) AS total_tokens_output,
    SUM(acl.estimated_cost) AS total_cost,
    COUNT(*) AS request_count
FROM ai_cost_log acl
JOIN ai_providers ap ON ap.id = acl.provider_id
GROUP BY ap.provider_key, ap.display_name, acl.feature, DATE_TRUNC('month', acl.created_at)
ORDER BY month DESC, total_cost DESC;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
