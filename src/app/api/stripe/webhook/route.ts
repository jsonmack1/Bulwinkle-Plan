import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * Simplified Stripe webhook handler based on working 1e737cf version
 * Handles subscription events with direct database updates
 */
export async function POST(request: NextRequest) {
  const stripe = (await import('../../../../lib/stripe')).default;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('❌ Missing STRIPE_WEBHOOK_SECRET environment variable');
    return NextResponse.json(
      { error: 'Webhook configuration error' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`🎫 Stripe webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Simple subscription created handler - based on working 1e737cf version
async function handleSubscriptionCreated(subscription: any) {
  console.log('🎉 Subscription created:', subscription.id);
  
  const customerId = subscription.customer;
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const plan = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
  
  // Simple, direct database update - exactly like working version
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: isActive ? 'premium' : 'free',
      current_plan: plan,
      subscription_end_date: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating user subscription:', error);
  } else {
    console.log('✅ User subscription updated:', updatedUser.id);
  }

  // Track analytics event
  await supabase
    .from('analytics_events')
    .insert({
      user_id: updatedUser?.id || null,
      event_name: 'subscription_created',
      event_category: 'subscription',
      event_properties: {
        subscription_id: subscription.id,
        status: subscription.status,
        plan: plan,
        trial: subscription.status === 'trialing'
      }
    });
}

// Simple subscription updated handler - based on working 1e737cf version
async function handleSubscriptionUpdated(subscription: any) {
  console.log('📝 Subscription updated:', subscription.id);
  
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const plan = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
  
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      subscription_status: isActive ? 'premium' : 'free',
      current_plan: plan,
      subscription_end_date: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating subscription:', error);
  } else {
    console.log('✅ Subscription updated:', updatedUser.id);
  }
}

// Simple subscription deleted handler - based on working 1e737cf version  
async function handleSubscriptionDeleted(subscription: any) {
  console.log('❌ Subscription deleted:', subscription.id);
  
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'free',
      current_plan: 'free',
      stripe_subscription_id: null,
      subscription_end_date: null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('❌ Error cancelling user subscription:', error);
  } else {
    console.log('✅ User subscription cancelled');
  }
}

// Simple payment handlers - based on working 1e737cf version
async function handlePaymentSucceeded(invoice: any) {
  console.log('💰 Payment succeeded:', invoice.id);
  // Payment successful - subscription status already handled by subscription events
}

async function handlePaymentFailed(invoice: any) {
  console.log('💸 Payment failed:', invoice.id);
  // Handle failed payments if needed
}