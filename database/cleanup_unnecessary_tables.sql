-- CLEANUP UNNECESSARY TABLES
-- This script removes redundant/unused tables to optimize your database

-- =====================================
-- STEP 1: CHECK WHAT TABLES EXIST
-- =====================================
-- Run this first to see what tables you have
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================
-- STEP 2: REMOVE REDUNDANT TABLES
-- =====================================
-- Run this section to remove unnecessary tables

-- Remove duplicate discount/coupon system (keep promo_codes, remove discount_codes)
DROP TABLE IF EXISTS discount_redemptions CASCADE;
DROP TABLE IF EXISTS discount_codes CASCADE;

-- Remove Stripe product management tables (manage products in Stripe dashboard instead)
DROP TABLE IF EXISTS stripe_prices CASCADE;
DROP TABLE IF EXISTS stripe_products CASCADE;

-- Remove materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS monthly_usage_summary CASCADE;

-- Remove redundant subscription events table (keep stripe_webhook_events for audit)
DROP TABLE IF EXISTS subscription_events CASCADE;

-- Remove feature_usage table if it exists (redundant with analytics_events)
DROP TABLE IF EXISTS feature_usage CASCADE;

-- =====================================
-- STEP 3: CHECK REMAINING TABLES
-- =====================================
-- Run this to verify cleanup
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================
-- STEP 4: CLEAN UP ORPHANED FUNCTIONS
-- =====================================
-- Remove functions that were related to deleted tables

-- Drop functions related to monthly usage summary
DROP FUNCTION IF EXISTS refresh_monthly_usage_summary();

-- Drop functions related to old subscription system
DROP FUNCTION IF EXISTS process_stripe_webhook(varchar, varchar, jsonb);
DROP FUNCTION IF EXISTS create_stripe_customer(uuid, varchar, varchar);
DROP FUNCTION IF EXISTS can_access_premium_features(uuid);

-- =====================================
-- FINAL VERIFICATION
-- =====================================
-- Your remaining tables should be:

-- CORE TABLES (keep these):
-- • users                    - Core user accounts with subscription info
-- • usage_tracking           - Usage tracking with anonymous support
-- • lessons                  - Generated lesson plans  
-- • payment_attempts         - Payment tracking
-- • stripe_webhook_events    - Webhook audit log
-- • analytics_events         - User behavior tracking

-- FEATURE TABLES (keep these):
-- • promo_codes              - Promotional codes system
-- • promo_code_uses          - Promo code usage tracking
-- • newsletter_signups       - Email newsletter signups

-- Run this final check:
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'usage_tracking', 'lessons', 'payment_attempts', 'stripe_webhook_events', 'analytics_events') THEN 'CORE TABLE - Keep'
        WHEN table_name IN ('promo_codes', 'promo_code_uses', 'newsletter_signups') THEN 'FEATURE TABLE - Keep'
        ELSE 'UNKNOWN - Review'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY 
    CASE 
        WHEN table_name IN ('users', 'usage_tracking', 'lessons', 'payment_attempts', 'stripe_webhook_events', 'analytics_events') THEN 1
        WHEN table_name IN ('promo_codes', 'promo_code_uses', 'newsletter_signups') THEN 2
        ELSE 3
    END,
    table_name;

-- =====================================
-- NOTES
-- =====================================

-- Tables that were REMOVED (redundant/unnecessary):
-- ❌ discount_codes & discount_redemptions  - Duplicate of promo_codes system
-- ❌ stripe_products & stripe_prices         - Better managed in Stripe dashboard
-- ❌ monthly_usage_summary                   - Materialized view not needed for simple usage
-- ❌ subscription_events                     - Redundant with stripe_webhook_events  
-- ❌ feature_usage                           - Redundant with analytics_events

-- Tables that are KEPT (useful):
-- ✅ users                    - Essential for account management
-- ✅ usage_tracking           - Essential for freemium limits
-- ✅ lessons                  - Essential for storing generated content
-- ✅ payment_attempts         - Useful for payment analytics
-- ✅ stripe_webhook_events    - Essential for webhook audit trail
-- ✅ analytics_events         - Useful for conversion tracking
-- ✅ promo_codes              - Useful promotional system
-- ✅ promo_code_uses          - Tracks promo code usage
-- ✅ newsletter_signups       - Useful for email marketing

-- Your database is now optimized with only necessary tables!