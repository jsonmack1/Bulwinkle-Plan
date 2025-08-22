import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Only log API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('🌐 === MIDDLEWARE LOG ===')
    console.log('📍 API Request:', request.method, request.nextUrl.pathname)
    console.log('📅 Timestamp:', new Date().toISOString())
    console.log('🏠 Origin:', request.headers.get('origin'))
    console.log('🔧 User-Agent:', request.headers.get('user-agent'))
    console.log('📦 Content-Type:', request.headers.get('content-type'))
    
    // For POST requests, log content length
    if (request.method === 'POST') {
      console.log('📊 Content-Length:', request.headers.get('content-length'))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}