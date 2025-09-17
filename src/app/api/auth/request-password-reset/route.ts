import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
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

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    
    // In a real application, you would send an email here
    // For now, we'll log the reset link for development purposes
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    console.log('🔐 Password Reset Request:', {
      email,
      userExists,
      resetUrl: userExists ? resetUrl : 'User not found - no email sent',
      expiresAt: resetTokenExpiry.toISOString()
    });

    // TODO: Replace with actual email sending service
    // await emailService.sendPasswordResetEmail({
    //   to: email,
    //   resetUrl,
    //   userName: userName || 'User'
    // });

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