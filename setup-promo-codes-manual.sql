-- Manual Promo Codes Setup
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Code type and benefits
    type VARCHAR(20) NOT NULL CHECK (type IN ('free_subscription', 'discount_percent', 'discount_amount', 'free_trial')),
    
    -- Benefit values
    discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount_cents INTEGER CHECK (discount_amount_cents >= 0),
    free_months INTEGER DEFAULT 0 CHECK (free_months >= 0),
    trial_days INTEGER DEFAULT 0 CHECK (trial_days >= 0),
    
    -- Usage limits
    max_uses INTEGER, -- NULL for unlimited
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    
    -- Validity period
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by VARCHAR(255), -- admin user who created it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Analytics
    metadata JSONB DEFAULT '{}'
);

-- Step 2: Create promo_code_uses table to track usage
CREATE TABLE IF NOT EXISTS promo_code_uses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id VARCHAR(255), -- NULL for anonymous users
    fingerprint_hash VARCHAR(255), -- For tracking anonymous uses
    
    -- Usage details
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_id VARCHAR(255), -- Stripe subscription ID if applicable
    order_amount_cents INTEGER,
    discount_applied_cents INTEGER,
    
    -- Context
    ip_hash VARCHAR(255),
    user_agent_hash VARCHAR(255),
    referrer TEXT,
    
    -- Analytics
    metadata JSONB DEFAULT '{}'
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires_at ON promo_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_promo_code_id ON promo_code_uses(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user_id ON promo_code_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_fingerprint ON promo_code_uses(fingerprint_hash);

-- Step 4: Insert test promo codes
INSERT INTO promo_codes (
    code, name, description, type, free_months, max_uses, discount_percent, created_by, metadata
) VALUES 
(
    'TELESCOPE2025', 
    'Educator Premium Access 2025', 
    'Free 3-month subscription for verified educators', 
    'free_subscription', 
    3, 
    1000, 
    NULL,
    'system', 
    '{"campaign": "educator_program", "year": 2025}'
),
(
    'PAPERCLIP', 
    'Monthly Boost Access', 
    'Free 1-month subscription for new users', 
    'free_subscription', 
    1, 
    NULL,
    NULL, 
    'system', 
    '{"campaign": "general_promotion", "year": 2025}'
),
(
    'MIDNIGHT50', 
    'Launch Year Special', 
    '50% off first month for early adopters', 
    'discount_percent', 
    0, 
    500,
    50, 
    'system', 
    '{"campaign": "launch_special", "year": 2025}'
),
(
    'DEVTEST', 
    'Developer Testing Code 2025', 
    'Free 12-month subscription for development testing', 
    'free_subscription', 
    12, 
    NULL,
    NULL, 
    'developer', 
    '{"environment": "development", "purpose": "testing", "year": 2025}'
)
ON CONFLICT (code) DO NOTHING;

-- Step 5: Verify the data was inserted
SELECT code, name, type, free_months, discount_percent, max_uses, active 
FROM promo_codes 
ORDER BY created_at;