import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from '../../../../lib/supabase';

interface AnalyticsEventRequest {
  eventName: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  url?: string;
  referrer?: string;
  userAgent?: string;
  fingerprintHash?: string;
}

/**
 * Track analytics events for conversion funnel
 * POST /api/analytics/track
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsEventRequest = await request.json();
    const { 
      eventName, 
      properties = {}, 
      userId, 
      sessionId, 
      timestamp, 
      url, 
      referrer, 
      userAgent,
      fingerprintHash 
    } = body;

    // Validate required fields
    if (!eventName) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Get client IP and hash it
    const clientIP = getClientIP(request);
    const ipHash = hashString(clientIP);

    // Determine event category based on event name
    const eventCategory = categorizeEvent(eventName);

    // Insert analytics event
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        user_id: userId || null,
        session_id: sessionId || null,
        event_name: eventName,
        event_category: eventCategory,
        event_properties: properties,
        page_url: url || null,
        referrer: referrer || null,
        user_agent: userAgent || null,
        fingerprint_hash: fingerprintHash || null,
        ip_hash: ipHash,
        created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
      });

    if (insertError) {
      console.error('Analytics insert error:', insertError);
      throw insertError;
    }

    // Handle special events that might trigger additional actions
    await handleSpecialEvents(eventName, properties, userId, sessionId);

    return NextResponse.json({ 
      success: true, 
      eventTracked: eventName 
    });

  } catch (error) {
    console.error('Analytics tracking failed:', error);
    
    // Don't fail the request if analytics fails - just log it
    return NextResponse.json({ 
      success: false,
      error: 'Analytics tracking failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get analytics data (for admin dashboard)
 * GET /api/analytics/track?type=overview&startDate=...&endDate=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const adminKey = searchParams.get('adminKey');

    // Simple admin authentication (in production, use proper admin auth)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    let analyticsData: any = {};

    switch (type) {
      case 'overview':
        analyticsData = await getOverviewAnalytics(start, end);
        break;
      case 'conversion':
        analyticsData = await getConversionFunnelAnalytics(start, end);
        break;
      case 'usage':
        analyticsData = await getUsageAnalytics(start, end);
        break;
      case 'churn':
        analyticsData = await getChurnAnalytics(start, end);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics fetch failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to categorize events
function categorizeEvent(eventName: string): string {
  const conversionEvents = [
    'landing_page_visit', 'first_generation_complete', 'account_created', 
    'limit_warning_shown', 'paywall_encountered', 'upgrade_button_clicked',
    'stripe_checkout_initiated', 'subscription_completed'
  ];

  const usageEvents = [
    'lesson_generated', 'premium_lesson_generated', 'differentiation_used',
    'memory_bank_accessed', 'feature_teaser_clicked'
  ];

  const churnEvents = [
    'subscription_cancel_requested', 'subscription_cancelled_immediately',
    'payment_failed', 'subscription_expired'
  ];

  const retentionEvents = [
    'subscription_reactivated', 'return_user_visit', 'feature_discovery'
  ];

  if (conversionEvents.includes(eventName)) return 'conversion_funnel';
  if (usageEvents.includes(eventName)) return 'usage';
  if (churnEvents.includes(eventName)) return 'churn';
  if (retentionEvents.includes(eventName)) return 'retention';
  
  return 'general';
}

// Handle special events that might need additional processing
async function handleSpecialEvents(
  eventName: string, 
  properties: Record<string, any>, 
  userId?: string, 
  sessionId?: string
): Promise<void> {
  try {
    switch (eventName) {
      case 'paywall_encountered':
        // Track conversion opportunities
        await supabase
          .from('feature_usage')
          .insert({
            user_id: userId || null,
            feature_name: 'paywall',
            feature_category: 'conversion',
            action: 'shown',
            metadata: properties
          });
        break;

      case 'subscription_completed':
        // Mark user as converted in feature usage
        if (userId) {
          await supabase
            .from('feature_usage')
            .insert({
              user_id: userId,
              feature_name: 'subscription',
              feature_category: 'conversion',
              action: 'completed',
              metadata: properties
            });
        }
        break;

      case 'feature_teaser_clicked':
        // Track interest in premium features
        await supabase
          .from('feature_usage')
          .insert({
            user_id: userId || null,
            feature_name: properties.feature || 'unknown',
            feature_category: 'interest',
            action: 'teaser_clicked',
            metadata: properties
          });
        break;
    }
  } catch (error) {
    console.error('Special event handling failed:', error);
    // Don't throw - this is supplementary
  }
}

// Analytics query functions
async function getOverviewAnalytics(start: Date, end: Date) {
  const { data: events } = await supabase
    .from('analytics_events')
    .select('event_name, event_category, created_at, user_id')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const { data: users } = await supabase
    .from('users')
    .select('subscription_status, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('lesson_count, user_id, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  return {
    totalEvents: events?.length || 0,
    newUsers: users?.length || 0,
    premiumUsers: users?.filter(u => u.subscription_status === 'premium').length || 0,
    totalLessonsGenerated: usage?.reduce((sum, u) => sum + (u.lesson_count || 0), 0) || 0,
    eventsByCategory: events?.reduce((acc, event) => {
      acc[event.event_category] = (acc[event.event_category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  };
}

async function getConversionFunnelAnalytics(start: Date, end: Date) {
  const { data: events } = await supabase
    .from('analytics_events')
    .select('event_name, user_id, session_id, created_at')
    .in('event_name', [
      'landing_page_visit', 'first_generation_complete', 'account_created',
      'limit_warning_shown', 'paywall_encountered', 'stripe_checkout_initiated',
      'subscription_completed'
    ])
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const funnel = {
    landing_page_visit: 0,
    first_generation_complete: 0,
    account_created: 0,
    limit_warning_shown: 0,
    paywall_encountered: 0,
    stripe_checkout_initiated: 0,
    subscription_completed: 0
  };

  events?.forEach(event => {
    if (funnel.hasOwnProperty(event.event_name)) {
      funnel[event.event_name as keyof typeof funnel]++;
    }
  });

  return {
    funnel,
    conversionRates: {
      visitToGeneration: funnel.landing_page_visit > 0 ? 
        (funnel.first_generation_complete / funnel.landing_page_visit * 100) : 0,
      generationToAccount: funnel.first_generation_complete > 0 ? 
        (funnel.account_created / funnel.first_generation_complete * 100) : 0,
      paywallToCheckout: funnel.paywall_encountered > 0 ? 
        (funnel.stripe_checkout_initiated / funnel.paywall_encountered * 100) : 0,
      checkoutToSubscription: funnel.stripe_checkout_initiated > 0 ? 
        (funnel.subscription_completed / funnel.stripe_checkout_initiated * 100) : 0
    }
  };
}

async function getUsageAnalytics(start: Date, end: Date) {
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('lesson_count, user_id, month')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const { data: features } = await supabase
    .from('feature_usage')
    .select('feature_name, action, user_id')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  return {
    totalLessons: usage?.reduce((sum, u) => sum + (u.lesson_count || 0), 0) || 0,
    uniqueUsers: new Set(usage?.map(u => u.user_id).filter(Boolean)).size || 0,
    averageLessonsPerUser: (usage && usage.length > 0) ? 
      (usage.reduce((sum, u) => sum + (u.lesson_count || 0), 0) / usage.length) : 0,
    featureUsage: features?.reduce((acc, feature) => {
      const key = `${feature.feature_name}_${feature.action}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  };
}

async function getChurnAnalytics(start: Date, end: Date) {
  const { data: churnEvents } = await supabase
    .from('analytics_events')
    .select('event_name, user_id, created_at, event_properties')
    .in('event_name', ['subscription_cancel_requested', 'subscription_cancelled_immediately', 'payment_failed'])
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const { data: subscriptions } = await supabase
    .from('users')
    .select('subscription_status, subscription_start_date, subscription_end_date')
    .eq('subscription_status', 'premium');

  return {
    totalChurnEvents: churnEvents?.length || 0,
    churnReasons: churnEvents?.reduce((acc, event) => {
      acc[event.event_name] = (acc[event.event_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    activeSubscriptions: subscriptions?.length || 0
  };
}

// Helper functions
function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || xRealIP || xForwardedFor?.split(',')[0] || 'unknown';
}

function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}