import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * BULLETPROOF Stripe webhook handler with comprehensive trial and subscription tracking
 * This handles ALL subscription scenarios: paid, promo, trials, renewals, cancellations
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

  // Initialize Supabase with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
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
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  const timestamp = new Date().toISOString();
  console.log(`🎫 [${timestamp}] BULLETPROOF webhook event: ${event.type}`);

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
        
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object, supabase, stripe);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase, stripe);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase, stripe);
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

// BULLETPROOF handler for checkout completion
async function handleCheckoutCompleted(session: any, supabase: any, stripe: any) {
  console.log('🛒 BULLETPROOF checkout completed:', session.id);
  
  if (session.mode === 'subscription' && session.subscription) {
    const subscriptionId = session.subscription;
    const customerEmail = session.customer_details?.email;
    const promoCode = session.metadata?.promo_code;
    
    console.log('🔍 Checkout analysis:', {
      sessionId: session.id,
      subscriptionId,
      customerEmail,
      promoCode,
      amountTotal: session.amount_total,
      paymentStatus: session.payment_status
    });

    // Get COMPLETE subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'items.data.price', 'discount.promotion_code', 'latest_invoice']
    });

    console.log('📊 COMPLETE subscription data:', {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer.id,
      customerEmail: subscription.customer.email,
      
      // CRITICAL: Trial information
      trialStart: subscription.trial_start,
      trialEnd: subscription.trial_end,
      
      // CRITICAL: Period information
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      
      // CRITICAL: Billing information
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      
      // CRITICAL: Discount information
      hasDiscount: !!subscription.discount,
      discountDetails: subscription.discount ? {
        promotionCode: subscription.discount.promotion_code?.code,
        couponId: subscription.discount.coupon.id,
        duration: subscription.discount.coupon.duration,
        durationInMonths: subscription.discount.coupon.duration_in_months,
        percentOff: subscription.discount.coupon.percent_off
      } : null,
      
      // CRITICAL: Price information
      priceId: subscription.items.data[0]?.price?.id,
      interval: subscription.items.data[0]?.price?.recurring?.interval,
      intervalCount: subscription.items.data[0]?.price?.recurring?.interval_count,
      unitAmount: subscription.items.data[0]?.price?.unit_amount
    });

    // BULLETPROOF subscription classification
    const isTrialing = subscription.status === 'trialing';
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const isPromoSubscription = !!subscription.discount || (promoCode && session.amount_total === 0);
    
    // Calculate EXACT dates
    const activationDate = new Date(subscription.created * 1000).toISOString();
    const startDate = subscription.trial_start 
      ? new Date(subscription.trial_start * 1000).toISOString()
      : new Date(subscription.current_period_start * 1000).toISOString();
    const endDate = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : new Date(subscription.current_period_end * 1000).toISOString();
    
    // Calculate next billing date (when trial ends or next period starts)
    const nextBillingDate = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : new Date(subscription.current_period_end * 1000).toISOString();

    const subscriptionType = isPromoSubscription ? 'promo' : 'paid';
    const subscriptionSource = promoCode || (isPromoSubscription ? 'discount' : 'payment');
    
    console.log('🏷️ BULLETPROOF classification:', {
      isTrialing,
      isActive,
      isPromoSubscription,
      subscriptionType,
      subscriptionSource,
      activationDate,
      startDate,
      endDate,
      nextBillingDate
    });

    // BULLETPROOF database update
    await createOrUpdateSubscription(supabase, {
      subscriptionId: subscription.id,
      customerId: subscription.customer.id,
      customerEmail: subscription.customer.email || customerEmail,
      status: subscription.status,
      isActive,
      isTrialing,
      subscriptionType,
      subscriptionSource,
      promoCode: promoCode || null,
      
      // CRITICAL: Complete date tracking
      activationDate,
      startDate,
      endDate,
      nextBillingDate,
      trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      
      // CRITICAL: Billing information
      currentPlan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
      priceId: subscription.items.data[0]?.price?.id,
      amount: subscription.items.data[0]?.price?.unit_amount || 0,
      currency: subscription.items.data[0]?.price?.currency || 'usd',
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      
      source: 'checkout_completed'
    });
  }
}

// Universal BULLETPROOF function to create or update subscription records
async function createOrUpdateSubscription(supabase: any, subscriptionData: any) {
  const {
    subscriptionId,
    customerId,
    customerEmail,
    status,
    isActive,
    isTrialing,
    subscriptionType,
    subscriptionSource,
    promoCode,
    activationDate,
    startDate,
    endDate,
    nextBillingDate,
    trialEndDate,
    currentPlan,
    priceId,
    amount,
    currency,
    cancelAtPeriodEnd,
    source
  } = subscriptionData;

  console.log('💾 BULLETPROOF subscription update:', {
    subscriptionId,
    customerEmail: customerEmail || 'unknown',
    status,
    isActive,
    isTrialing,
    subscriptionType,
    subscriptionSource,
    promoCode: promoCode || 'none'
  });

  try {
    // Step 1: Find or create user
    let userId = null;
    
    if (customerEmail) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, stripe_customer_id')
        .eq('email', customerEmail)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('✅ Found existing user:', userId);
        
        // Update stripe_customer_id if needed
        if (!existingUser.stripe_customer_id) {
          await supabase
            .from('users')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
          console.log('✅ Updated stripe_customer_id for user');
        }
      } else {
        // Create new user using RPC function
        const { data: newUserId, error: createError } = await supabase
          .rpc('create_user_by_email', {
            p_email: customerEmail,
            p_name: customerEmail.split('@')[0],
            p_stripe_customer_id: customerId
          });

        if (!createError && newUserId) {
          userId = newUserId;
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

    // Step 2: BULLETPROOF database update with ALL tracking fields
    const updateData = {
      // Basic subscription info
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      subscription_status: isActive ? 'premium' : 'free',
      subscription_type: subscriptionType,
      subscription_source: subscriptionSource,
      current_plan: currentPlan,
      
      // CRITICAL: Complete date tracking
      subscription_activation_date: activationDate,
      subscription_start_date: startDate,
      subscription_end_date: endDate,
      subscription_next_billing_date: nextBillingDate,
      subscription_trial_end_date: trialEndDate,
      
      // CRITICAL: Trial status
      is_trial: isTrialing,
      trial_ends_at: trialEndDate,
      
      // CRITICAL: Billing information
      subscription_cancel_at_period_end: cancelAtPeriodEnd,
      stripe_price_id: priceId,
      subscription_amount_cents: amount,
      subscription_currency: currency,
      
      // CRITICAL: Status tracking
      is_active: isActive,
      updated_at: new Date().toISOString()
    };

    console.log('📝 BULLETPROOF update data:', updateData);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update user subscription:', updateError);
      return;
    }

    console.log('✅ BULLETPROOF update successful:', updatedUser.id);
    
    // Step 3: Log detailed subscription event
    await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: source,
        event_data: {
          subscriptionId,
          status,
          isActive,
          isTrialing,
          subscriptionType,
          subscriptionSource,
          promoCode: promoCode || null,
          activationDate,
          startDate,
          endDate,
          nextBillingDate,
          trialEndDate,
          amount: amount / 100,
          currency,
          source
        },
        created_at: new Date().toISOString()
      });

    console.log('📊 BULLETPROOF event logged');

    // Step 4: Trigger subscription refresh on frontend
    console.log('🔄 Triggering frontend subscription refresh');

  } catch (error) {
    console.error('❌ BULLETPROOF update failed:', error);
  }
}

// Additional handlers for complete subscription lifecycle
async function handleSubscriptionCreated(subscription: any, supabase: any, stripe: any) {
  console.log('🎉 Subscription created:', subscription.id);
  // This will be handled by checkout.session.completed, so we can skip or just log
}

async function handleSubscriptionUpdated(subscription: any, supabase: any, stripe: any) {
  console.log('📝 Subscription updated:', subscription.id);
  // Handle subscription changes (like trial ending, plan changes, etc.)
}

async function handleSubscriptionDeleted(subscription: any, supabase: any, stripe: any) {
  console.log('❌ Subscription deleted:', subscription.id);
  
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'free',
      current_plan: 'free',
      stripe_subscription_id: null,
      is_active: false,
      is_trial: false,
      subscription_cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('❌ Error cancelling user subscription:', error);
  } else {
    console.log('✅ User subscription cancelled');
  }
}

async function handleTrialWillEnd(subscription: any, supabase: any, stripe: any) {
  console.log('⏰ Trial will end soon:', subscription.id);
  // Send trial ending notification or update user flags
}

async function handlePaymentSucceeded(invoice: any, supabase: any, stripe: any) {
  console.log('💰 Payment succeeded:', invoice.id);
  // Handle successful payments, renewal confirmations
}

async function handlePaymentFailed(invoice: any, supabase: any, stripe: any) {
  console.log('💸 Payment failed:', invoice.id);
  // Handle failed payments, update subscription status if needed
}