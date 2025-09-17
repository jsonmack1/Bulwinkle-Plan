# Password Recovery System

This document outlines the password recovery system implemented for the Lesson Plan Builder application.

## Overview

The password recovery system allows users to reset their forgotten passwords through a secure email-based flow. The system includes:

- Password reset request functionality
- Secure token-based verification
- Password reset confirmation
- Database integration with Supabase
- User-friendly UI components

## Architecture

### Components

1. **API Endpoints**
   - `/api/auth/request-password-reset` - Initiates password reset
   - `/api/auth/confirm-password-reset` - Confirms and resets password

2. **UI Components**
   - `PasswordResetForm` - Form to request password reset
   - `LoginForm` - Updated with "Forgot Password" link
   - `AuthModal` - Updated to handle reset mode
   - `/reset-password` page - Password reset confirmation page

3. **Database Schema**
   - `password_reset_tokens` table - Stores secure reset tokens
   - `users` table - Updated with password hash columns

## Database Setup

### Required Tables

Run the SQL script in `src/scripts/setup-password-reset.sql` to create:

```sql
-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Add password columns to users table
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_updated_at TIMESTAMPTZ;
```

### Setup Instructions

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the complete script from `src/scripts/setup-password-reset.sql`
4. Verify tables are created correctly

Alternatively, call the development endpoint:
```bash
POST /api/dev/setup-password-reset
```

## User Flow

### 1. Request Password Reset

1. User clicks "Forgot your password?" on login form
2. User enters their email address
3. System generates secure token and stores in database
4. System sends email with reset link (currently logs to console)
5. User receives confirmation message

### 2. Reset Password

1. User clicks reset link in email
2. System validates token and expiration
3. User enters new password (with confirmation)
4. System updates password hash and removes used token
5. User is redirected to login with success message

## Security Features

### Token Security
- Cryptographically secure random tokens (32 bytes)
- Tokens expire after 1 hour
- One-time use tokens (deleted after use)
- Secure hash-based password storage

### Anti-Enumeration
- Same response whether email exists or not
- Prevents email enumeration attacks
- Consistent timing and behavior

### Database Security
- Row Level Security (RLS) policies
- Foreign key constraints
- Automatic token cleanup
- Proper indexing for performance

## API Reference

### Request Password Reset

**Endpoint:** `POST /api/auth/request-password-reset`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Confirm Password Reset

**Endpoint:** `POST /api/auth/confirm-password-reset`

**Request Body:**
```json
{
  "token": "secure-token-string",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

## Frontend Integration

### Using in Components

```tsx
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { requestPasswordReset, confirmPasswordReset } = useAuth()
  
  // Request reset
  await requestPasswordReset({ email: 'user@example.com' })
  
  // Confirm reset
  await confirmPasswordReset({ 
    token: 'reset-token', 
    newPassword: 'newpassword' 
  })
}
```

### AuthModal Integration

The AuthModal component now supports three modes:
- `'login'` - Standard login form
- `'signup'` - User registration form  
- `'reset'` - Password reset form

```tsx
<AuthModal 
  isOpen={true}
  defaultMode="reset"
  onClose={handleClose}
/>
```

## Email Integration

### Current Implementation

Currently, the system logs reset links to the console for development purposes:

```javascript
console.log('🔐 Password Reset Request:', {
  email,
  resetUrl: 'http://localhost:3000/reset-password?token=...',
  expiresAt: '2024-01-01T12:00:00Z'
});
```

### Production Email Setup

To implement email sending in production:

1. **Choose an email service** (SendGrid, AWS SES, Mailgun, etc.)
2. **Update the request endpoint** to send actual emails
3. **Create email templates** for password reset
4. **Configure environment variables** for email service

Example email service integration:

```typescript
// In /api/auth/request-password-reset
import { emailService } from '../../../lib/email'

await emailService.sendPasswordResetEmail({
  to: email,
  resetUrl,
  userName: userName || 'User'
})
```

## Error Handling

### Common Error Responses

- `400` - Invalid or missing parameters
- `400` - Token expired or invalid
- `500` - Internal server error

### Error Messages

- "Email is required"
- "Token and new password are required"
- "Password must be at least 6 characters long"
- "Invalid or expired reset token"
- "Reset token has expired"

## Development

### Testing the Flow

1. Start the development server: `npm run dev`
2. Navigate to the login modal
3. Click "Forgot your password?"
4. Enter an email address
5. Check console logs for reset link
6. Visit reset link to test password reset

### Development Endpoints

- `POST /api/dev/setup-password-reset` - Set up database schema
- Check console logs for reset URLs during development

## Security Considerations

### Production Checklist

- [ ] Implement proper email sending service
- [ ] Set up secure environment variables
- [ ] Configure proper CORS policies
- [ ] Set up rate limiting for reset requests
- [ ] Monitor for abuse patterns
- [ ] Implement proper logging and alerting
- [ ] Test with security scan tools
- [ ] Review RLS policies in Supabase

### Rate Limiting

Consider implementing rate limiting to prevent abuse:
- Limit reset requests per email (e.g., 3 per hour)
- Limit reset requests per IP address
- Implement CAPTCHA for suspicious activity

## Troubleshooting

### Common Issues

1. **Database tables missing**
   - Run the SQL setup script in Supabase
   - Check table permissions and RLS policies

2. **Tokens not working**
   - Verify token expiration times
   - Check database connectivity
   - Ensure proper URL encoding

3. **Email not being sent**
   - Currently emails are not sent (development mode)
   - Check console logs for reset URLs
   - Implement actual email service for production

### Debugging

Enable debug logging in the API endpoints to troubleshoot issues:

```typescript
console.log('🔍 Debug info:', { userId, token, expiresAt })
```

## Future Enhancements

### Planned Features

1. **Email Templates**
   - HTML email templates
   - Branded reset emails
   - Multi-language support

2. **Enhanced Security**
   - Two-factor authentication integration
   - Device verification
   - Suspicious activity detection

3. **User Experience**
   - Password strength indicators
   - Recent password validation
   - Account recovery alternatives

4. **Analytics**
   - Reset request tracking
   - Success/failure metrics
   - Security event monitoring