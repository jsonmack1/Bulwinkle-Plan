import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify Anthropic API key is working
 * Access at: /api/test-anthropic-key
 */
export async function GET(request: NextRequest) {
  try {
    const envKey = process.env.ANTHROPIC_API_KEY;

    // Log key details (safely)
    console.log('🔑 API Key Test:', {
      exists: !!envKey,
      length: envKey?.length || 0,
      prefix: envKey?.substring(0, 10) + '...',
      suffix: '...' + envKey?.substring(envKey.length - 5),
      startsCorrectly: envKey?.startsWith('sk-ant-'),
      hasWhitespace: envKey?.includes(' ') || envKey?.includes('\n'),
      hasQuotes: envKey?.includes('"') || envKey?.includes("'")
    });

    if (!envKey || envKey.length < 20 || !envKey.startsWith('sk-ant-')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key format',
        details: {
          exists: !!envKey,
          length: envKey?.length || 0,
          startsCorrectly: envKey?.startsWith('sk-ant-'),
          hint: 'Check Vercel environment variables for ANTHROPIC_API_KEY'
        }
      }, { status: 500 });
    }

    // Make a minimal API call to test the key
    console.log('🧪 Testing API call...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': envKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Say "OK"'
        }]
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ API call failed:', responseData);
      return NextResponse.json({
        success: false,
        error: 'API call failed',
        status: response.status,
        statusText: response.statusText,
        apiError: responseData,
        hints: {
          401: 'Invalid API key - check if key is correct',
          403: 'API key lacks permissions - check Anthropic console',
          404: 'Model not found - key might not have access to Sonnet 4.5',
          429: 'Rate limit exceeded',
          500: 'Anthropic service error'
        }[response.status] || 'Unknown error'
      }, { status: 500 });
    }

    console.log('✅ API call successful!');
    return NextResponse.json({
      success: true,
      message: 'API key is working correctly!',
      model: 'claude-3-5-sonnet-20241022',
      apiResponse: responseData.content?.[0]?.text || 'OK'
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
