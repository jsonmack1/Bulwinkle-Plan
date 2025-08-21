import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '../../../../../lib/googleAuth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      // User denied access or other OAuth error
      const callbackUrl = new URL('/auth-callback', request.url)
      callbackUrl.searchParams.set('error', 'access_denied')
      return NextResponse.redirect(callbackUrl)
    }

    if (!code) {
      const callbackUrl = new URL('/auth-callback', request.url)
      callbackUrl.searchParams.set('error', 'no_code')
      return NextResponse.redirect(callbackUrl)
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.access_token) {
      const callbackUrl = new URL('/auth-callback', request.url)
      callbackUrl.searchParams.set('error', 'no_token')
      return NextResponse.redirect(callbackUrl)
    }

    // Create a redirect to a callback page that will handle postMessage
    const callbackUrl = new URL('/auth-callback', request.url)
    callbackUrl.searchParams.set('access_token', tokens.access_token)
    if (tokens.refresh_token) {
      callbackUrl.searchParams.set('refresh_token', tokens.refresh_token)
    }

    return NextResponse.redirect(callbackUrl)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    const callbackUrl = new URL('/auth-callback', request.url)
    callbackUrl.searchParams.set('error', 'callback_error')
    return NextResponse.redirect(callbackUrl)
  }
}