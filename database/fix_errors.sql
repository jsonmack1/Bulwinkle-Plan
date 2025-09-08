-- FIX FOR THE THREE ERRORS YOU ENCOUNTERED
-- Run these sections to fix the specific issues

-- =====================================
-- FIX 1: DROP AND RECREATE FUNCTIONS
-- =====================================
-- Run this to fix the function parameter defaults error

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_subscription_status(uuid);
DROP FUNCTION IF EXISTS create_user_by_email(varchar, varchar, varchar);

-- Recreate the functions properly
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
-- FIX 2: DROP AND RECREATE POLICIES
-- =====================================
-- Run this to fix the existing policies error

-- Drop existing policies first
DROP POLICY IF EXISTS usage_tracking_select_policy ON usage_tracking;
DROP POLICY IF EXISTS usage_tracking_insert_policy ON usage_tracking;
DROP POLICY IF EXISTS usage_tracking_update_policy ON usage_tracking;

DROP POLICY IF EXISTS lessons_select_policy ON lessons;
DROP POLICY IF EXISTS lessons_insert_policy ON lessons;
DROP POLICY IF EXISTS lessons_update_policy ON lessons;

DROP POLICY IF EXISTS payment_attempts_select_policy ON payment_attempts;
DROP POLICY IF EXISTS payment_attempts_insert_policy ON payment_attempts;

DROP POLICY IF EXISTS analytics_events_select_policy ON analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_policy ON analytics_events;

-- Recreate the policies
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

-- Analytics events policies (allow anonymous inserts)
CREATE POLICY analytics_events_select_policy ON analytics_events FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY analytics_events_insert_policy ON analytics_events FOR INSERT WITH CHECK (true);

-- =====================================
-- FIX 3: GRANT PERMISSIONS ON FUNCTIONS
-- =====================================
-- Run this to fix the function permissions

-- Grant execute permissions on functions (now that they exist)
GRANT EXECUTE ON FUNCTION get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_by_email(VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- Also grant to service role for webhook usage
GRANT EXECUTE ON FUNCTION create_user_by_email(VARCHAR, VARCHAR, VARCHAR) TO service_role;

-- =====================================
-- VERIFICATION
-- =====================================
-- Run this to verify everything is working

-- Test the create_user_by_email function
SELECT create_user_by_email('test@example.com', 'Test User', 'cus_test123');

-- Check if the user was created
SELECT email, name, stripe_customer_id FROM users WHERE email = 'test@example.com';

-- Clean up test user (optional)
DELETE FROM users WHERE email = 'test@example.com';