import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

interface CreateCheckoutRequest {
  userId?: string;
  priceId: string;
  billingPeriod?: 'annual' | 'monthly';
  successUrl: string;
  cancelUrl: string;
  email?: string;
  fingerprintHash?: string;
  sessionId?: string;
  promoCode?: string;
  promoCodeData?: any;
  discountAmount?: number;
  finalAmount?: number;
}

/**
 * Create Stripe checkout session for subscription
 * POST /api/stripe/create-checkout
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    // Dynamic import of Stripe to avoid build-time errors
    const stripe = (await import('../../../../lib/stripe')).default;

    const body: CreateCheckoutRequest = await request.json();
    const { 
      userId, 
      priceId, 
      billingPeriod = 'annual', 
      successUrl, 
      cancelUrl, 
      email, 
      fingerprintHash, 
      sessionId,
      promoCode,
      promoCodeData,
      discountAmount,
      finalAmount
    } = body;

    console.log('🔍 Checkout API Debug:', {
      priceId,
      billingPeriod,
      mode: 'subscription', // Both monthly and annual use subscription mode
      userId,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY
    });

    // Validate required fields
    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Get client IP for tracking
    const clientIP = getClientIP(request);

    let customerId: string | undefined;
    let customerEmail: string | undefined;

    // If user is logged in, get or create Stripe customer
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('stripe_customer_id, email, name')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        customerEmail = userData.email;
        
        if (userData.stripe_customer_id) {
          // Verify customer exists in Stripe
          try {
            await stripe.customers.retrieve(userData.stripe_customer_id);
            customerId = userData.stripe_customer_id;
          } catch (stripeError) {
            console.warn('Stripe customer not found, will create new one');
            customerId = undefined;
          }
        }
        
        // Create Stripe customer if doesn't exist
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: userData.email,
            name: userData.name,
            metadata: {
              user_id: userId,
              source: 'peabody_app'
            }
          });
          
          customerId = customer.id;
          
          // Update user record with Stripe customer ID
          await supabase
            .from('users')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
        }
      }
    } else if (email) {
      customerEmail = email;
      
      // For anonymous users with email, create both Supabase user and Stripe customer
      // This ensures the webhook can find the user later
      try {
        // Create Stripe customer first
        const customer = await stripe.customers.create({
          email: email,
          metadata: {
            source: 'peabody_app_anonymous',
            fingerprint_hash: fingerprintHash || 'unknown'
          }
        });
        
        customerId = customer.id;
        
        // Create or find user in Supabase using the new utility function
        const { data: createdUser, error: createError } = await supabase
          .rpc('create_user_by_email', {
            p_email: email,
            p_name: email.split('@')[0], // Use email prefix as name
            p_stripe_customer_id: customerId
          });
          
        if (!createError && createdUser) {
          console.log('✅ Created Supabase user for anonymous checkout:', createdUser);
        } else {
          console.warn('Failed to create Supabase user:', createError);
        }
        
      } catch (error) {
        console.error('Failed to create customer and user:', error);
        // Continue with checkout even if user creation fails
      }
    }

    // Create checkout session - both monthly and annual are subscriptions
    const sessionParams: any = {
      mode: 'subscription', // Both monthly and annual are recurring subscriptions
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        user_id: userId || '',
        fingerprint_hash: fingerprintHash || '',
        session_id: sessionId || '',
        billing_period: billingPeriod,
        source: 'peabody_app'
      },
      // Custom fields removed due to API compatibility issues
      // You can collect this information in your app instead
    };

    // Add customer information
    if (customerId) {
      sessionParams.customer = customerId;
    } else if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // Handle promo codes - PAPERCLIP gets special trial treatment
    if (promoCode) {
      const upperPromoCode = promoCode.toUpperCase();
      
      if (upperPromoCode === 'PAPERCLIP') {
        // PAPERCLIP: One-time 30-day trial using Stripe's built-in trial functionality
        console.log('🎟️ PAPERCLIP detected - applying 30-day trial');
        
        sessionParams.subscription_data = {
          trial_period_days: 30, // One-time 30-day trial
          metadata: {
            promo_code: 'PAPERCLIP',
            trial_type: 'one_time_30_day',
            source: 'paperclip_promo'
          }
        };
        
        // Add to session metadata for webhook tracking
        sessionParams.metadata.promo_code = 'PAPERCLIP';
        sessionParams.metadata.trial_days = '30';
        sessionParams.metadata.is_trial = 'true';
        
        console.log('✅ PAPERCLIP trial configured: 30 days free, then regular billing');
        
      } else {
        // Other promo codes: Use standard promotion code system
        try {
          const promoCodeList = await stripe.promotionCodes.list({
            code: upperPromoCode,
            active: true,
            limit: 1
          });

          if (promoCodeList.data.length > 0) {
            const validPromoCode = promoCodeList.data[0];
            console.log('✅ Valid promotion code found:', validPromoCode.code);
            
            sessionParams.discounts = [{
              promotion_code: validPromoCode.id
            }];
            
            // Add to metadata for tracking
            sessionParams.metadata.promo_code = upperPromoCode;
            sessionParams.metadata.promo_code_id = validPromoCode.id;
            
          } else {
            console.warn('⚠️ Invalid or inactive promotion code:', upperPromoCode);
            return NextResponse.json(
              { error: `Promotion code "${upperPromoCode}" is invalid or expired` },
              { status: 400 }
            );
          }
        } catch (promoError) {
          console.error('❌ Error validating promotion code:', promoError);
          return NextResponse.json(
            { error: 'Failed to validate promotion code' },
            { status: 400 }
          );
        }
      }
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Log the checkout attempt
    await supabase
      .from('payment_attempts')
      .insert({
        user_id: userId || null,
        stripe_session_id: session.id,
        amount_cents: await getPriceAmount(stripe, priceId),
        currency: 'usd',
        status: 'processing',
        subscription_tier: billingPeriod === 'annual' ? 'annual' : 'monthly',
        billing_cycle: billingPeriod,
        fingerprint_hash: fingerprintHash || null,
        ip_hash: require('crypto').createHash('sha256').update(clientIP).digest('hex')
      });

    // Track analytics event
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId || null,
        session_id: sessionId || null,
        event_name: 'stripe_checkout_initiated',
        event_category: 'conversion_funnel',
        event_properties: {
          price_id: priceId,
          billing_cycle: billingPeriod,
          has_account: !!userId,
          checkout_session_id: session.id
        },
        fingerprint_hash: fingerprintHash || null,
        ip_hash: require('crypto').createHash('sha256').update(clientIP).digest('hex'),
        user_agent: request.headers.get('user-agent') || 'unknown'
      });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      customerId
    });

  } catch (error) {
    console.error('Stripe checkout creation failed:', error);
    
    // Track failed checkout attempt
    try {
      await supabase
        .from('analytics_events')
        .insert({
          user_id: null,
          session_id: null,
          event_name: 'stripe_checkout_failed',
          event_category: 'conversion_funnel',
          event_properties: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
    } catch (trackingError) {
      console.error('Failed to track checkout error:', trackingError);
    }

    return NextResponse.json(
      { 
        error: 'Checkout creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get price amount from Stripe
async function getPriceAmount(stripe: any, priceId: string): Promise<number> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return price.unit_amount || 0;
  } catch (error) {
    console.error('Failed to get price amount:', error);
    return 0;
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || xRealIP || xForwardedFor?.split(',')[0] || 'unknown';
}