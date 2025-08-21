import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Note: This endpoint runs on the server, so it can't access localStorage
    // The client will need to pass the token or we check if they need to authenticate
    // For now, always return not authenticated to trigger the flow
    return NextResponse.json({
      authenticated: false,
      accessToken: null
    })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    )
  }
}