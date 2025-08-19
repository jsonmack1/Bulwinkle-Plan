import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '../../../../../lib/googleAuth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      // User denied access or other OAuth error
      return NextResponse.redirect(new URL('/?google_auth=denied', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?google_auth=error', request.url))
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/?google_auth=no_token', request.url))
    }

    // Create response with redirect and set tokens in URL params for client-side storage
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('google_auth', 'success')
    redirectUrl.searchParams.set('access_token', tokens.access_token)
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)
    }

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?google_auth=callback_error', request.url))
  }
}