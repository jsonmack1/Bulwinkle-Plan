import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Testing Environment Variables...')
  
  // Test Google OAuth variables
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI
  
  // Test Claude API variable
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  
  // Log to console (for server-side debugging)
  console.log('Google Client ID:', googleClientId ? googleClientId.substring(0, 10) + '...' : 'Not Set')
  console.log('Google Client Secret:', googleClientSecret ? 'Set' : 'Not Set')
  console.log('Google Redirect URI:', googleRedirectUri || 'Using default')
  console.log('Anthropic API Key:', anthropicApiKey ? anthropicApiKey.substring(0, 10) + '...' : 'Not Set')
  
  // Return status to client
  const envStatus = {
    googleClientId: googleClientId ? {
      status: 'Set',
      preview: googleClientId.substring(0, 10) + '...'
    } : {
      status: 'Not Set',
      preview: null
    },
    googleClientSecret: googleClientSecret ? {
      status: 'Set',
      length: googleClientSecret.length
    } : {
      status: 'Not Set',
      length: 0
    },
    googleRedirectUri: {
      status: googleRedirectUri ? 'Set' : 'Using Default',
      value: googleRedirectUri || 'http://localhost:3000/api/auth/google/callback'
    },
    anthropicApiKey: anthropicApiKey ? {
      status: 'Set',
      preview: anthropicApiKey.substring(0, 10) + '...'
    } : {
      status: 'Not Set',
      preview: null
    }
  }
  
  return NextResponse.json({
    success: true,
    message: 'Environment variables test completed',
    timestamp: new Date().toISOString(),
    environment: envStatus,
    recommendations: {
      googleOAuth: !googleClientId || !googleClientSecret ? 
        'Create Google Cloud Project and add OAuth credentials to .env.local' : 
        'Google OAuth configured ✅',
      claudeApi: !anthropicApiKey ? 
        'Add ANTHROPIC_API_KEY to .env.local for AI features' : 
        'Claude API configured ✅'
    }
  }, { status: 200 })
}