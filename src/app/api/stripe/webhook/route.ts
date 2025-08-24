import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from '../../../../lib/supabase';

/**
 * Stripe webhook handler for subscription events
 * POST /api/stripe/webhook
 */
export async function POST(request: NextRequest) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
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
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Log the webhook event
  const { error: logError } = await supabase
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event,
      processed_status: 'pending'
    });

  if (logError) {
    console.error('Failed to log webhook event:', logError);
  }

  try {
    // Process the event
    const processed = await processWebhookEvent(event);
    
    if (processed) {
      return NextResponse.json({ received: true, processed: true });
    } else {
      return NextResponse.json({ received: true, processed: false });
    }
  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    // Update webhook event with error
    await supabase
      .from('stripe_webhook_events')
      .update({
        processed_status: 'failed',
        processed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 1
      })
      .eq('stripe_event_id', event.id);

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processWebhookEvent(event: any): Promise<boolean> {
  const eventData = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      return await handleCheckoutSessionCompleted(event, eventData);
    
    case 'customer.subscription.created':
      return await handleSubscriptionCreated(event, eventData);
    
    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(event, eventData);
    
    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(event, eventData);
    
    case 'invoice.payment_succeeded':
      return await handlePaymentSucceeded(event, eventData);
    
    case 'invoice.payment_failed':
      return await handlePaymentFailed(event, eventData);
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
      
      // Update webhook as processed but ignored
      await supabase
        .from('stripe_webhook_events')
        .update({
          processed_status: 'ignored',
          processed_at: new Date().toISOString()
        })
        .eq('stripe_event_id', event.id);
      
      return true;
  }
}

async function handleCheckoutSessionCompleted(event: any, session: any): Promise<boolean> {
  console.log('Processing checkout.session.completed:', session.id);
  
  const userId = session.metadata?.user_id;
  const customerId = session.customer;
  
  if (!userId || !customerId) {
    console.error('Missing user_id or customer in checkout session metadata');
    return false;
  }

  // Update user with customer ID if not already set
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update user with customer ID:', updateError);
  }

  // Update payment attempt as succeeded
  await supabase
    .from('payment_attempts')
    .update({
      status: 'succeeded',
      completed_at: new Date().toISOString()
    })
    .eq('stripe_session_id', session.id);

  // Track analytics
  await supabase
    .from('analytics_events')
    .insert({
      user_id: userId,
      event_name: 'checkout_completed',
      event_category: 'conversion_funnel',
      event_properties: {
        session_id: session.id,
        customer_id: customerId,
        amount_total: session.amount_total,
        currency: session.currency
      }
    });

  return true;
}

async function handleSubscriptionCreated(event: any, subscription: any): Promise<boolean> {
  console.log('Processing customer.subscription.created:', subscription.id);
  
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const priceId = subscription.items.data[0]?.price?.id;

  // Find user by customer ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !userData) {
    console.error('User not found for customer:', customerId);
    return false;
  }

  const billingCycle = priceId?.includes('annual') ? 'annual' : 'monthly';
  const subscriptionStatus = status === 'active' ? 'premium' : 'free';

  // Update user subscription
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_status: subscriptionStatus,
      current_plan: status === 'active' ? billingCycle : 'free',
      stripe_subscription_id: subscriptionId,
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: currentPeriodEnd.toISOString(),
      billing_cycle: billingCycle,
      updated_at: new Date().toISOString()
    })
    .eq('id', userData.id);

  if (updateError) {
    console.error('Failed to update user subscription:', updateError);
    return false;
  }

  // Log subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userData.id,
      event_type: 'subscription_created',
      event_data: subscription,
      stripe_event_id: event.id,
      stripe_object_id: subscriptionId
    });

  // Track analytics
  await supabase
    .from('analytics_events')
    .insert({
      user_id: userData.id,
      event_name: 'subscription_completed',
      event_category: 'conversion_funnel',
      event_properties: {
        subscription_id: subscriptionId,
        plan: billingCycle,
        status: status,
        amount: subscription.items.data[0]?.price?.unit_amount || 0
      }
    });

  console.log(`✅ Subscription created for user ${userData.id}: ${subscriptionId}`);
  return true;
}

async function handleSubscriptionUpdated(event: any, subscription: any): Promise<boolean> {
  console.log('Processing customer.subscription.updated:', subscription.id);
  
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  // Find user by customer ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !userData) {
    console.error('User not found for customer:', customerId);
    return false;
  }

  const subscriptionStatus = status === 'active' ? 'premium' : 'free';

  // Update user subscription
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_status: subscriptionStatus,
      subscription_end_date: currentPeriodEnd.toISOString(),
      subscription_cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString()
    })
    .eq('id', userData.id);

  if (updateError) {
    console.error('Failed to update user subscription:', updateError);
    return false;
  }

  // Log subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userData.id,
      event_type: 'subscription_updated',
      event_data: subscription,
      stripe_event_id: event.id,
      stripe_object_id: subscriptionId
    });

  return true;
}

async function handleSubscriptionDeleted(event: any, subscription: any): Promise<boolean> {
  console.log('Processing customer.subscription.deleted:', subscription.id);
  
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  // Find user by customer ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !userData) {
    console.error('User not found for customer:', customerId);
    return false;
  }

  // Downgrade user to free
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_status: 'free',
      current_plan: 'free',
      stripe_subscription_id: null,
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userData.id);

  if (updateError) {
    console.error('Failed to downgrade user:', updateError);
    return false;
  }

  // Log subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userData.id,
      event_type: 'subscription_cancelled',
      event_data: subscription,
      stripe_event_id: event.id,
      stripe_object_id: subscriptionId
    });

  // Track analytics
  await supabase
    .from('analytics_events')
    .insert({
      user_id: userData.id,
      event_name: 'subscription_cancelled',
      event_category: 'churn',
      event_properties: {
        subscription_id: subscriptionId,
        cancelled_at: new Date().toISOString()
      }
    });

  return true;
}

async function handlePaymentSucceeded(event: any, invoice: any): Promise<boolean> {
  console.log('Processing invoice.payment_succeeded:', invoice.id);
  
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    // Not a subscription payment, ignore
    return true;
  }

  // Find user by customer ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !userData) {
    console.error('User not found for customer:', customerId);
    return false;
  }

  // Get subscription details
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Ensure user has premium access
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_status: 'premium',
      subscription_end_date: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userData.id);

  if (updateError) {
    console.error('Failed to update user after payment success:', updateError);
    return false;
  }

  // Update payment attempt if exists
  await supabase
    .from('payment_attempts')
    .update({
      status: 'succeeded',
      completed_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', invoice.payment_intent);

  return true;
}

async function handlePaymentFailed(event: any, invoice: any): Promise<boolean> {
  console.log('Processing invoice.payment_failed:', invoice.id);
  
  const customerId = invoice.customer;

  // Find user by customer ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !userData) {
    console.error('User not found for customer:', customerId);
    return false;
  }

  // Log subscription event
  await supabase
    .from('subscription_events')
    .insert({
      user_id: userData.id,
      event_type: 'payment_failed',
      event_data: invoice,
      stripe_event_id: event.id,
      stripe_object_id: invoice.id
    });

  // Update payment attempt if exists
  await supabase
    .from('payment_attempts')
    .update({
      status: 'failed',
      failure_reason: 'payment_failed',
      completed_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', invoice.payment_intent);

  // Track analytics
  await supabase
    .from('analytics_events')
    .insert({
      user_id: userData.id,
      event_name: 'payment_failed',
      event_category: 'billing',
      event_properties: {
        invoice_id: invoice.id,
        amount_due: invoice.amount_due,
        attempt_count: invoice.attempt_count
      }
    });

  return true;
}

// Mark webhook event as processed
async function markWebhookProcessed(eventId: string, success: boolean, error?: string) {
  await supabase
    .from('stripe_webhook_events')
    .update({
      processed_status: success ? 'processed' : 'failed',
      processed_at: new Date().toISOString(),
      error_message: error || null
    })
    .eq('stripe_event_id', eventId);
}