import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * Test endpoint to manually trigger webhook processing
 * POST /api/stripe/test-webhook
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = (await import('../../../../lib/stripe')).default;
    
    // Get your Stripe customer ID and subscription ID
    const body = await request.json();
    const { customerId, subscriptionId } = body;
    
    if (!customerId && !subscriptionId) {
      return NextResponse.json({
        error: 'Please provide either customerId or subscriptionId to test'
      }, { status: 400 });
    }

    let subscription;
    
    if (subscriptionId) {
      // Get subscription by ID
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } else if (customerId) {
      // Get subscriptions by customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1
      });
      subscription = subscriptions.data[0];
    }
    
    if (!subscription) {
      return NextResponse.json({
        error: 'No subscription found for the provided ID/customer'
      }, { status: 404 });
    }

    console.log('🧪 Testing webhook with subscription:', subscription.id);

    // Simulate subscription created/updated event
    const mockEvent = {
      type: subscription.created === subscription.current_period_start ? 
        'customer.subscription.created' : 'customer.subscription.updated',
      data: {
        object: subscription
      }
    };

    // Process the subscription directly
    if (mockEvent.type === 'customer.subscription.created') {
      await processSubscriptionCreated(subscription);
    } else {
      await processSubscriptionUpdated(subscription);
    }

    // Check if user was updated
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Webhook processing simulated successfully',
      subscription: {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      },
      user: user || null
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions (same as in webhook)
async function processSubscriptionCreated(subscription: any) {
  const customerId = subscription.customer;
  
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status === 'active' ? 'premium' : 'free',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      current_plan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
  
  console.log('✅ User subscription created:', updatedUser?.id);
  return updatedUser;
}

async function processSubscriptionUpdated(subscription: any) {
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      subscription_status: subscription.status === 'active' ? 'premium' : 'free',
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      subscription_cancel_at_period_end: subscription.cancel_at_period_end || false,
      current_plan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
  
  console.log('✅ User subscription updated:', updatedUser?.id);
  return updatedUser;
}