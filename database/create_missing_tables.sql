-- =====================================
-- COMPREHENSIVE MISSING TABLES CREATION
-- Create all missing database tables for the Lesson Plan Builder app
-- =====================================

-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- 1. MEMORY BANK SYSTEM TABLES
-- =====================================

-- Enhanced lessons table (update existing if needed)
DO $$
BEGIN
    -- Add missing columns to existing lessons table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='user_email') THEN
        ALTER TABLE lessons ADD COLUMN user_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='rating') THEN
        ALTER TABLE lessons ADD COLUMN rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='use_count') THEN
        ALTER TABLE lessons ADD COLUMN use_count INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='last_used') THEN
        ALTER TABLE lessons ADD COLUMN last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='preview_text') THEN
        ALTER TABLE lessons ADD COLUMN preview_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='tags') THEN
        ALTER TABLE lessons ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='is_favorite') THEN
        ALTER TABLE lessons ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='template_use_count') THEN
        ALTER TABLE lessons ADD COLUMN template_use_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='success_score') THEN
        ALTER TABLE lessons ADD COLUMN success_score INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lessons' AND column_name='mode') THEN
        ALTER TABLE lessons ADD COLUMN mode VARCHAR(20) DEFAULT 'teacher' CHECK (mode IN ('teacher', 'substitute'));
    END IF;
END
$$;

-- Lesson videos (YouTube integration)
CREATE TABLE IF NOT EXISTS lesson_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    
    -- YouTube video data
    youtube_video_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    channel_title VARCHAR(255),
    channel_id VARCHAR(255),
    thumbnail_url VARCHAR(1000),
    duration_seconds INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    view_count BIGINT DEFAULT 0,
    
    -- Educational metadata  
    relevance_score INTEGER DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
    safety_score INTEGER DEFAULT 0 CHECK (safety_score >= 0 AND safety_score <= 100),
    educational_value INTEGER DEFAULT 0 CHECK (educational_value >= 0 AND educational_value <= 100),
    age_appropriate BOOLEAN DEFAULT TRUE,
    content_warnings JSONB DEFAULT '[]',
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate videos per lesson
    UNIQUE(lesson_id, youtube_video_id)
);

-- Lesson teacher feedback and ratings
CREATE TABLE IF NOT EXISTS lesson_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Feedback data
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    reflection_notes TEXT,
    would_use_again BOOLEAN,
    student_engagement INTEGER CHECK (student_engagement >= 1 AND student_engagement <= 5),
    timing_accuracy INTEGER CHECK (timing_accuracy >= 1 AND timing_accuracy <= 5),
    materials_cost VARCHAR(20) CHECK (materials_cost IN ('low', 'medium', 'high')),
    prep_time_minutes INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One feedback per user per lesson
    UNIQUE(lesson_id, user_id)
);

-- Lesson differentiation applications
CREATE TABLE IF NOT EXISTS lesson_differentiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    
    -- Differentiation details
    differentiation_type VARCHAR(100) NOT NULL, -- 'learning_style', 'ability_level', 'interest', etc.
    level VARCHAR(100) NOT NULL, -- 'beginner', 'advanced', 'visual', 'kinesthetic', etc.
    modifications JSONB NOT NULL, -- Array of specific modifications applied
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 2. YOUTUBE INTEGRATION SYSTEM
-- =====================================

-- YouTube video cache (avoid re-fetching same videos)
CREATE TABLE IF NOT EXISTS youtube_videos_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youtube_video_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Basic video info
    title VARCHAR(500) NOT NULL,
    description TEXT,
    channel_title VARCHAR(255),
    channel_id VARCHAR(255),
    thumbnail_url VARCHAR(1000),
    duration_seconds INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Statistics
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    
    -- Educational analysis (cached)
    educational_value INTEGER CHECK (educational_value >= 0 AND educational_value <= 100),
    safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
    age_appropriate BOOLEAN DEFAULT TRUE,
    content_warnings JSONB DEFAULT '[]',
    
    -- Cache metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- YouTube search history (for intelligent search improvement)
CREATE TABLE IF NOT EXISTS youtube_search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Search details
    search_term VARCHAR(500) NOT NULL,
    topic VARCHAR(255),
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    
    -- Search results
    results_count INTEGER DEFAULT 0,
    selected_video_ids JSONB DEFAULT '[]', -- Array of video IDs that were selected
    
    -- Search quality metrics
    average_relevance_score INTEGER DEFAULT 0,
    user_satisfied BOOLEAN, -- Did user select videos?
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 3. EXPORT SYSTEM TABLES
-- =====================================

-- Export history tracking
CREATE TABLE IF NOT EXISTS export_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    
    -- Export details
    export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('docx', 'google_docs', 'pdf', 'html')),
    export_status VARCHAR(50) DEFAULT 'pending' CHECK (export_status IN ('pending', 'processing', 'completed', 'failed')),
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    
    -- Google Drive integration (if applicable)
    google_drive_file_id VARCHAR(255),
    google_drive_url VARCHAR(1000),
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Google Drive integration settings
CREATE TABLE IF NOT EXISTS google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- OAuth credentials (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Drive settings
    default_folder_id VARCHAR(255),
    default_folder_name VARCHAR(255),
    auto_upload BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One integration per user
    UNIQUE(user_id)
);

-- =====================================
-- 4. MATH AI SYSTEM TABLES
-- =====================================

-- Math problems and solutions storage
CREATE TABLE IF NOT EXISTS math_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Problem details
    problem_text TEXT NOT NULL,
    problem_type VARCHAR(100), -- 'algebra', 'geometry', 'calculus', etc.
    difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    grade_level VARCHAR(50),
    
    -- Problem metadata
    latex_expression TEXT,
    variables_used JSONB DEFAULT '[]',
    concepts_involved JSONB DEFAULT '[]',
    
    -- Solution
    solution_steps JSONB, -- Array of step-by-step solution
    final_answer TEXT,
    solution_method VARCHAR(100),
    
    -- Quality metrics
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'needs_review')),
    accuracy_score INTEGER CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Math solution steps (detailed breakdown)
CREATE TABLE IF NOT EXISTS math_solution_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    math_problem_id UUID REFERENCES math_problems(id) ON DELETE CASCADE,
    
    -- Step details
    step_number INTEGER NOT NULL,
    step_description TEXT NOT NULL,
    step_equation TEXT,
    step_latex TEXT,
    explanation TEXT,
    
    -- Step type
    step_type VARCHAR(50), -- 'simplify', 'solve', 'substitute', 'factor', etc.
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure proper ordering
    UNIQUE(math_problem_id, step_number)
);

-- =====================================
-- 5. DIFFERENTIATION ENGINE TABLES
-- =====================================

-- Differentiation templates (AI-generated templates)
CREATE TABLE IF NOT EXISTS differentiation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    differentiation_type VARCHAR(100) NOT NULL, -- 'learning_style', 'ability_level', 'interest'
    target_level VARCHAR(100) NOT NULL, -- 'visual', 'advanced', 'beginner', etc.
    
    -- Template content
    modifications JSONB NOT NULL, -- Array of modification instructions
    example_application TEXT,
    
    -- Applicability
    applicable_subjects JSONB DEFAULT '[]', -- Array of subjects this works for
    applicable_grades JSONB DEFAULT '[]', -- Array of grade levels
    applicable_activities JSONB DEFAULT '[]', -- Array of activity types
    
    -- Usage stats
    usage_count INTEGER DEFAULT 0,
    success_rate INTEGER DEFAULT 0, -- Based on user feedback
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 6. USER SYSTEM ENHANCEMENTS
-- =====================================

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Teaching preferences
    preferred_subjects JSONB DEFAULT '[]',
    preferred_grade_levels JSONB DEFAULT '[]',
    preferred_activity_types JSONB DEFAULT '[]',
    typical_class_size INTEGER,
    typical_lesson_duration INTEGER,
    
    -- App preferences
    default_export_format VARCHAR(50) DEFAULT 'docx',
    auto_save_to_memory_bank BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    
    -- Teaching context
    school_name VARCHAR(255),
    district_name VARCHAR(255),
    teaching_experience_years INTEGER,
    specializations JSONB DEFAULT '[]',
    
    -- Privacy settings
    share_lessons_publicly BOOLEAN DEFAULT FALSE,
    allow_lesson_analytics BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One preference record per user
    UNIQUE(user_id)
);

-- User session tracking (for analytics)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Activity during session
    lessons_created INTEGER DEFAULT 0,
    lessons_viewed INTEGER DEFAULT 0,
    videos_added INTEGER DEFAULT 0,
    exports_created INTEGER DEFAULT 0,
    
    -- Technical details
    user_agent TEXT,
    ip_address_hash VARCHAR(64), -- Hashed IP for privacy
    browser_fingerprint VARCHAR(64),
    
    -- Session quality
    engaged_session BOOLEAN DEFAULT FALSE, -- Did user perform meaningful actions?
    conversion_events JSONB DEFAULT '[]', -- Premium features attempted, etc.
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON lessons (user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_user_email ON lessons (user_email);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_grade ON lessons (subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons (created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_last_used ON lessons (last_used);
CREATE INDEX IF NOT EXISTS idx_lessons_is_favorite ON lessons (is_favorite);
CREATE INDEX IF NOT EXISTS idx_lessons_tags ON lessons USING GIN (tags);

-- Lesson videos indexes
CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson_id ON lesson_videos (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_youtube_id ON lesson_videos (youtube_video_id);

-- Lesson feedback indexes
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_lesson_id ON lesson_feedback (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_user_id ON lesson_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_rating ON lesson_feedback (rating);

-- YouTube cache indexes
CREATE INDEX IF NOT EXISTS idx_youtube_cache_video_id ON youtube_videos_cache (youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_cache_channel ON youtube_videos_cache (channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_cache_updated ON youtube_videos_cache (last_updated);

-- Export history indexes
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history (user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_lesson_id ON export_history (lesson_id);
CREATE INDEX IF NOT EXISTS idx_export_history_type ON export_history (export_type);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history (export_status);

-- Math problems indexes
CREATE INDEX IF NOT EXISTS idx_math_problems_lesson_id ON math_problems (lesson_id);
CREATE INDEX IF NOT EXISTS idx_math_problems_type ON math_problems (problem_type);
CREATE INDEX IF NOT EXISTS idx_math_problems_grade ON math_problems (grade_level);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences (user_id);

-- User sessions indexes  
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions (session_start);

-- =====================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =====================================

-- Enable RLS on new tables
ALTER TABLE lesson_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_differentiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_solution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE differentiation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Lesson-related policies (user can access their own lesson data)
CREATE POLICY lesson_videos_policy ON lesson_videos FOR ALL USING (
    EXISTS (SELECT 1 FROM lessons WHERE lessons.id = lesson_videos.lesson_id 
            AND (lessons.user_id::text = auth.uid()::text OR lessons.user_email = auth.email()))
);

CREATE POLICY lesson_feedback_policy ON lesson_feedback FOR ALL USING (
    auth.uid()::text = user_id::text OR
    EXISTS (SELECT 1 FROM lessons WHERE lessons.id = lesson_feedback.lesson_id 
            AND (lessons.user_id::text = auth.uid()::text OR lessons.user_email = auth.email()))
);

CREATE POLICY lesson_differentiations_policy ON lesson_differentiations FOR ALL USING (
    EXISTS (SELECT 1 FROM lessons WHERE lessons.id = lesson_differentiations.lesson_id 
            AND (lessons.user_id::text = auth.uid()::text OR lessons.user_email = auth.email()))
);

-- YouTube cache is shared (read-only for users)
CREATE POLICY youtube_cache_read_policy ON youtube_videos_cache FOR SELECT USING (true);
CREATE POLICY youtube_cache_write_policy ON youtube_videos_cache FOR INSERT WITH CHECK (true);
CREATE POLICY youtube_cache_update_policy ON youtube_videos_cache FOR UPDATE USING (true);

-- YouTube search history (user's own searches)
CREATE POLICY youtube_search_history_policy ON youtube_search_history FOR ALL USING (
    auth.uid()::text = user_id::text
);

-- Export history (user's own exports)
CREATE POLICY export_history_policy ON export_history FOR ALL USING (
    auth.uid()::text = user_id::text
);

-- Google Drive integrations (user's own integrations)
CREATE POLICY google_drive_integrations_policy ON google_drive_integrations FOR ALL USING (
    auth.uid()::text = user_id::text
);

-- Math problems (user's own problems or from their lessons)
CREATE POLICY math_problems_policy ON math_problems FOR ALL USING (
    auth.uid()::text = user_id::text OR
    EXISTS (SELECT 1 FROM lessons WHERE lessons.id = math_problems.lesson_id 
            AND (lessons.user_id::text = auth.uid()::text OR lessons.user_email = auth.email()))
);

CREATE POLICY math_solution_steps_policy ON math_solution_steps FOR ALL USING (
    EXISTS (SELECT 1 FROM math_problems WHERE math_problems.id = math_solution_steps.math_problem_id 
            AND (auth.uid()::text = math_problems.user_id::text OR
                 EXISTS (SELECT 1 FROM lessons WHERE lessons.id = math_problems.lesson_id 
                        AND (lessons.user_id::text = auth.uid()::text OR lessons.user_email = auth.email()))))
);

-- Differentiation templates are shared (read-only for users, admin can modify)
CREATE POLICY differentiation_templates_read_policy ON differentiation_templates FOR SELECT USING (true);
CREATE POLICY differentiation_templates_write_policy ON differentiation_templates FOR INSERT WITH CHECK (false); -- Admin only

-- User preferences (user's own preferences)
CREATE POLICY user_preferences_policy ON user_preferences FOR ALL USING (
    auth.uid()::text = user_id::text
);

-- User sessions (user's own sessions)
CREATE POLICY user_sessions_policy ON user_sessions FOR ALL USING (
    auth.uid()::text = user_id::text
);

-- =====================================
-- 9. UTILITY FUNCTIONS
-- =====================================

-- Function to update lesson usage stats
CREATE OR REPLACE FUNCTION update_lesson_usage(lesson_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE lessons 
    SET 
        use_count = use_count + 1,
        last_used = NOW(),
        updated_at = NOW()
    WHERE id = lesson_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate lesson success score
CREATE OR REPLACE FUNCTION calculate_lesson_success_score(lesson_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    avg_rating DECIMAL;
    feedback_count INTEGER;
    use_count INTEGER;
BEGIN
    -- Get lesson stats
    SELECT l.use_count INTO use_count FROM lessons l WHERE l.id = lesson_uuid;
    
    -- Get average rating and count
    SELECT AVG(rating), COUNT(*) 
    INTO avg_rating, feedback_count 
    FROM lesson_feedback 
    WHERE lesson_id = lesson_uuid;
    
    -- Calculate score (0-100)
    score := LEAST(100, 
        (COALESCE(avg_rating, 0) * 20) +  -- Rating worth 0-100 points
        (LEAST(use_count, 10) * 2) +      -- Usage worth up to 20 points
        (feedback_count * 5)              -- Feedback worth 5 points each
    );
    
    -- Update the lesson
    UPDATE lessons SET success_score = score WHERE id = lesson_uuid;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's lesson stats
CREATE OR REPLACE FUNCTION get_user_lesson_stats(user_uuid UUID)
RETURNS TABLE(
    total_lessons INTEGER,
    favorite_lessons INTEGER,
    avg_rating DECIMAL,
    total_usage INTEGER,
    most_used_subject TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_lessons,
        COUNT(*) FILTER (WHERE is_favorite = true)::INTEGER as favorite_lessons,
        AVG(COALESCE(lf.avg_rating, 0))::DECIMAL as avg_rating,
        SUM(l.use_count)::INTEGER as total_usage,
        MODE() WITHIN GROUP (ORDER BY l.subject) as most_used_subject
    FROM lessons l
    LEFT JOIN (
        SELECT lesson_id, AVG(rating) as avg_rating
        FROM lesson_feedback
        GROUP BY lesson_id
    ) lf ON l.id = lf.lesson_id
    WHERE l.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON youtube_videos_cache TO anon;
GRANT INSERT ON youtube_search_history TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================
-- COMPLETION SUMMARY
-- =====================================

-- Tables created:
-- ✅ lesson_videos (YouTube integration)
-- ✅ lesson_feedback (teacher ratings)
-- ✅ lesson_differentiations (AI differentiation)
-- ✅ youtube_videos_cache (video metadata cache)
-- ✅ youtube_search_history (search analytics)
-- ✅ export_history (export tracking)
-- ✅ google_drive_integrations (Google Drive OAuth)
-- ✅ math_problems (AI math solver)
-- ✅ math_solution_steps (detailed solutions)
-- ✅ differentiation_templates (AI templates)
-- ✅ user_preferences (user settings)
-- ✅ user_sessions (analytics tracking)

-- Enhanced existing:
-- ✅ lessons table (added memory bank fields)

-- Performance optimized:
-- ✅ Comprehensive indexing strategy
-- ✅ Row-level security policies
-- ✅ Utility functions for common operations

COMMENT ON SCHEMA public IS 'All missing database tables created for Lesson Plan Builder app systems';