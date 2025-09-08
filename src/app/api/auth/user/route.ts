// Get current authenticated user
// Provides user context for database operations

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting authenticated user context')
    
    // Check various auth sources
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('auth_user')
    const currentUserCookie = request.cookies.get('lessonPlanBuilder_currentUser')
    
    console.log('Auth sources:', {
      hasAuthHeader: !!authHeader,
      hasSessionCookie: !!sessionCookie,  
      hasCurrentUserCookie: !!currentUserCookie
    })
    
    // Try session cookie first (if it exists)
    if (sessionCookie) {
      try {
        const user = JSON.parse(sessionCookie.value)
        console.log('✅ Found user in session cookie:', user.email)
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        })
      } catch (error) {
        console.warn('Failed to parse session cookie')
      }
    }
    
    // Try current user cookie (from localStorage auth system)
    if (currentUserCookie) {
      try {
        const user = JSON.parse(currentUserCookie.value)
        console.log('✅ Found user in currentUser cookie:', user.email)
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        })
      } catch (error) {
        console.warn('Failed to parse currentUser cookie')
      }
    }
    
    // Since this is a mock auth system, let's also try reading from a default user
    // This helps during development when no user is logged in
    console.log('⚠️ No authenticated user found, returning null')
    
    return NextResponse.json({
      success: true,
      user: null,
      message: 'No authenticated user - anonymous mode'
    })
    
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get user context',
      user: null
    }, { status: 500 })
  }
}