-- Password reset tokens table
-- This should be run in your Supabase SQL editor or database administration tool

-- Create password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add password_hash column to users table if it doesn't exist
-- This is used to store hashed passwords for password reset functionality
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

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger or scheduled job to clean up expired tokens
-- This can be run manually or set up as a cron job in Supabase
SELECT cron.schedule('cleanup-expired-reset-tokens', '0 */6 * * *', 'SELECT cleanup_expired_password_reset_tokens();');

-- Insert comment for documentation
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for user password recovery';
COMMENT ON COLUMN password_reset_tokens.token IS 'Secure random token used for password reset';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'When the token expires (typically 1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'When the token was used (null if unused)';

-- Grant necessary permissions (adjust as needed for your security model)
-- These are example permissions - adjust based on your RLS policies
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (adjust based on your security requirements)
CREATE POLICY "Users can only access their own reset tokens" 
ON password_reset_tokens 
FOR ALL 
USING (auth.uid() = user_id);