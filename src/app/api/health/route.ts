import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'API is working correctly'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'POST endpoint working',
      receivedData: body
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        step: 'parsing request body'
      },
      { status: 500 }
    )
  }
}