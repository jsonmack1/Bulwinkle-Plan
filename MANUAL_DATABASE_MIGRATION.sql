-- Manual Database Migration for Enhanced Subscription Tracking
-- Copy and paste this into Supabase SQL Editor

-- Add new subscription tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_amount_cents INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_currency TEXT DEFAULT 'usd';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_source ON users(subscription_source);
CREATE INDEX IF NOT EXISTS idx_users_stripe_price_id ON users(stripe_price_id);

-- Create subscription_events table for detailed tracking
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for subscription_events
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

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

-- Check current users
SELECT 
  email,
  subscription_status,
  subscription_type,
  subscription_source,
  stripe_subscription_id,
  subscription_end_date,
  created_at
FROM users 
ORDER BY updated_at DESC 
LIMIT 10;