import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthUrl, validateGoogleAuthConfig } from '../../../../lib/googleAuth'

export async function GET(request: NextRequest) {
  try {
    // Check if Google OAuth is configured
    if (!validateGoogleAuthConfig()) {
      return NextResponse.json(
        { 
          error: 'Google OAuth not configured', 
          details: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables'
        },
        { status: 500 }
      )
    }

    const authUrl = getGoogleAuthUrl()
    
    return NextResponse.json({
      success: true,
      url: authUrl
    })
  } catch (error) {
    console.error('Google OAuth URL generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate OAuth URL', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}