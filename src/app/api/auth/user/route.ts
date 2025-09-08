// Get current authenticated user
// Provides user context for database operations

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Try to get user from auth headers or session
    // For now, return mock user - in production would check actual auth
    
    // Check if we have any auth indicators
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('auth_user')
    
    if (sessionCookie) {
      try {
        const user = JSON.parse(sessionCookie.value)
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        })
      } catch (error) {
        console.warn('Failed to parse user from session cookie')
      }
    }
    
    // No authenticated user found
    return NextResponse.json({
      success: false,
      user: null,
      message: 'No authenticated user'
    }, { status: 401 })
    
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get user context',
      user: null
    }, { status: 500 })
  }
}