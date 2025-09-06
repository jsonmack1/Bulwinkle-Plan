-- Newsletter Signups Migration
-- Creates a table to store email addresses from newsletter signups

-- Create newsletter_signups table
CREATE TABLE IF NOT EXISTS newsletter_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Subscription details
    source VARCHAR(100) DEFAULT 'landing_page', -- where they signed up from
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    
    -- User context (if available)
    user_id VARCHAR(255), -- If they're a registered user
    
    -- Tracking information
    ip_hash VARCHAR(255), -- For analytics/deduplication
    user_agent_hash VARCHAR(255), -- Browser fingerprint
    referrer TEXT, -- Where they came from
    
    -- Timestamps
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics and preferences
    metadata JSONB DEFAULT '{}', -- For storing additional data like preferences
    
    -- Email campaign tracking
    first_email_sent_at TIMESTAMP WITH TIME ZONE,
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    total_emails_sent INTEGER DEFAULT 0,
    
    -- Engagement tracking
    last_email_opened_at TIMESTAMP WITH TIME ZONE,
    total_emails_opened INTEGER DEFAULT 0,
    last_link_clicked_at TIMESTAMP WITH TIME ZONE,
    total_links_clicked INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_email ON newsletter_signups(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_status ON newsletter_signups(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_subscribed_at ON newsletter_signups(subscribed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_user_id ON newsletter_signups(user_id) WHERE user_id IS NOT NULL;

-- Create a function to safely add newsletter signup
CREATE OR REPLACE FUNCTION add_newsletter_signup(
    p_email VARCHAR(255),
    p_source VARCHAR(100) DEFAULT 'landing_page',
    p_user_id VARCHAR(255) DEFAULT NULL,
    p_ip_hash VARCHAR(255) DEFAULT NULL,
    p_user_agent_hash VARCHAR(255) DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS TABLE(
    success BOOLEAN,
    signup_id UUID,
    message TEXT,
    is_existing BOOLEAN
) AS $$
DECLARE
    v_signup_id UUID;
    v_existing_signup newsletter_signups%ROWTYPE;
BEGIN
    -- Check if email already exists
    SELECT * INTO v_existing_signup 
    FROM newsletter_signups 
    WHERE email = p_email;
    
    -- If email exists
    IF FOUND THEN
        -- If they were unsubscribed, reactivate them
        IF v_existing_signup.status = 'unsubscribed' THEN
            UPDATE newsletter_signups 
            SET status = 'active',
                subscribed_at = NOW(),
                unsubscribed_at = NULL,
                source = p_source,
                user_id = COALESCE(p_user_id, user_id),
                metadata = p_metadata
            WHERE id = v_existing_signup.id;
            
            RETURN QUERY SELECT true, v_existing_signup.id, 'Successfully resubscribed to newsletter'::TEXT, true;
        ELSE
            -- Already subscribed
            RETURN QUERY SELECT false, v_existing_signup.id, 'Email is already subscribed to newsletter'::TEXT, true;
        END IF;
    ELSE
        -- New signup
        INSERT INTO newsletter_signups (
            email,
            source,
            user_id,
            ip_hash,
            user_agent_hash,
            referrer,
            metadata
        ) VALUES (
            p_email,
            p_source,
            p_user_id,
            p_ip_hash,
            p_user_agent_hash,
            p_referrer,
            p_metadata
        ) RETURNING id INTO v_signup_id;
        
        RETURN QUERY SELECT true, v_signup_id, 'Successfully subscribed to newsletter'::TEXT, false;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a function to unsubscribe
CREATE OR REPLACE FUNCTION unsubscribe_newsletter(
    p_email VARCHAR(255)
) RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Update the subscription status
    UPDATE newsletter_signups 
    SET status = 'unsubscribed',
        unsubscribed_at = NOW()
    WHERE email = p_email AND status = 'active';
    
    -- Check if any rows were updated
    IF FOUND THEN
        RETURN QUERY SELECT true, 'Successfully unsubscribed from newsletter'::TEXT;
    ELSE
        RETURN QUERY SELECT false, 'Email not found or already unsubscribed'::TEXT;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a view for active subscribers (for easy querying)
CREATE OR REPLACE VIEW active_newsletter_subscribers AS
SELECT 
    id,
    email,
    source,
    user_id,
    subscribed_at,
    metadata,
    total_emails_sent,
    total_emails_opened,
    total_links_clicked,
    CASE 
        WHEN total_emails_sent > 0 
        THEN ROUND((total_emails_opened::DECIMAL / total_emails_sent::DECIMAL) * 100, 2)
        ELSE 0 
    END as open_rate_percent
FROM newsletter_signups 
WHERE status = 'active'
ORDER BY subscribed_at DESC;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON newsletter_signups TO your_app_user;
-- GRANT EXECUTE ON FUNCTION add_newsletter_signup TO your_app_user;
-- GRANT EXECUTE ON FUNCTION unsubscribe_newsletter TO your_app_user;
-- GRANT SELECT ON active_newsletter_subscribers TO your_app_user;