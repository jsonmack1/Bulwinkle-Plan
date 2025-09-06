import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to hash sensitive data
const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'landing_page' } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Get request context for tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer');

    // Hash sensitive data
    const ipHash = hashData(ip);
    const userAgentHash = hashData(userAgent);

    // Call the database function to add newsletter signup
    const { data, error } = await supabase.rpc('add_newsletter_signup', {
      p_email: email.toLowerCase().trim(),
      p_source: source,
      p_ip_hash: ipHash,
      p_user_agent_hash: userAgentHash,
      p_referrer: referrer,
      p_metadata: {
        timestamp: new Date().toISOString(),
        ip_country: request.headers.get('cf-ipcountry'), // Cloudflare header
        user_agent: userAgent.substring(0, 200) // Store truncated user agent for debugging
      }
    });

    if (error) {
      console.error('Database error during newsletter signup:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe to newsletter' },
        { status: 500 }
      );
    }

    const result = data?.[0];
    
    if (!result?.success) {
      // Email already exists and is active
      if (result?.is_existing) {
        return NextResponse.json(
          { 
            message: 'Email is already subscribed to our newsletter',
            email: email,
            alreadySubscribed: true
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { error: result?.message || 'Failed to subscribe to newsletter' },
          { status: 400 }
        );
      }
    }

    // Log for admin notification (you can set up email notifications here)
    console.log(`✅ New newsletter signup: ${email} from ${source}`);
    
    // Optional: Send notification email to admin
    // You can integrate with email services here to notify jason@jmackcreative.com
    
    return NextResponse.json(
      { 
        message: result.is_existing 
          ? 'Successfully resubscribed to newsletter' 
          : 'Successfully subscribed to newsletter',
        email: email,
        signupId: result.signup_id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to retrieve newsletter statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    // Simple authentication check - you can enhance this with proper admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get newsletter statistics
    const { data: stats, error: statsError } = await supabase
      .from('newsletter_signups')
      .select('source, status, subscribed_at')
      .order('subscribed_at', { ascending: false });

    if (statsError) {
      console.error('Database error fetching newsletter stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch newsletter statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalSignups = stats?.length || 0;
    const activeSubscribers = stats?.filter(s => s.status === 'active').length || 0;
    const sourceBreakdown = stats?.reduce((acc: any, signup) => {
      acc[signup.source] = (acc[signup.source] || 0) + 1;
      return acc;
    }, {});

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSignups = stats?.filter(s => 
      new Date(s.subscribed_at) > thirtyDaysAgo && s.status === 'active'
    ).length || 0;

    return NextResponse.json({
      totalSignups,
      activeSubscribers,
      recentSignups,
      sourceBreakdown,
      latestSignups: stats?.slice(0, 10) // Most recent 10
    });

  } catch (error) {
    console.error('Newsletter stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}