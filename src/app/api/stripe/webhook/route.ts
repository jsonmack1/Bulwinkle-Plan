import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * Stripe webhook handler for subscription events
 * POST /api/stripe/webhook
 */
export async function POST(request: NextRequest) {
  const stripe = (await import('../../../../lib/stripe')).default;
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

  // Handle the event
  console.log('🎫 Stripe webhook event received:', event.type);

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
        
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Webhook handler functions

async function handleSubscriptionCreated(subscription: any) {
  console.log('🎉 Subscription created:', subscription.id);
  
  const customerId = subscription.customer;
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (existingUser) {
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: existingUser.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: subscription.items.data[0]?.price?.id,
        billing_cycle: subscription.items.data[0]?.price?.recurring?.interval,
        updated_at: new Date().toISOString()
      });

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: existingUser.id,
        event_name: 'subscription_created',
        event_category: 'conversion_funnel',
        event_properties: {
          subscription_id: subscription.id,
          plan_id: subscription.items.data[0]?.price?.id,
          billing_cycle: subscription.items.data[0]?.price?.recurring?.interval
        }
      });
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('📝 Subscription updated:', subscription.id);
  
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (existingSubscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: subscription.items.data[0]?.price?.id,
        billing_cycle: subscription.items.data[0]?.price?.recurring?.interval,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: existingSubscription.user_id,
        event_name: 'subscription_updated',
        event_category: 'subscription_lifecycle',
        event_properties: {
          subscription_id: subscription.id,
          status: subscription.status,
          plan_id: subscription.items.data[0]?.price?.id
        }
      });
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('❌ Subscription deleted:', subscription.id);
  
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (existingSubscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: existingSubscription.user_id,
        event_name: 'subscription_cancelled',
        event_category: 'subscription_lifecycle',
        event_properties: {
          subscription_id: subscription.id,
          cancellation_reason: 'stripe_webhook'
        }
      });
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('💰 Payment succeeded:', invoice.id);
  
  const customerId = invoice.customer;
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    // Log payment attempt as successful
    await supabase
      .from('payment_attempts')
      .insert({
        user_id: user.id,
        stripe_invoice_id: invoice.id,
        amount_cents: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded'
      });

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_name: 'payment_succeeded',
        event_category: 'conversion_funnel',
        event_properties: {
          invoice_id: invoice.id,
          amount_cents: invoice.amount_paid,
          currency: invoice.currency
        }
      });
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log('💳 Payment failed:', invoice.id);
  
  const customerId = invoice.customer;
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    // Log payment attempt as failed
    await supabase
      .from('payment_attempts')
      .insert({
        user_id: user.id,
        stripe_invoice_id: invoice.id,
        amount_cents: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed'
      });

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_name: 'payment_failed',
        event_category: 'conversion_funnel',
        event_properties: {
          invoice_id: invoice.id,
          amount_cents: invoice.amount_due,
          currency: invoice.currency,
          failure_reason: 'payment_method_failed'
        }
      });
  }
}

async function handleCheckoutCompleted(session: any) {
  console.log('🎊 Checkout completed:', session.id);
  
  const customerId = session.customer;
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    // Update payment attempt as completed
    await supabase
      .from('payment_attempts')
      .update({ 
        status: 'completed',
        stripe_session_id: session.id 
      })
      .eq('stripe_session_id', session.id);

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_name: 'checkout_completed',
        event_category: 'conversion_funnel',
        event_properties: {
          session_id: session.id,
          customer_id: customerId,
          payment_status: session.payment_status
        }
      });
  }
}