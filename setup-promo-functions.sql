-- Promo Code Database Functions
-- Run this AFTER creating the tables and inserting the data

-- Function to check if a promo code is valid
CREATE OR REPLACE FUNCTION is_promo_code_valid(
    p_code VARCHAR(50),
    p_user_id VARCHAR(255) DEFAULT NULL,
    p_fingerprint_hash VARCHAR(255) DEFAULT NULL
) RETURNS TABLE(
    valid BOOLEAN,
    promo_code_id UUID,
    error_message TEXT,
    code_details JSONB
) AS $$
DECLARE
    v_promo_code promo_codes%ROWTYPE;
    v_user_uses INTEGER := 0;
    v_fingerprint_uses INTEGER := 0;
BEGIN
    -- Find the promo code
    SELECT * INTO v_promo_code 
    FROM promo_codes 
    WHERE code = p_code AND active = true;
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Invalid promo code'::TEXT, '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Check if code has expired
    IF v_promo_code.expires_at IS NOT NULL AND v_promo_code.expires_at < NOW() THEN
        RETURN QUERY SELECT false, v_promo_code.id, 'Promo code has expired'::TEXT, 
            jsonb_build_object('expires_at', v_promo_code.expires_at);
        RETURN;
    END IF;
    
    -- Check if code hasn't started yet
    IF v_promo_code.starts_at > NOW() THEN
        RETURN QUERY SELECT false, v_promo_code.id, 'Promo code is not yet active'::TEXT,
            jsonb_build_object('starts_at', v_promo_code.starts_at);
        RETURN;
    END IF;
    
    -- Check total usage limit
    IF v_promo_code.max_uses IS NOT NULL AND v_promo_code.current_uses >= v_promo_code.max_uses THEN
        RETURN QUERY SELECT false, v_promo_code.id, 'Promo code usage limit reached'::TEXT,
            jsonb_build_object('max_uses', v_promo_code.max_uses, 'current_uses', v_promo_code.current_uses);
        RETURN;
    END IF;
    
    -- Check per-user usage limit
    IF v_promo_code.max_uses_per_user IS NOT NULL THEN
        -- Count uses by user ID
        IF p_user_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_user_uses
            FROM promo_code_uses
            WHERE promo_code_id = v_promo_code.id AND user_id = p_user_id;
            
            IF v_user_uses >= v_promo_code.max_uses_per_user THEN
                RETURN QUERY SELECT false, v_promo_code.id, 'You have already used this promo code'::TEXT,
                    jsonb_build_object('max_uses_per_user', v_promo_code.max_uses_per_user, 'user_uses', v_user_uses);
                RETURN;
            END IF;
        END IF;
        
        -- Count uses by fingerprint for anonymous users
        IF p_fingerprint_hash IS NOT NULL THEN
            SELECT COUNT(*) INTO v_fingerprint_uses
            FROM promo_code_uses
            WHERE promo_code_id = v_promo_code.id AND fingerprint_hash = p_fingerprint_hash;
            
            IF v_fingerprint_uses >= v_promo_code.max_uses_per_user THEN
                RETURN QUERY SELECT false, v_promo_code.id, 'This promo code has already been used on this device'::TEXT,
                    jsonb_build_object('max_uses_per_user', v_promo_code.max_uses_per_user, 'fingerprint_uses', v_fingerprint_uses);
                RETURN;
            END IF;
        END IF;
    END IF;
    
    -- Code is valid
    RETURN QUERY SELECT true, v_promo_code.id, NULL::TEXT, 
        jsonb_build_object(
            'code', v_promo_code.code,
            'name', v_promo_code.name,
            'description', v_promo_code.description,
            'type', v_promo_code.type,
            'discount_percent', v_promo_code.discount_percent,
            'discount_amount_cents', v_promo_code.discount_amount_cents,
            'free_months', v_promo_code.free_months,
            'trial_days', v_promo_code.trial_days
        );
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to apply a promo code
CREATE OR REPLACE FUNCTION apply_promo_code(
    p_code VARCHAR(50),
    p_user_id VARCHAR(255) DEFAULT NULL,
    p_fingerprint_hash VARCHAR(255) DEFAULT NULL,
    p_order_amount_cents INTEGER DEFAULT NULL,
    p_ip_hash VARCHAR(255) DEFAULT NULL,
    p_user_agent_hash VARCHAR(255) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS TABLE(
    success BOOLEAN,
    promo_code_use_id UUID,
    discount_applied_cents INTEGER,
    error_message TEXT
) AS $$
DECLARE
    v_validation_result RECORD;
    v_promo_code promo_codes%ROWTYPE;
    v_discount_amount INTEGER := 0;
    v_use_id UUID;
BEGIN
    -- Validate the promo code first
    SELECT * INTO v_validation_result
    FROM is_promo_code_valid(p_code, p_user_id, p_fingerprint_hash);
    
    IF NOT v_validation_result.valid THEN
        RETURN QUERY SELECT false, NULL::UUID, 0, v_validation_result.error_message;
        RETURN;
    END IF;
    
    -- Get the promo code details
    SELECT * INTO v_promo_code
    FROM promo_codes
    WHERE id = v_validation_result.promo_code_id;
    
    -- Calculate discount amount
    IF v_promo_code.type = 'discount_percent' AND p_order_amount_cents IS NOT NULL THEN
        v_discount_amount := (p_order_amount_cents * v_promo_code.discount_percent / 100);
    ELSIF v_promo_code.type = 'discount_amount' THEN
        v_discount_amount := LEAST(v_promo_code.discount_amount_cents, COALESCE(p_order_amount_cents, v_promo_code.discount_amount_cents));
    ELSIF v_promo_code.type = 'free_subscription' THEN
        v_discount_amount := COALESCE(p_order_amount_cents, 0); -- Full discount for free subscription
    END IF;
    
    -- Record the usage
    INSERT INTO promo_code_uses (
        promo_code_id,
        user_id,
        fingerprint_hash,
        order_amount_cents,
        discount_applied_cents,
        ip_hash,
        user_agent_hash,
        metadata
    ) VALUES (
        v_promo_code.id,
        p_user_id,
        p_fingerprint_hash,
        p_order_amount_cents,
        v_discount_amount,
        p_ip_hash,
        p_user_agent_hash,
        p_metadata
    ) RETURNING id INTO v_use_id;
    
    -- Update the promo code usage count
    UPDATE promo_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = v_promo_code.id;
    
    -- Return success
    RETURN QUERY SELECT true, v_use_id, v_discount_amount, NULL::TEXT;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT * FROM is_promo_code_valid('TELESCOPE2025');
SELECT * FROM is_promo_code_valid('PAPERCLIP');
SELECT * FROM is_promo_code_valid('INVALIDCODE');