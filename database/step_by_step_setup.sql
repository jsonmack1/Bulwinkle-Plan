-- STEP-BY-STEP DATABASE SETUP
-- Run each section separately to avoid errors

-- =====================================
-- STEP 1: ENABLE EXTENSIONS
-- =====================================
-- Run this first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- STEP 2: CREATE CORE USERS TABLE
-- =====================================
-- Run this section

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
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users (subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

-- =====================================
-- STEP 3: CREATE USAGE TRACKING TABLE
-- =====================================
-- Run this section

CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Time period tracking
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    year INTEGER NOT NULL,
    
    -- Usage counters
    lesson_count INTEGER DEFAULT 0,
    premium_feature_attempts INTEGER DEFAULT 0,
    
    -- Anonymous tracking
    fingerprint_hash VARCHAR(64),
    ip_hash VARCHAR(64),
    
    -- Timestamps
    first_use_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_use_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate tracking
    UNIQUE(user_id, month, fingerprint_hash, ip_hash)
);

-- Add indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking (user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month ON usage_tracking (month);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_fingerprint ON usage_tracking (fingerprint_hash);

-- =====================================
-- STEP 4: CREATE LESSONS TABLE
-- =====================================
-- Run this section

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for lessons
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON lessons (user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons (created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_grade ON lessons (subject, grade_level);

-- =====================================
-- STEP 5: CREATE STRIPE WEBHOOK EVENTS TABLE
-- =====================================
-- Run this section

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Processing status
    processed_status VARCHAR(20) DEFAULT 'pending' CHECK (processed_status IN ('pending', 'processed', 'failed', 'ignored')),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Associated user (if applicable)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for stripe webhook events
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status ON stripe_webhook_events (processed_status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_received ON stripe_webhook_events (received_at);

-- =====================================
-- STEP 6: CREATE ANALYTICS TABLES
-- =====================================
-- Run this section

CREATE TABLE IF NOT EXISTS payment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe data
    stripe_payment_intent_id VARCHAR(255),
    stripe_session_id VARCHAR(255),
    
    -- Payment details
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL,
    failure_reason VARCHAR(255),
    
    -- Context
    subscription_tier VARCHAR(20),
    billing_cycle VARCHAR(20),
    
    -- Tracking
    fingerprint_hash VARCHAR(64),
    ip_hash VARCHAR(64),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User tracking (nullable for anonymous)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Event details
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_properties JSONB,
    
    -- Context
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    user_agent TEXT,
    
    -- Tracking
    fingerprint_hash VARCHAR(64),
    ip_hash VARCHAR(64),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON payment_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts (status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON payment_attempts (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events (created_at);

-- =====================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- =====================================
-- Run this section

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to safely create user by email (for webhook)
CREATE OR REPLACE FUNCTION create_user_by_email(
    p_email VARCHAR(255),
    p_name VARCHAR(255) DEFAULT NULL,
    p_stripe_customer_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_name VARCHAR(255);
BEGIN
    -- Use email as name if name not provided
    v_name := COALESCE(p_name, split_part(p_email, '@', 1));
    
    -- Insert user
    INSERT INTO users (email, name, stripe_customer_id, created_at, updated_at)
    VALUES (p_email, v_name, p_stripe_customer_id, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, users.name),
        stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, users.stripe_customer_id),
        updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(check_user_id UUID)
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

-- =====================================
-- STEP 8: ADD TRIGGERS
-- =====================================
-- Run this section

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- =====================================
-- Run this section

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- =====================================
-- STEP 10: CREATE SECURITY POLICIES
-- =====================================
-- Run this section

-- Users policies
CREATE POLICY users_select_policy ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Usage tracking policies (allow anonymous inserts)
CREATE POLICY usage_tracking_select_policy ON usage_tracking FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY usage_tracking_insert_policy ON usage_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY usage_tracking_update_policy ON usage_tracking FOR UPDATE USING (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Lessons policies (allow anonymous lesson creation for freemium)
CREATE POLICY lessons_select_policy ON lessons FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY lessons_insert_policy ON lessons FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);
CREATE POLICY lessons_update_policy ON lessons FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Payment attempts policies
CREATE POLICY payment_attempts_select_policy ON payment_attempts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY payment_attempts_insert_policy ON payment_attempts FOR INSERT WITH CHECK (true);

-- Stripe webhook events policies (admin only - no user access needed)
CREATE POLICY stripe_webhook_events_admin_policy ON stripe_webhook_events FOR ALL USING (false);

-- Analytics events policies (allow anonymous inserts)
CREATE POLICY analytics_events_select_policy ON analytics_events FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY analytics_events_insert_policy ON analytics_events FOR INSERT WITH CHECK (true);

-- =====================================
-- STEP 11: GRANT PERMISSIONS
-- =====================================
-- Run this section

-- Grant permissions for anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON usage_tracking TO anon;
GRANT INSERT ON analytics_events TO anon;
GRANT INSERT ON lessons TO anon;
GRANT SELECT ON usage_tracking TO anon;

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON usage_tracking TO authenticated;
GRANT ALL ON lessons TO authenticated;
GRANT ALL ON payment_attempts TO authenticated;
GRANT ALL ON analytics_events TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_by_email TO authenticated;

-- =====================================
-- STEP 12: ADD SAMPLE DATA (OPTIONAL)
-- =====================================
-- Run this section (optional)

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

-- =====================================
-- DONE!
-- =====================================
-- Your database is now set up and ready to handle subscription users correctly.