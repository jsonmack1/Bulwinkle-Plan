-- Fix promo code table permissions
-- This should resolve the 500 error when validating promo codes

-- Grant necessary permissions on promo_code_uses table
GRANT SELECT ON promo_code_uses TO anon;
GRANT SELECT ON promo_code_uses TO authenticated;

-- Grant permissions to execute the RPC functions
GRANT EXECUTE ON FUNCTION is_promo_code_valid(VARCHAR, VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION is_promo_code_valid(VARCHAR, VARCHAR, VARCHAR) TO authenticated;

GRANT EXECUTE ON FUNCTION apply_promo_code(VARCHAR, VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION apply_promo_code(VARCHAR, VARCHAR, VARCHAR, INTEGER, VARCHAR, VARCHAR, JSONB) TO authenticated;

-- Verify permissions
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('promo_codes', 'promo_code_uses')
ORDER BY table_name, grantee;