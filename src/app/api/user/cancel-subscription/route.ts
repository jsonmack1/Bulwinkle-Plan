import { NextRequest, NextResponse } from 'next/server';

/**
 * Cancel user subscription
 * POST /api/user/cancel-subscription
 * TEMPORARILY DISABLED - Stripe not yet configured
 */
export async function POST(request: NextRequest) {
  // Temporary response until Stripe is configured
  return NextResponse.json(
    { error: 'Subscription management not yet configured' },
    { status: 501 }
  );
}

/* TODO: Uncomment when ready to implement Stripe

import { supabase } from '../../../../lib/supabase';

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

    // Get user's subscription details
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
      // Schedule cancellation at period end
      const subscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        {
          cancel_at_period_end: true
        }
      );

      // Update our database
      await supabase
        .from('subscriptions')
        .update({
          subscription_cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', userData.stripe_subscription_id);

      // Track analytics event
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_name: 'subscription_cancellation_scheduled',
          event_category: 'subscription_lifecycle',
          event_properties: {
            subscription_id: userData.stripe_subscription_id,
            cancel_at_period_end: true,
            current_period_end: subscription.current_period_end
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Subscription will be cancelled at the end of the billing period',
        cancelAtPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      });

    } else {
      // Cancel immediately
      const subscription = await stripe.subscriptions.cancel(
        userData.stripe_subscription_id
      );

      // Update our database
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          stripe_subscription_id: null,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', userData.stripe_subscription_id);

      // Track analytics event
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_name: 'subscription_cancelled_immediately',
          event_category: 'subscription_lifecycle',
          event_properties: {
            subscription_id: userData.stripe_subscription_id,
            cancellation_reason: 'user_request_immediate'
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled immediately',
        cancelledAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    
    // Track failed cancellation
    try {
      await supabase
        .from('analytics_events')
        .insert({
          user_id: request.body?.userId || null,
          event_name: 'subscription_cancellation_failed',
          event_category: 'subscription_lifecycle',
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's subscription details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id, subscription_cancel_at_period_end')
      .eq('id', userId)
      .single();

    if (userError || !userData || !userData.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
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

    // Remove cancellation scheduling
    const subscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        cancel_at_period_end: false
      }
    );

    // Update our database
    await supabase
      .from('subscriptions')
      .update({
        subscription_cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', userData.stripe_subscription_id);

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_name: 'subscription_cancellation_removed',
        event_category: 'subscription_lifecycle',
        event_properties: {
          subscription_id: userData.stripe_subscription_id,
          current_period_end: subscription.current_period_end
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancellation removed - your subscription will continue',
      continuesUntil: new Date(subscription.current_period_end * 1000).toISOString()
    });

  } catch (error) {
    console.error('Remove subscription cancellation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to remove subscription cancellation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

*/