-- Migration 002: Stripe Integration Tables and Functions
-- Additional tables and functions specifically for Stripe payment processing

-- Stripe products and prices (for managing different subscription tiers)
CREATE TABLE IF NOT EXISTS stripe_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_product_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Product details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'monthly', 'annual')),
    
    -- Pricing
    price_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    billing_interval VARCHAR(20) CHECK (billing_interval IN ('month', 'year')),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_stripe_products_tier (tier),
    INDEX idx_stripe_products_active (is_active)
);

-- Stripe price objects (one product can have multiple prices)
CREATE TABLE IF NOT EXISTS stripe_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_product_id VARCHAR(255) NOT NULL,
    
    -- Price details
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('month', 'year')),
    billing_interval_count INTEGER DEFAULT 1,
    
    -- Special pricing
    is_promotional BOOLEAN DEFAULT FALSE,
    promotional_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    FOREIGN KEY (stripe_product_id) REFERENCES stripe_products(stripe_product_id),
    
    -- Indexes
    INDEX idx_stripe_prices_product (stripe_product_id),
    INDEX idx_stripe_prices_active (is_active)
);

-- Stripe webhook events log for debugging and audit
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
    
    -- Metadata
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_stripe_webhook_events_type (event_type),
    INDEX idx_stripe_webhook_events_status (processed_status),
    INDEX idx_stripe_webhook_events_received (received_at)
);

-- Payment attempts and failures for analytics
CREATE TABLE IF NOT EXISTS payment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe data
    stripe_payment_intent_id VARCHAR(255),
    stripe_session_id VARCHAR(255),
    
    -- Attempt details
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    payment_method_type VARCHAR(50),
    
    -- Status
    status VARCHAR(50) NOT NULL, -- 'succeeded', 'failed', 'canceled', 'processing'
    failure_reason VARCHAR(255),
    
    -- Context
    subscription_tier VARCHAR(20),
    billing_cycle VARCHAR(20),
    
    -- Anti-fraud
    fingerprint_hash VARCHAR(64),
    ip_hash VARCHAR(64),
    user_agent_hash VARCHAR(64),
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_payment_attempts_user (user_id),
    INDEX idx_payment_attempts_status (status),
    INDEX idx_payment_attempts_created (created_at)
);

-- Coupon and discount codes
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Code details
    code VARCHAR(50) UNIQUE NOT NULL,
    stripe_coupon_id VARCHAR(255) UNIQUE,
    
    -- Discount details
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'amount')),
    discount_value INTEGER NOT NULL, -- percentage (1-100) or cents
    
    -- Usage limits
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    
    -- Validity period
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Target audience
    new_users_only BOOLEAN DEFAULT FALSE,
    minimum_amount_cents INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id), -- Admin who created the code
    
    -- Indexes
    INDEX idx_discount_codes_code (code),
    INDEX idx_discount_codes_active (is_active),
    INDEX idx_discount_codes_valid (valid_from, valid_until)
);

-- Discount code redemptions
CREATE TABLE IF NOT EXISTS discount_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Redemption details
    amount_saved_cents INTEGER NOT NULL,
    original_amount_cents INTEGER NOT NULL,
    final_amount_cents INTEGER NOT NULL,
    
    -- Stripe data
    stripe_subscription_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    
    -- Metadata
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate redemptions
    UNIQUE(discount_code_id, user_id),
    
    -- Indexes
    INDEX idx_discount_redemptions_user (user_id),
    INDEX idx_discount_redemptions_code (discount_code_id)
);

-- Function to process Stripe webhook events
CREATE OR REPLACE FUNCTION process_stripe_webhook(
    event_id VARCHAR(255),
    event_type VARCHAR(100),
    event_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    customer_id VARCHAR(255);
    subscription_id VARCHAR(255);
    target_user_id UUID;
    price_id VARCHAR(255);
    subscription_status VARCHAR(50);
    current_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Extract common data
    customer_id := event_data->>'customer';
    subscription_id := event_data->'data'->'object'->>'id';
    
    -- Find the user by Stripe customer ID
    SELECT id INTO target_user_id 
    FROM users 
    WHERE stripe_customer_id = customer_id;
    
    -- Process different event types
    CASE event_type
        WHEN 'customer.subscription.created' THEN
            -- New subscription created
            subscription_status := event_data->'data'->'object'->>'status';
            current_period_end := to_timestamp((event_data->'data'->'object'->>'current_period_end')::integer);
            price_id := event_data->'data'->'object'->'items'->'data'->0->>'price';
            
            UPDATE users SET
                stripe_subscription_id = subscription_id,
                subscription_status = CASE 
                    WHEN subscription_status = 'active' THEN 'premium'
                    ELSE 'free'
                END,
                subscription_start_date = NOW(),
                subscription_end_date = current_period_end,
                current_plan = CASE 
                    WHEN price_id LIKE '%annual%' OR price_id LIKE '%year%' THEN 'annual'
                    ELSE 'monthly'
                END,
                updated_at = NOW()
            WHERE id = target_user_id;
            
        WHEN 'customer.subscription.updated' THEN
            -- Subscription updated (plan change, renewal, etc.)
            subscription_status := event_data->'data'->'object'->>'status';
            current_period_end := to_timestamp((event_data->'data'->'object'->>'current_period_end')::integer);
            
            UPDATE users SET
                subscription_status = CASE 
                    WHEN subscription_status = 'active' THEN 'premium'
                    ELSE 'free'
                END,
                subscription_end_date = current_period_end,
                subscription_cancel_at_period_end = (event_data->'data'->'object'->>'cancel_at_period_end')::boolean,
                updated_at = NOW()
            WHERE id = target_user_id;
            
        WHEN 'customer.subscription.deleted' THEN
            -- Subscription cancelled/deleted
            UPDATE users SET
                subscription_status = 'free',
                current_plan = 'free',
                stripe_subscription_id = NULL,
                subscription_end_date = NOW(),
                updated_at = NOW()
            WHERE id = target_user_id;
            
        WHEN 'invoice.payment_succeeded' THEN
            -- Payment successful - extend subscription
            current_period_end := to_timestamp((event_data->'data'->'object'->>'current_period_end')::integer);
            
            UPDATE users SET
                subscription_status = 'premium',
                subscription_end_date = current_period_end,
                updated_at = NOW()
            WHERE id = target_user_id;
            
        WHEN 'invoice.payment_failed' THEN
            -- Payment failed - may need to downgrade after grace period
            -- For now, just log the event
            INSERT INTO subscription_events (user_id, event_type, event_data, stripe_event_id)
            VALUES (target_user_id, event_type, event_data, event_id);
            
        ELSE
            -- Unhandled event type - just log it
            INSERT INTO subscription_events (user_id, event_type, event_data, stripe_event_id)
            VALUES (target_user_id, event_type, event_data, event_id);
    END CASE;
    
    -- Log the subscription event
    INSERT INTO subscription_events (user_id, event_type, event_data, stripe_event_id)
    VALUES (target_user_id, event_type, event_data, event_id);
    
    -- Mark webhook as processed
    UPDATE stripe_webhook_events 
    SET processed_status = 'processed', processed_at = NOW()
    WHERE stripe_event_id = event_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Mark webhook as failed
        UPDATE stripe_webhook_events 
        SET 
            processed_status = 'failed', 
            processed_at = NOW(),
            error_message = SQLERRM,
            retry_count = retry_count + 1
        WHERE stripe_event_id = event_id;
        
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update Stripe customer
CREATE OR REPLACE FUNCTION create_stripe_customer(
    user_id_param UUID,
    stripe_customer_id_param VARCHAR(255),
    email_param VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET 
        stripe_customer_id = stripe_customer_id_param,
        updated_at = NOW()
    WHERE id = user_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access premium features
CREATE OR REPLACE FUNCTION can_access_premium_features(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_status VARCHAR(20);
    sub_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT subscription_status, subscription_end_date
    INTO user_status, sub_end_date
    FROM users 
    WHERE id = check_user_id;
    
    -- Check if user exists and has premium status
    IF user_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check subscription status and end date
    RETURN (
        user_status = 'premium' AND 
        (sub_end_date IS NULL OR sub_end_date > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default Stripe products (adjust pricing as needed)
INSERT INTO stripe_products (
    stripe_product_id, 
    name, 
    description, 
    tier, 
    price_cents, 
    currency,
    billing_interval
) VALUES 
(
    'prod_peabody_monthly',
    'Peabody Teacher Pro - Monthly',
    'Unlimited lesson plans with premium features',
    'monthly',
    999, -- $9.99
    'usd',
    'month'
),
(
    'prod_peabody_annual',
    'Peabody Teacher Pro - Annual',
    'Unlimited lesson plans with premium features (School Year Billing)',
    'annual',
    7990, -- $79.90
    'usd',
    'year'
) ON CONFLICT (stripe_product_id) DO NOTHING;

-- Add triggers for updated_at
CREATE TRIGGER update_stripe_products_updated_at BEFORE UPDATE ON stripe_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_prices_updated_at BEFORE UPDATE ON stripe_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE stripe_products IS 'Stripe product definitions for different subscription tiers';
COMMENT ON TABLE stripe_prices IS 'Stripe price objects for flexible pricing';
COMMENT ON TABLE stripe_webhook_events IS 'Audit log of all Stripe webhook events';
COMMENT ON TABLE payment_attempts IS 'Analytics for payment success/failure rates';
COMMENT ON TABLE discount_codes IS 'Coupon and discount code management';
COMMENT ON TABLE discount_redemptions IS 'Track which users redeemed which codes';
COMMENT ON FUNCTION process_stripe_webhook IS 'Main function to process Stripe webhook events and update user subscriptions';