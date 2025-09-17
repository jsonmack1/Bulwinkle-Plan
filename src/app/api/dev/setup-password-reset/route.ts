import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * Development helper to set up password reset tables
 * POST /api/dev/setup-password-reset
 * 
 * This is a development utility - in production, use proper migrations
 */
export async function POST(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    console.log('🔧 Setting up password reset tables...');
    
    // Check if password_reset_tokens table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('password_reset_tokens')
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Password reset tables already exist',
        tables: ['password_reset_tokens']
      });
    }

    // If table doesn't exist, we need to create it
    // Note: This requires elevated permissions that may not be available via the client
    console.log('⚠️ Password reset tables do not exist');
    console.log('📝 Please run the setup script manually in your Supabase SQL editor:');
    console.log('   File: src/scripts/setup-password-reset.sql');

    return NextResponse.json({
      success: false,
      message: 'Password reset tables need to be created manually',
      instructions: [
        '1. Open your Supabase project dashboard',
        '2. Go to the SQL Editor',
        '3. Run the SQL script in src/scripts/setup-password-reset.sql',
        '4. This will create the password_reset_tokens table and related functions'
      ],
      sqlFile: 'src/scripts/setup-password-reset.sql'
    });

  } catch (error) {
    console.error('Setup password reset tables failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to set up password reset tables',
        details: error instanceof Error ? error.message : 'Unknown error',
        instructions: [
          'Please run the SQL script manually in your Supabase dashboard:',
          'File: src/scripts/setup-password-reset.sql'
        ]
      },
      { status: 500 }
    );
  }
}