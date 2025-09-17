import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { createPasswordResetRateLimiter } from '../../../../lib/rate-limiting';
import crypto from 'crypto';

/**
 * Password Reset Request API
 * POST /api/auth/request-password-reset
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Initialize rate limiter
    const rateLimiter = createPasswordResetRateLimiter();

    // Check email rate limit
    const emailRateLimit = await rateLimiter.checkEmailRateLimit(email);
    if (!emailRateLimit.success) {
      const resetTimeMinutes = Math.ceil((emailRateLimit.resetTime - Date.now()) / (1000 * 60));
      return NextResponse.json(
        { 
          error: `Too many password reset requests for this email. Please try again in ${resetTimeMinutes} minutes.`,
          retryAfter: emailRateLimit.resetTime
        },
        { status: 429 }
      );
    }

    // Check IP rate limit
    const ipRateLimit = await rateLimiter.checkIPRateLimit(clientIP);
    if (!ipRateLimit.success) {
      const resetTimeMinutes = Math.ceil((ipRateLimit.resetTime - Date.now()) / (1000 * 60));
      return NextResponse.json(
        { 
          error: `Too many password reset requests from this IP address. Please try again in ${resetTimeMinutes} minutes.`,
          retryAfter: ipRateLimit.resetTime
        },
        { status: 429 }
      );
    }

    console.log('🛡️ Rate limit check passed:', { 
      email, 
      ip: clientIP,
      emailRemaining: emailRateLimit.remainingAttempts,
      ipRemaining: ipRateLimit.remainingAttempts 
    });

    // Check if user exists in our system (either localStorage mock or Supabase)
    let userExists = false;
    let userId = null;
    let userName = null;

    // First check Supabase users
    try {
      const { data: supabaseUser, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', email.toLowerCase())
        .single();

      if (!error && supabaseUser) {
        userExists = true;
        userId = supabaseUser.id;
        userName = supabaseUser.name;
      }
    } catch (supabaseError) {
      console.log('User not found in Supabase, will still send reset email for security');
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store the reset token (for now, we'll store in localStorage simulation)
    // In production, this would be stored in the database
    if (userExists && userId) {
      try {
        // Store reset token in Supabase
        const { error: tokenError } = await supabase
          .from('password_reset_tokens')
          .upsert([{
            user_id: userId,
            token: resetToken,
            expires_at: resetTokenExpiry.toISOString(),
            created_at: new Date().toISOString()
          }], {
            onConflict: 'user_id'
          });

        if (tokenError) {
          console.error('Failed to store reset token:', tokenError);
        }
      } catch (error) {
        console.error('Error storing reset token:', error);
      }
    }

    // Send password reset email (for security, always attempt to send even if user doesn't exist)
    // This prevents email enumeration attacks
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    if (userExists) {
      try {
        const { createEmailService } = await import('../../../../lib/email');
        const emailService = createEmailService();
        
        await emailService.sendPasswordResetEmail({
          to: email,
          resetUrl,
          userName: userName || 'User'
        });
        
        console.log('✅ Password reset email sent to:', email);
      } catch (emailError) {
        console.error('❌ Failed to send password reset email:', emailError);
        // Don't expose email errors to the user for security
      }
    } else {
      // For non-existent users, still log as if we sent an email (security)
      console.log('🔐 Password reset requested for non-existent email:', email, '(no email sent)');
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}