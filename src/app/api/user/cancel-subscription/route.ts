import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * Cancel user subscription
 * POST /api/user/cancel-subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cancelAtPeriodEnd = true } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's Stripe subscription ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id, email, name')
      .eq('id', userId)
      .single();

    if (userError || !userData || !userData.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    if (cancelAtPeriodEnd) {
      // Cancel at end of billing period (default)
      const subscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );

      // Update user record
      await supabase
        .from('users')
        .update({
          subscription_cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Log the cancellation
      await supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          event_type: 'subscription_cancel_scheduled',
          event_data: {
            subscription_id: userData.stripe_subscription_id,
            cancel_at_period_end: true,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          }
        });

      // Track analytics
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_name: 'subscription_cancel_requested',
          event_category: 'churn',
          event_properties: {
            cancel_type: 'at_period_end',
            subscription_id: userData.stripe_subscription_id
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Subscription will be cancelled at the end of the billing period',
        cancelAtPeriodEnd: true,
        periodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      });

    } else {
      // Cancel immediately
      const subscription = await stripe.subscriptions.cancel(
        userData.stripe_subscription_id
      );

      // Update user record
      await supabase
        .from('users')
        .update({
          subscription_status: 'free',
          current_plan: 'free',
          stripe_subscription_id: null,
          subscription_end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Log the cancellation
      await supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          event_type: 'subscription_cancelled_immediately',
          event_data: {
            subscription_id: userData.stripe_subscription_id,
            cancelled_at: new Date().toISOString()
          }
        });

      // Track analytics
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_name: 'subscription_cancelled_immediately',
          event_category: 'churn',
          event_properties: {
            cancel_type: 'immediate',
            subscription_id: userData.stripe_subscription_id
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Subscription has been cancelled immediately',
        cancelAtPeriodEnd: false
      });
    }

  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    
    // Track failed cancellation
    try {
      const body = await request.json();
      await supabase
        .from('analytics_events')
        .insert({
          user_id: body.userId || null,
          event_name: 'subscription_cancel_failed',
          event_category: 'errors',
          event_properties: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
    } catch (trackingError) {
      console.error('Failed to track cancellation error:', trackingError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Reactivate cancelled subscription
 * PUT /api/user/cancel-subscription
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's Stripe subscription ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id, subscription_cancel_at_period_end')
      .eq('id', userId)
      .single();

    if (userError || !userData || !userData.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (!userData.subscription_cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      );
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Reactivate subscription (remove cancel_at_period_end)
    const subscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    // Update user record
    await supabase
      .from('users')
      .update({
        subscription_cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // Log the reactivation
    await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'subscription_reactivated',
        event_data: {
          subscription_id: userData.stripe_subscription_id,
          reactivated_at: new Date().toISOString()
        }
      });

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_name: 'subscription_reactivated',
        event_category: 'retention',
        event_properties: {
          subscription_id: userData.stripe_subscription_id
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Subscription has been reactivated',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Subscription reactivation failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reactivate subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}