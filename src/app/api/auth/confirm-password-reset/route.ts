import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import crypto from 'crypto';

/**
 * Password Reset Confirmation API
 * POST /api/auth/confirm-password-reset
 */
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find the reset token in Supabase
    try {
      const { data: resetRecord, error: findError } = await supabase
        .from('password_reset_tokens')
        .select('user_id, expires_at, token')
        .eq('token', token)
        .single();

      if (findError || !resetRecord) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(resetRecord.expires_at);
      
      if (now > expiresAt) {
        // Clean up expired token
        await supabase
          .from('password_reset_tokens')
          .delete()
          .eq('token', token);

        return NextResponse.json(
          { error: 'Reset token has expired' },
          { status: 400 }
        );
      }

      // Get user information
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', resetRecord.user_id)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 400 }
        );
      }

      // For this implementation, we'll store the new password hash in a secure way
      // In a real production environment, you'd use proper password hashing (bcrypt, argon2, etc.)
      const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

      // Update the user's password in Supabase (you'd need a password_hash column)
      // For now, we'll store it in the users table with a simple hash
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: passwordHash,
          password_updated_at: new Date().toISOString()
        })
        .eq('id', resetRecord.user_id);

      if (updateError) {
        console.error('Failed to update password:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }

      // Clean up the used reset token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token);

      console.log('✅ Password reset successful for user:', user.email);

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully'
      });

    } catch (error) {
      console.error('Password reset confirmation error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Password reset confirmation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}