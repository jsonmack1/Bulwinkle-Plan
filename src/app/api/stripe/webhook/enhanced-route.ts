import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Stripe webhook handler with comprehensive subscription tracking
 * This ensures both paid and promo subscriptions are properly handled
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

  // Initialize Supabase with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration');
    return NextResponse.json(
      { error: 'Database configuration error' },
      { status: 500 }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

  console.log('🎫 Enhanced Stripe webhook event received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase, stripe);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase, stripe);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase, stripe);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase, stripe);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase, stripe);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase, stripe);
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

// Enhanced handler for checkout completion
async function handleCheckoutCompleted(session: any, supabase: any, stripe: any) {
  console.log('🛒 Enhanced checkout completed:', session.id);
  console.log('🔍 Checkout session details:', {
    mode: session.mode,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    customerEmail: session.customer_details?.email,
    promoCode: session.metadata?.promo_code,
    subscriptionId: session.subscription
  });

  if (session.mode === 'subscription' && session.subscription) {
    const subscriptionId = session.subscription;
    const customerEmail = session.customer_details?.email;
    const promoCode = session.metadata?.promo_code;
    const isPromoSubscription = promoCode && session.amount_total === 0;
    
    console.log('🎯 Subscription checkout analysis:', {
      subscriptionId,
      customerEmail,
      promoCode,
      isPromoSubscription,
      amountPaid: session.amount_total / 100
    });

    // Get full subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'items.data.price', 'discount.promotion_code']
    });

    console.log('📊 Full subscription from Stripe:', {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer.id,
      customerEmail: subscription.customer.email,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      hasDiscount: !!subscription.discount,
      discountCode: subscription.discount?.promotion_code?.code,
      priceId: subscription.items.data[0]?.price?.id,
      interval: subscription.items.data[0]?.price?.recurring?.interval
    });

    // Determine subscription type and status
    const subscriptionType = isPromoSubscription ? 'promo' : 'paid';
    const isPremium = subscription.status === 'active' || subscription.status === 'trialing';
    
    console.log('🏷️ Subscription classification:', {
      type: subscriptionType,
      isPremium,
      status: subscription.status,
      promoCode: promoCode || 'none'
    });

    // Create comprehensive subscription record
    await createOrUpdateSubscription(supabase, {
      subscriptionId: subscription.id,
      customerId: subscription.customer.id,
      customerEmail: subscription.customer.email || customerEmail,
      status: subscription.status,
      isPremium,
      subscriptionType,
      promoCode: promoCode || null,
      currentPlan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
      startDate: new Date(subscription.current_period_start * 1000).toISOString(),
      endDate: new Date(subscription.current_period_end * 1000).toISOString(),
      priceId: subscription.items.data[0]?.price?.id,
      amount: subscription.items.data[0]?.price?.unit_amount || 0,
      currency: subscription.items.data[0]?.price?.currency || 'usd',
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      source: 'checkout_completed'
    });
  }
}

// Enhanced subscription creation handler
async function handleSubscriptionCreated(subscription: any, supabase: any, stripe: any) {
  console.log('🎉 Enhanced subscription created:', subscription.id);
  
  // This might be called after checkout.session.completed, so we need to update existing records
  await createOrUpdateSubscription(supabase, {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    isPremium: subscription.status === 'active' || subscription.status === 'trialing',
    startDate: new Date(subscription.current_period_start * 1000).toISOString(),
    endDate: new Date(subscription.current_period_end * 1000).toISOString(),
    currentPlan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
    priceId: subscription.items.data[0]?.price?.id,
    amount: subscription.items.data[0]?.price?.unit_amount || 0,
    currency: subscription.items.data[0]?.price?.currency || 'usd',
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    source: 'subscription_created'
  });
}

// Universal function to create or update subscription records
async function createOrUpdateSubscription(supabase: any, subscriptionData: any) {
  const {
    subscriptionId,
    customerId,
    customerEmail,
    status,
    isPremium,
    subscriptionType,
    promoCode,
    currentPlan,
    startDate,
    endDate,
    priceId,
    amount,
    currency,
    cancelAtPeriodEnd,
    source
  } = subscriptionData;

  console.log('💾 Creating/updating subscription record:', {
    subscriptionId,
    customerEmail: customerEmail || 'unknown',
    isPremium,
    subscriptionType: subscriptionType || 'unknown',
    promoCode: promoCode || 'none',
    source
  });

  try {
    // First, find or create the user
    let userId = null;
    
    if (customerEmail) {
      // Try to find existing user by email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, stripe_customer_id')
        .eq('email', customerEmail)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('✅ Found existing user:', userId);
        
        // Update stripe_customer_id if not set
        if (!existingUser.stripe_customer_id) {
          await supabase
            .from('users')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .rpc('create_user_by_email', {
            p_email: customerEmail,
            p_name: customerEmail.split('@')[0],
            p_stripe_customer_id: customerId
          });

        if (!createError && newUser) {
          userId = newUser;
          console.log('✅ Created new user:', userId);
        } else {
          console.error('❌ Failed to create user:', createError);
          return;
        }
      }
    } else {
      // Try to find user by stripe_customer_id
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('✅ Found user by stripe_customer_id:', userId);
      } else {
        console.error('❌ No email provided and no user found by stripe_customer_id');
        return;
      }
    }

    // Update user with comprehensive subscription data
    const updateData = {
      stripe_subscription_id: subscriptionId,
      subscription_status: isPremium ? 'premium' : 'free',
      subscription_type: subscriptionType || (promoCode ? 'promo' : 'paid'),
      subscription_source: promoCode || 'payment',
      current_plan: currentPlan,
      subscription_start_date: startDate,
      subscription_end_date: endDate,
      subscription_cancel_at_period_end: cancelAtPeriodEnd,
      stripe_price_id: priceId,
      subscription_amount_cents: amount,
      subscription_currency: currency,
      updated_at: new Date().toISOString()
    };

    console.log('📝 Updating user with subscription data:', updateData);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update user subscription:', updateError);
    } else {
      console.log('✅ Successfully updated user subscription:', updatedUser.id);
      
      // Log subscription event for tracking
      await supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          event_type: source,
          event_data: {
            subscriptionId,
            status,
            isPremium,
            subscriptionType: subscriptionType || 'unknown',
            promoCode: promoCode || null,
            amount: amount / 100,
            source
          },
          created_at: new Date().toISOString()
        });

      console.log('📊 Logged subscription event');
    }

  } catch (error) {
    console.error('❌ Error in createOrUpdateSubscription:', error);
  }
}

// Simplified handlers that use the universal function
async function handleSubscriptionUpdated(subscription: any, supabase: any, stripe: any) {
  console.log('📝 Enhanced subscription updated:', subscription.id);
  
  await createOrUpdateSubscription(supabase, {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    isPremium: subscription.status === 'active' || subscription.status === 'trialing',
    startDate: new Date(subscription.current_period_start * 1000).toISOString(),
    endDate: new Date(subscription.current_period_end * 1000).toISOString(),
    currentPlan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
    priceId: subscription.items.data[0]?.price?.id,
    amount: subscription.items.data[0]?.price?.unit_amount || 0,
    currency: subscription.items.data[0]?.price?.currency || 'usd',
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    source: 'subscription_updated'
  });
}

async function handleSubscriptionDeleted(subscription: any, supabase: any, stripe: any) {
  console.log('❌ Enhanced subscription deleted:', subscription.id);
  
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'free',
      current_plan: 'free',
      stripe_subscription_id: null,
      subscription_cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling user subscription:', error);
  } else {
    console.log('✅ User subscription cancelled');
  }
}

async function handlePaymentSucceeded(invoice: any, supabase: any, stripe: any) {
  console.log('💰 Enhanced payment succeeded:', invoice.id);
  // Payment tracking logic here
}

async function handlePaymentFailed(invoice: any, supabase: any, stripe: any) {
  console.log('💸 Enhanced payment failed:', invoice.id);
  // Payment failure tracking logic here
}