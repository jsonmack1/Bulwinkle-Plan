-- Peabody Freemium System Database Schema
-- Migration 001: Core freemium system setup

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with subscription information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Subscription fields
    subscription_status VARCHAR(20) DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
    
    -- Stripe integration fields
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Plan details
    current_plan VARCHAR(20) DEFAULT 'free' CHECK (current_plan IN ('free', 'monthly', 'annual')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    
    -- Trial and grace period (for future use)
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    grace_period_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Usage tracking table with multi-layer protection against circumvention
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User association (nullable for anonymous users)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Time period tracking
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    year INTEGER NOT NULL,
    
    -- Usage counters
    lesson_count INTEGER DEFAULT 0,
    premium_feature_attempts INTEGER DEFAULT 0,
    
    -- Anti-circumvention measures
    fingerprint_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of browser fingerprint
    ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of IP address
    user_agent_hash VARCHAR(64), -- SHA-256 hash of user agent
    session_token VARCHAR(255), -- Optional session tracking
    
    -- Metadata
    first_use_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_use_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint to prevent duplicate tracking
    UNIQUE(user_id, month, fingerprint_hash, ip_hash)
);

-- Lessons table (enhanced existing structure)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User association (nullable for anonymous users)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Lesson content
    title VARCHAR(255),
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    duration INTEGER, -- in minutes
    content TEXT NOT NULL,
    
    -- Classification
    is_premium_feature BOOLEAN DEFAULT FALSE,
    lesson_mode VARCHAR(20) DEFAULT 'teacher' CHECK (lesson_mode IN ('teacher', 'substitute')),
    
    -- Usage tracking association
    usage_tracking_id UUID REFERENCES usage_tracking(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription events log for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'subscription_created', 'subscription_cancelled', 'payment_succeeded', etc.
    event_data JSONB, -- Flexible storage for event-specific data
    
    -- Stripe data
    stripe_event_id VARCHAR(255),
    stripe_object_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature usage analytics
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Feature tracking
    feature_name VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50), -- 'generation', 'differentiation', 'memory_bank', etc.
    action VARCHAR(50) NOT NULL, -- 'attempted', 'completed', 'blocked'
    
    -- Context
    lesson_id UUID REFERENCES lessons(id),
    metadata JSONB, -- Additional context data
    
    -- Anti-circumvention
    fingerprint_hash VARCHAR(64),
    ip_hash VARCHAR(64),
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events for conversion funnel
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User tracking (nullable for anonymous)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255), -- For anonymous user tracking
    
    -- Event details
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_properties JSONB,
    
    -- Context
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    user_agent TEXT,
    
    -- Anti-circumvention
    fingerprint_hash VARCHAR(64),
    ip_hash VARCHAR(64),
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes separately after table creation
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month ON usage_tracking (month);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON usage_tracking (user_id, month);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_fingerprint ON usage_tracking (fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_ip ON usage_tracking (ip_hash);

CREATE INDEX IF NOT EXISTS idx_lessons_user ON lessons (user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons (created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_grade ON lessons (subject, grade_level);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events (user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events (event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe ON subscription_events (stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user ON feature_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage (feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_date ON feature_usage (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events (created_at);

-- Monthly usage summary view (for performance)
CREATE MATERIALIZED VIEW monthly_usage_summary AS
SELECT 
    user_id,
    month,
    SUM(lesson_count) as total_lessons,
    COUNT(DISTINCT fingerprint_hash) as unique_fingerprints,
    COUNT(DISTINCT ip_hash) as unique_ips,
    MIN(first_use_at) as first_use,
    MAX(last_use_at) as last_use
FROM usage_tracking 
WHERE user_id IS NOT NULL
GROUP BY user_id, month;

-- Index for the materialized view
CREATE UNIQUE INDEX idx_monthly_usage_summary ON monthly_usage_summary (user_id, month);

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh monthly usage summary (call from cron job)
CREATE OR REPLACE FUNCTION refresh_monthly_usage_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_usage_summary;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_policy ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY usage_tracking_policy ON usage_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY lessons_policy ON lessons FOR ALL USING (auth.uid() = user_id);
CREATE POLICY subscription_events_policy ON subscription_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY feature_usage_policy ON feature_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY analytics_events_policy ON analytics_events FOR ALL USING (auth.uid() = user_id);

-- Function to get current user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
    is_premium BOOLEAN,
    subscription_status VARCHAR(20),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (u.subscription_status = 'premium') as is_premium,
        u.subscription_status,
        u.subscription_end_date,
        CASE 
            WHEN u.subscription_end_date IS NULL THEN NULL
            ELSE EXTRACT(days FROM (u.subscription_end_date - NOW()))::INTEGER
        END as days_remaining
    FROM users u 
    WHERE u.id = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage for current month
CREATE OR REPLACE FUNCTION get_current_month_usage(
    check_user_id UUID DEFAULT auth.uid(),
    check_fingerprint_hash VARCHAR(64) DEFAULT NULL,
    check_ip_hash VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE(
    lesson_count INTEGER,
    remaining_lessons INTEGER,
    is_over_limit BOOLEAN
) AS $$
DECLARE
    current_month VARCHAR(7) := to_char(NOW(), 'YYYY-MM');
    total_usage INTEGER := 0;
    free_limit INTEGER := 3;
BEGIN
    -- Get usage count considering multiple tracking methods
    SELECT COALESCE(SUM(ut.lesson_count), 0)
    INTO total_usage
    FROM usage_tracking ut
    WHERE ut.month = current_month
    AND (
        ut.user_id = check_user_id 
        OR (check_user_id IS NULL AND ut.fingerprint_hash = check_fingerprint_hash)
        OR (check_user_id IS NULL AND ut.ip_hash = check_ip_hash)
    );
    
    RETURN QUERY
    SELECT 
        total_usage as lesson_count,
        GREATEST(0, free_limit - total_usage) as remaining_lessons,
        (total_usage >= free_limit) as is_over_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default admin user (for development)
INSERT INTO users (
    id, 
    email, 
    name, 
    subscription_status, 
    current_plan
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@peabody.app',
    'Admin User',
    'premium',
    'annual'
) ON CONFLICT (email) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user accounts with subscription information';
COMMENT ON TABLE usage_tracking IS 'Multi-layered usage tracking to prevent circumvention';
COMMENT ON TABLE lessons IS 'Generated lesson plans with premium feature tracking';
COMMENT ON TABLE subscription_events IS 'Audit log of subscription-related events';
COMMENT ON TABLE feature_usage IS 'Detailed analytics of feature usage and blocking';
COMMENT ON TABLE analytics_events IS 'Conversion funnel and user behavior analytics';