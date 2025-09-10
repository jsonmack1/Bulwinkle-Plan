-- Enhanced Subscription Tracking Migration
-- Adds comprehensive fields to track both paid and promo subscriptions

-- Add new subscription tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free'; -- 'free', 'paid', 'promo'
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_source TEXT; -- promo code or 'payment'
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_price_id TEXT; -- Stripe price ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_amount_cents INTEGER DEFAULT 0; -- Amount in cents
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_currency TEXT DEFAULT 'usd'; -- Currency

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_source ON users(subscription_source);
CREATE INDEX IF NOT EXISTS idx_users_stripe_price_id ON users(stripe_price_id);

-- Create subscription_events table for detailed tracking
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'checkout_completed', 'subscription_created', 'subscription_updated', etc.
  event_data JSONB NOT NULL, -- Detailed event data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for subscription_events
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

-- Create view for easy subscription status checking
CREATE OR REPLACE VIEW subscription_status_view AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.subscription_status,
  u.subscription_type,
  u.subscription_source,
  u.current_plan,
  u.subscription_start_date,
  u.subscription_end_date,
  u.subscription_cancel_at_period_end,
  u.stripe_subscription_id,
  u.stripe_customer_id,
  u.stripe_price_id,
  u.subscription_amount_cents,
  u.subscription_currency,
  CASE 
    WHEN u.subscription_status = 'premium' AND u.subscription_end_date > now() THEN true
    ELSE false
  END as is_currently_premium,
  CASE
    WHEN u.subscription_end_date IS NOT NULL THEN 
      EXTRACT(days FROM (u.subscription_end_date - now()))::INTEGER
    ELSE NULL
  END as days_remaining,
  CASE
    WHEN u.subscription_source IS NOT NULL AND u.subscription_source != 'payment' THEN true
    ELSE false
  END as is_promo_subscription,
  u.created_at,
  u.updated_at
FROM users u;

-- Grant access to the view
GRANT SELECT ON subscription_status_view TO authenticated;
GRANT SELECT ON subscription_status_view TO anon;

-- Update existing premium users to have proper subscription_type
UPDATE users 
SET 
  subscription_type = CASE 
    WHEN subscription_status = 'premium' THEN 'paid'
    ELSE 'free'
  END,
  subscription_source = CASE
    WHEN subscription_status = 'premium' THEN 'payment'
    ELSE NULL
  END
WHERE subscription_type IS NULL OR subscription_type = 'free';

-- Add helpful comments
COMMENT ON COLUMN users.subscription_type IS 'Type of subscription: free, paid, promo';
COMMENT ON COLUMN users.subscription_source IS 'Source of subscription: payment, promo code, or null for free';
COMMENT ON COLUMN users.stripe_price_id IS 'Stripe price ID for the subscription';
COMMENT ON COLUMN users.subscription_amount_cents IS 'Subscription amount in cents';
COMMENT ON COLUMN users.subscription_currency IS 'Subscription currency (usd, eur, etc.)';

COMMENT ON TABLE subscription_events IS 'Detailed log of all subscription-related events';
COMMENT ON VIEW subscription_status_view IS 'Comprehensive view of user subscription status with calculated fields';

-- Create function to get subscription summary
CREATE OR REPLACE FUNCTION get_subscription_summary()
RETURNS TABLE (
  subscription_type TEXT,
  count BIGINT,
  total_revenue_cents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.subscription_type,
    COUNT(*)::BIGINT,
    SUM(COALESCE(u.subscription_amount_cents, 0))::BIGINT
  FROM users u
  WHERE u.subscription_type IS NOT NULL
  GROUP BY u.subscription_type
  ORDER BY u.subscription_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_subscription_summary() TO authenticated;

-- Verify the migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN subscription_type = 'premium' THEN 1 END) as premium_users,
  COUNT(CASE WHEN subscription_type = 'promo' THEN 1 END) as promo_users,
  COUNT(CASE WHEN subscription_type = 'free' THEN 1 END) as free_users
FROM users;