-- Fix RLS Policies for Anonymous Lesson Creation
-- This script fixes the 401 Unauthorized errors when saving lessons

-- =====================================
-- CURRENT ISSUE: RLS policies are blocking anonymous lesson inserts
-- SOLUTION: Allow anonymous users to insert lessons (for freemium model)
-- =====================================

-- First, check current policies on lessons table
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'lessons';

-- Drop existing restrictive policies on lessons table
DROP POLICY IF EXISTS lessons_select_policy ON lessons;
DROP POLICY IF EXISTS lessons_insert_policy ON lessons;
DROP POLICY IF EXISTS lessons_update_policy ON lessons;
DROP POLICY IF EXISTS lessons_delete_policy ON lessons;

-- Create new policies that allow anonymous lesson creation (freemium model)

-- SELECT: Users can see their own lessons + anonymous lessons are visible to anyone
CREATE POLICY lessons_select_policy ON lessons FOR SELECT USING (
    -- Authenticated users see their own lessons
    (auth.uid()::text = user_id::text) OR
    -- Anonymous lessons are visible to everyone (for freemium)
    (user_id IS NULL) OR
    -- Users can see lessons associated with their email
    (auth.email() = user_email)
);

-- INSERT: Allow anyone (including anonymous) to insert lessons
CREATE POLICY lessons_insert_policy ON lessons FOR INSERT WITH CHECK (
    -- Anyone can insert lessons (critical for freemium model)
    true
);

-- UPDATE: Users can only update their own lessons
CREATE POLICY lessons_update_policy ON lessons FOR UPDATE USING (
    -- Authenticated users can update their own lessons
    (auth.uid()::text = user_id::text) OR
    -- Users can update lessons associated with their email
    (auth.email() = user_email)
);

-- DELETE: Users can only delete their own lessons
CREATE POLICY lessons_delete_policy ON lessons FOR DELETE USING (
    -- Authenticated users can delete their own lessons
    (auth.uid()::text = user_id::text) OR
    -- Users can delete lessons associated with their email
    (auth.email() = user_email)
);

-- =====================================
-- Grant necessary permissions for anonymous users
-- =====================================

-- Ensure anonymous users can insert into lessons table
GRANT INSERT ON lessons TO anon;
GRANT SELECT ON lessons TO anon;

-- Ensure authenticated users have full access
GRANT ALL ON lessons TO authenticated;

-- =====================================
-- Test the policies work
-- =====================================

-- This should work now (anonymous insert):
-- INSERT INTO lessons (title, subject, grade_level, topic, activity_type, duration, content, user_email)
-- VALUES ('Test Anonymous Lesson', 'Math', '5th Grade', 'Addition', 'Worksheet', 30, 'Test content', 'anonymous@test.com');

-- =====================================
-- NOTES
-- =====================================

-- Why we allow anonymous inserts:
-- 1. Freemium model requires anonymous users to generate lessons
-- 2. Anonymous lessons can be claimed later when user creates account
-- 3. We track usage via fingerprinting and email for conversion
-- 4. This enables the "try before you buy" experience

-- Security considerations:
-- - Anonymous lessons are public (acceptable for freemium)
-- - We can add rate limiting at application level
-- - Lessons are educational content, not sensitive data
-- - Users must authenticate to modify/delete lessons

COMMENT ON TABLE lessons IS 'Lessons table with anonymous insert support for freemium model';

-- Verify policies are active
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual as policy_condition
FROM pg_policies 
WHERE tablename = 'lessons'
ORDER BY cmd, policyname;