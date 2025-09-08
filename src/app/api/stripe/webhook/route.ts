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
  
  // First, try to update existing user
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

  let userId = updatedUser?.id;

  if (error && error.code === 'PGRST116') { // No rows found
    console.log('User not found by customer ID, attempting to create user from Stripe customer data');
    
    try {
      // Fetch customer details from Stripe
      const stripe = (await import('../../../../lib/stripe')).default;
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        console.error('Stripe customer was deleted, cannot create user');
        return;
      }
      
      // Create user in Supabase using customer email
      const customerData = customer as any; // Type assertion for customer data
      if (customerData.email) {
        const { data: createdUserId, error: createError } = await supabase
          .rpc('create_user_by_email', {
            p_email: customerData.email,
            p_name: customerData.name || customerData.email.split('@')[0],
            p_stripe_customer_id: customerId
          });
        
        if (!createError && createdUserId) {
          console.log('✅ Created new user from Stripe customer:', createdUserId);
          userId = createdUserId;
          
          // Now update the newly created user with subscription details
          await supabase
            .from('users')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status === 'active' ? 'premium' : 'free',
              subscription_start_date: new Date().toISOString(),
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              current_plan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
              subscription_tier: subscription.status === 'active' ? 'premium' : 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', createdUserId);
            
        } else {
          console.error('Failed to create user from Stripe customer:', createError);
          return;
        }
      } else {
        console.error('Stripe customer has no email, cannot create user');
        return;
      }
      
    } catch (stripeError) {
      console.error('Failed to fetch Stripe customer:', stripeError);
      return;
    }
  } else if (error) {
    console.error('Error updating user subscription:', error);
    return;
  } else {
    console.log('✅ User subscription created:', updatedUser?.id);
  }
  
  // Track analytics event if we have a user ID
  if (userId) {
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
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
  
  // Update users table directly
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
  } else {
    console.log('✅ User subscription updated:', updatedUser?.id);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('❌ Subscription deleted:', subscription.id);
  
  // Update users table to mark subscription as cancelled
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      subscription_status: 'free',
      current_plan: 'free',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling user subscription:', error);
  } else {
    console.log('✅ User subscription cancelled:', updatedUser?.id);
    
    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: updatedUser.id,
        event_name: 'subscription_cancelled',
        event_category: 'churn',
        event_properties: {
          subscription_id: subscription.id,
          cancellation_reason: 'user_request'
        }
      });
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('💰 Payment succeeded:', invoice.id);
  
  // Find user by customer ID and update last successful payment
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', invoice.customer)
    .select()
    .single();

  if (!error && updatedUser) {
    // Track successful payment
    await supabase
      .from('analytics_events')
      .insert({
        user_id: updatedUser.id,
        event_name: 'payment_succeeded',
        event_category: 'revenue',
        event_properties: {
          invoice_id: invoice.id,
          amount_cents: invoice.amount_paid,
          subscription_id: invoice.subscription
        }
      });
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log('💸 Payment failed:', invoice.id);
  
  // Find user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (user) {
    // Track failed payment
    await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_name: 'payment_failed',
        event_category: 'revenue',
        event_properties: {
          invoice_id: invoice.id,
          amount_cents: invoice.amount_due,
          subscription_id: invoice.subscription,
          failure_reason: invoice.last_payment_error?.message || 'Unknown'
        }
      });
  }
}

async function handleCheckoutCompleted(session: any) {
  console.log('🛒 Checkout completed:', session.id);
  
  if (session.mode === 'subscription' && session.customer) {
    // Find or create user for tracking
    let userId = null;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', session.customer)
      .single();

    if (user) {
      userId = user.id;
    } else if (session.customer_details?.email) {
      // If user doesn't exist but we have email from checkout, create them
      try {
        const stripe = (await import('../../../../lib/stripe')).default;
        const customer = await stripe.customers.retrieve(session.customer);
        const customerData = customer as any;
        
        if (!customer.deleted && customerData.email) {
          const { data: createdUserId, error: createError } = await supabase
            .rpc('create_user_by_email', {
              p_email: customerData.email,
              p_name: customerData.name || session.customer_details?.name || customerData.email.split('@')[0],
              p_stripe_customer_id: session.customer
            });
          
          if (!createError) {
            userId = createdUserId;
            console.log('✅ Created user from checkout session:', userId);
          }
        }
      } catch (error) {
        console.error('Failed to create user from checkout:', error);
      }
    }

    // Track analytics event if we have a user ID
    if (userId) {
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_name: 'checkout_completed',
          event_category: 'conversion_funnel',
          event_properties: {
            session_id: session.id,
            mode: session.mode,
            amount_total: session.amount_total
          }
        });
    }
  }
}