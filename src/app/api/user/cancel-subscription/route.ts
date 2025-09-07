import { NextRequest, NextResponse } from 'next/server';

/**
 * Cancel user subscription
 * POST /api/user/cancel-subscription
 */
export async function POST(request: NextRequest) {
  const stripe = (await import('../../../../lib/stripe')).default;
  const { supabase } = await import('../../../../lib/supabase');

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
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', userData.stripe_subscription_id);

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
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', userData.stripe_subscription_id);

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled immediately',
        cancelledAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}