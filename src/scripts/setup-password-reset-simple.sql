-- Simple Password Reset Setup for Supabase
-- This version avoids extensions and complex features for maximum compatibility

-- Create password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add password_hash column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
END $$;

-- Add password_updated_at column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_updated_at') THEN
        ALTER TABLE users ADD COLUMN password_updated_at TIMESTAMPTZ;
    END IF;
END $$;

-- Simple function to clean up expired tokens (call manually)
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on password_reset_tokens
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy - users can only access their own tokens
DROP POLICY IF EXISTS "Users can only access their own reset tokens" ON password_reset_tokens;
CREATE POLICY "Users can only access their own reset tokens" 
ON password_reset_tokens 
FOR ALL 
USING (auth.uid() = user_id);

-- Add table comments
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for user password recovery';
COMMENT ON COLUMN password_reset_tokens.token IS 'Secure random token used for password reset';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'When the token expires (typically 1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'When the token was used (null if unused)';

-- Test the setup
SELECT 'Password reset tables created successfully!' as message;

-- Instructions for cleanup
SELECT 'To clean up expired tokens, run: SELECT cleanup_expired_password_reset_tokens();' as cleanup_instructions;