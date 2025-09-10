import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * Get current user's subscription status
 * GET /api/user/subscription?userId=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user subscription data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        subscription_status,
        current_plan,
        billing_cycle,
        subscription_start_date,
        subscription_end_date,
        subscription_cancel_at_period_end,
        stripe_customer_id,
        stripe_subscription_id,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate subscription details
    const now = new Date();
    const endDate = userData.subscription_end_date ? new Date(userData.subscription_end_date) : null;
    const isActive = endDate ? endDate > now : userData.subscription_status === 'premium';
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    console.log('🔍 Subscription Debug Info:', {
      userId,
      subscription_status: userData.subscription_status,
      subscription_end_date: userData.subscription_end_date,
      endDate: endDate?.toISOString(),
      isActive,
      now: now.toISOString()
    });

    // Get current month usage
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('lesson_count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    const currentUsage = usageData?.lesson_count || 0;

    // Get recent subscription events
    const { data: recentEvents } = await supabase
      .from('subscription_events')
      .select('event_type, created_at, event_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const response = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        createdAt: userData.created_at
      },
      subscription: {
        status: userData.subscription_status,
        plan: userData.current_plan,
        billingCycle: userData.billing_cycle,
        isActive,
        isPremium: userData.subscription_status === 'premium' && isActive,
        startDate: userData.subscription_start_date,
        endDate: userData.subscription_end_date,
        daysRemaining,
        cancelAtPeriodEnd: userData.subscription_cancel_at_period_end,
        stripeCustomerId: userData.stripe_customer_id,
        stripeSubscriptionId: userData.stripe_subscription_id
      },
      usage: {
        currentMonth,
        lessonsGenerated: currentUsage,
        remainingLessons: userData.subscription_status === 'premium' ? 999 : Math.max(0, 3 - currentUsage),
        isOverLimit: userData.subscription_status !== 'premium' && currentUsage >= 3
      },
      recentEvents: recentEvents || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Subscription fetch failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update user subscription (for admin use)
 * PUT /api/user/subscription
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscriptionStatus, currentPlan, endDate, adminKey } = body;

    // Simple admin key validation (in production, use proper admin authentication)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userId || !subscriptionStatus) {
      return NextResponse.json(
        { error: 'User ID and subscription status are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_status: subscriptionStatus,
        current_plan: currentPlan || 'free',
        subscription_end_date: endDate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the admin action
    await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'admin_subscription_update',
        event_data: {
          previousStatus: data.subscription_status,
          newStatus: subscriptionStatus,
          updatedBy: 'admin',
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      user: data
    });

  } catch (error) {
    console.error('Subscription update failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}