-- Fix RLS policies to allow anonymous usage tracking
-- Migration 003: Anonymous usage policies

-- Drop existing restrictive policies
DROP POLICY IF EXISTS usage_tracking_policy ON usage_tracking;
DROP POLICY IF EXISTS feature_usage_policy ON feature_usage;
DROP POLICY IF EXISTS analytics_events_policy ON analytics_events;

-- Create new policies that allow anonymous usage tracking
-- Usage tracking: allow authenticated users to see their own data, allow anonymous inserts
CREATE POLICY usage_tracking_select_policy ON usage_tracking 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY usage_tracking_insert_policy ON usage_tracking 
    FOR INSERT WITH CHECK (true); -- Allow all inserts for anonymous tracking

CREATE POLICY usage_tracking_update_policy ON usage_tracking 
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Feature usage: allow authenticated users to see their own data, allow anonymous inserts  
CREATE POLICY feature_usage_select_policy ON feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY feature_usage_insert_policy ON feature_usage
    FOR INSERT WITH CHECK (true); -- Allow all inserts for anonymous tracking

-- Analytics events: allow authenticated users to see their own data, allow anonymous inserts
CREATE POLICY analytics_events_select_policy ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY analytics_events_insert_policy ON analytics_events
    FOR INSERT WITH CHECK (true); -- Allow all inserts for anonymous tracking

-- Update lessons policy to allow anonymous lesson creation
DROP POLICY IF EXISTS lessons_policy ON lessons;

CREATE POLICY lessons_select_policy ON lessons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY lessons_insert_policy ON lessons
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY lessons_update_policy ON lessons
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions for anonymous usage
GRANT INSERT ON usage_tracking TO anon;
GRANT INSERT ON feature_usage TO anon;
GRANT INSERT ON analytics_events TO anon;
GRANT INSERT ON lessons TO anon;
GRANT SELECT ON usage_tracking TO anon;