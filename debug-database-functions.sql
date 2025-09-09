-- Debug database functions for promo codes
-- Run this to check if functions exist and work

-- 1. Check if functions exist
SELECT 
    proname as function_name,
    pronargs as num_args,
    proargtypes::regtype[] as arg_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname LIKE '%promo%'
ORDER BY proname;

-- 2. Test the is_promo_code_valid function directly with simple parameters
SELECT * FROM is_promo_code_valid('TELESCOPE2025');

-- 3. Test with all NULL parameters (this should work)
SELECT * FROM is_promo_code_valid('TELESCOPE2025', NULL, NULL);

-- 4. Test with a user ID (this might fail)
-- SELECT * FROM is_promo_code_valid('TELESCOPE2025', 'test_user', NULL);

-- 5. Check if promo_code_uses table exists and is accessible
SELECT COUNT(*) as total_uses FROM promo_code_uses;

-- 6. Check promo_codes table
SELECT code, active, max_uses_per_user FROM promo_codes WHERE code = 'TELESCOPE2025';

-- 7. Test a simple query that the function would do
-- SELECT COUNT(*) FROM promo_code_uses WHERE user_id = 'test_user';