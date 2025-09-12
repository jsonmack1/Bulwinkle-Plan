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
        
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
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

// Enhanced subscription created handler - handles customer ID mismatches and promo codes
async function handleSubscriptionCreated(subscription: any) {
  console.log('🎉 Subscription created:', subscription.id);
  console.log('🔍 Subscription details:', {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    trial_end: subscription.trial_end,
    metadata: subscription.metadata
  });
  
  const customerId = subscription.customer;
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const plan = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
  
  let updatedUser = null;
  let updateError = null;
  
  // Try to find and update user by stripe_customer_id first
  console.log('🔍 Attempting to find user by stripe_customer_id:', customerId);
  
  const { data: userByCustomerId, error: customerError } = await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: isActive ? 'premium' : 'free',
      current_plan: plan,
      subscription_end_date: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null,
      stripe_customer_id: customerId, // Ensure this gets set
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)
    .select()
    .single();

  if (!customerError && userByCustomerId) {
    updatedUser = userByCustomerId;
    console.log('✅ User found and updated by stripe_customer_id:', updatedUser.id);
  } else {
    console.warn('⚠️ Could not find user by stripe_customer_id, trying alternative methods');
    console.log('🔍 Customer error:', customerError);
    
    // Fallback 1: Try to get user from Stripe customer metadata
    try {
      const stripe = (await import('../../../../lib/stripe')).default;
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.metadata?.user_id) {
        console.log('🔍 Found user_id in Stripe customer metadata:', customer.metadata.user_id);
        
        const { data: userByMetadata, error: metadataError } = await supabase
          .from('users')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: isActive ? 'premium' : 'free',
            current_plan: plan,
            subscription_end_date: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : null,
            stripe_customer_id: customerId, // Set the missing customer ID
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.metadata.user_id)
          .select()
          .single();
          
        if (!metadataError && userByMetadata) {
          updatedUser = userByMetadata;
          console.log('✅ User found and updated by metadata user_id:', updatedUser.id);
        } else {
          console.error('❌ Failed to update user by metadata:', metadataError);
        }
      }
    } catch (stripeError) {
      console.error('❌ Failed to retrieve Stripe customer:', stripeError);
    }
    
    // Fallback 2: Try to find user by email if we still haven't found them
    if (!updatedUser) {
      try {
        const stripe = (await import('../../../../lib/stripe')).default;
        const customer = await stripe.customers.retrieve(customerId);
        
        if (customer.email) {
          console.log('🔍 Trying to find user by email:', customer.email);
          
          const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: isActive ? 'premium' : 'free',
              current_plan: plan,
              subscription_end_date: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000).toISOString() 
                : null,
              stripe_customer_id: customerId, // Set the missing customer ID
              updated_at: new Date().toISOString()
            })
            .eq('email', customer.email)
            .select()
            .single();
            
          if (!emailError && userByEmail) {
            updatedUser = userByEmail;
            console.log('✅ User found and updated by email:', updatedUser.id);
          } else {
            console.error('❌ Failed to update user by email:', emailError);
          }
        }
      } catch (stripeError) {
        console.error('❌ Failed to retrieve customer for email lookup:', stripeError);
      }
    }
  }

  if (!updatedUser) {
    console.error('❌ CRITICAL: Could not find user to update for subscription:', subscription.id);
    console.error('❌ Customer ID:', customerId);
    return;
  }

  console.log('✅ Final user subscription update successful:', {
    userId: updatedUser.id,
    subscriptionId: subscription.id,
    status: updatedUser.subscription_status,
    plan: updatedUser.current_plan
  });

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
        trial: subscription.status === 'trialing',
        customer_id: customerId
      }
    });
}

// Enhanced subscription updated handler - handles customer ID mismatches
async function handleSubscriptionUpdated(subscription: any) {
  console.log('📝 Subscription updated:', subscription.id);
  console.log('🔍 Update details:', {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    trial_end: subscription.trial_end
  });
  
  const customerId = subscription.customer;
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const plan = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
  
  let updatedUser = null;
  
  // Try to update by subscription ID first (most reliable)
  console.log('🔍 Attempting to find user by stripe_subscription_id:', subscription.id);
  
  const { data: userBySubId, error: subError } = await supabase
    .from('users')
    .update({
      subscription_status: isActive ? 'premium' : 'free',
      current_plan: plan,
      subscription_end_date: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      stripe_customer_id: customerId, // Ensure this is set
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
    .select()
    .single();

  if (!subError && userBySubId) {
    updatedUser = userBySubId;
    console.log('✅ User found and updated by subscription ID:', updatedUser.id);
  } else {
    console.warn('⚠️ Could not find user by subscription ID, trying by customer ID');
    
    // Fallback: Try to find by customer ID
    const { data: userByCustomerId, error: customerError } = await supabase
      .from('users')
      .update({
        stripe_subscription_id: subscription.id, // Set this too
        subscription_status: isActive ? 'premium' : 'free',
        current_plan: plan,
        subscription_end_date: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId)
      .select()
      .single();

    if (!customerError && userByCustomerId) {
      updatedUser = userByCustomerId;
      console.log('✅ User found and updated by customer ID:', updatedUser.id);
    } else {
      console.error('❌ Could not find user by either method:', { subError, customerError });
    }
  }

  if (!updatedUser) {
    console.error('❌ CRITICAL: Could not find user to update for subscription update:', subscription.id);
    return;
  }

  console.log('✅ Subscription update successful:', {
    userId: updatedUser.id,
    status: updatedUser.subscription_status,
    plan: updatedUser.current_plan
  });
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

// Handle checkout session completed - record promo code usage and ensure user upgrade
async function handleCheckoutCompleted(session: any) {
  console.log('✅ Checkout completed:', session.id);
  console.log('🔍 Session details:', {
    id: session.id,
    customer: session.customer,
    subscription: session.subscription,
    amount_total: session.amount_total,
    payment_status: session.payment_status,
    metadata: session.metadata
  });
  
  const metadata = session.metadata || {};
  const userId = metadata.user_id;
  const userEmail = metadata.user_email;
  const promoCode = metadata.promo_code;
  
  // CRITICAL FIX: For promo code checkouts, ensure user gets upgraded immediately
  // This handles cases where the subscription webhook hasn't fired yet
  if (session.subscription && (userId || userEmail)) {
    console.log('🔧 Attempting immediate user upgrade from checkout session');
    
    let upgradeSuccess = false;
    
    // Try to upgrade by user_id first
    if (userId) {
      console.log('🔍 Trying to upgrade user by ID:', userId);
      
      const { data: userByIdUpdate, error: idError } = await supabase
        .from('users')
        .update({
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          subscription_status: 'premium',
          current_plan: metadata.billing_period === 'annual' ? 'annual' : 'monthly',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (!idError && userByIdUpdate) {
        console.log('✅ User upgraded by ID:', userByIdUpdate.id);
        upgradeSuccess = true;
      } else {
        console.warn('⚠️ Failed to upgrade by user ID:', idError);
      }
    }
    
    // Fallback: Try to upgrade by email
    if (!upgradeSuccess && userEmail) {
      console.log('🔍 Trying to upgrade user by email:', userEmail);
      
      const { data: userByEmailUpdate, error: emailError } = await supabase
        .from('users')
        .update({
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          subscription_status: 'premium',
          current_plan: metadata.billing_period === 'annual' ? 'annual' : 'monthly',
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail)
        .select()
        .single();
        
      if (!emailError && userByEmailUpdate) {
        console.log('✅ User upgraded by email:', userByEmailUpdate.id);
        upgradeSuccess = true;
      } else {
        console.warn('⚠️ Failed to upgrade by email:', emailError);
      }
    }
    
    if (!upgradeSuccess) {
      console.error('❌ CRITICAL: Could not upgrade user from checkout session');
      console.error('❌ Session metadata:', metadata);
    }
  }
  
  // Record promo code usage if applicable
  if (promoCode) {
    console.log('🎟️ Recording promo code usage from checkout:', promoCode);
    
    try {
      // Apply promo code using database function to record usage
      const { data: applicationResult, error: applicationError } = await supabase
        .rpc('apply_promo_code', {
          p_code: promoCode,
          p_user_id: userId || null,
          p_fingerprint_hash: metadata.fingerprint_hash || null,
          p_order_amount_cents: session.amount_total || null,
          p_ip_hash: null, // Not available in webhook
          p_user_agent_hash: null, // Not available in webhook
          p_metadata: {
            stripe_session_id: session.id,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            promo_type: metadata.promo_type,
            free_months: metadata.free_months,
            trial_days: metadata.trial_days,
            source: 'stripe_checkout_webhook'
          }
        });

      if (applicationError) {
        console.error('❌ Failed to record promo code usage:', applicationError);
      } else {
        console.log('✅ Promo code usage recorded successfully');
      }
      
    } catch (error) {
      console.error('❌ Error recording promo code usage:', error);
    }
  }
}