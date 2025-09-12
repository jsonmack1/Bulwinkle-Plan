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
        user_email: email || customerEmail || '',
        fingerprint_hash: fingerprintHash || '',
        session_id: sessionId || '',
        billing_period: billingPeriod,
        source: 'peabody_app',
        created_at: new Date().toISOString()
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

    // Handle promo codes - Validate using database first, then apply appropriate Stripe configuration
    if (promoCode) {
      const upperPromoCode = promoCode.toUpperCase();
      
      try {
        console.log('🎟️ Validating promo code:', upperPromoCode);
        
        // Validate promo code using our database function
        const { data: validationResult, error: validationError } = await supabase
          .rpc('is_promo_code_valid', {
            p_code: upperPromoCode,
            p_user_id: userId || null,
            p_fingerprint_hash: fingerprintHash || null
          });

        if (validationError || !validationResult || validationResult.length === 0) {
          console.error('❌ Promo code validation failed:', validationError);
          return NextResponse.json(
            { error: `Promotion code "${upperPromoCode}" is invalid or expired` },
            { status: 400 }
          );
        }

        const validation = validationResult[0];
        if (!validation.valid) {
          console.warn('⚠️ Invalid promo code:', validation.error_message);
          return NextResponse.json(
            { error: validation.error_message || `Promotion code "${upperPromoCode}" is invalid` },
            { status: 400 }
          );
        }

        const promoDetails = validation.code_details;
        console.log('✅ Valid promo code found:', promoDetails);

        // Apply promo code logic based on type
        if (promoDetails.type === 'free_subscription') {
          // Free subscription codes: Create subscription with trial period
          console.log('🎁 Free subscription promo detected:', promoDetails.free_months, 'months');
          
          // Calculate trial days (free months * 30 days)
          const trialDays = promoDetails.free_months * 30;
          
          sessionParams.subscription_data = {
            trial_period_days: trialDays,
            metadata: {
              promo_code: upperPromoCode,
              promo_type: 'free_subscription',
              free_months: promoDetails.free_months,
              source: 'database_promo'
            }
          };
          
          // Add to session metadata for webhook tracking
          sessionParams.metadata.promo_code = upperPromoCode;
          sessionParams.metadata.promo_type = 'free_subscription';
          sessionParams.metadata.free_months = promoDetails.free_months.toString();
          sessionParams.metadata.trial_days = trialDays.toString();
          sessionParams.metadata.is_trial = 'true';
          
          console.log(`✅ Free subscription configured: ${trialDays} days free, then regular billing`);
          
        } else if (promoDetails.type === 'discount_percent') {
          // Percentage discount: Try Stripe promotion codes first, fallback to coupon creation
          console.log('💰 Percentage discount promo:', promoDetails.discount_percent + '%');
          
          try {
            // Look for existing Stripe promotion code
            const promoCodeList = await stripe.promotionCodes.list({
              code: upperPromoCode,
              active: true,
              limit: 1
            });

            if (promoCodeList.data.length > 0) {
              // Use existing Stripe promotion code
              const stripePromoCode = promoCodeList.data[0];
              console.log('✅ Found existing Stripe promotion code');
              
              sessionParams.discounts = [{
                promotion_code: stripePromoCode.id
              }];
              
            } else {
              // Create a one-time coupon for this checkout
              console.log('🏷️ Creating one-time Stripe coupon for discount');
              
              const coupon = await stripe.coupons.create({
                percent_off: promoDetails.discount_percent,
                duration: 'once',
                name: `${upperPromoCode} - ${promoDetails.discount_percent}% off`,
                metadata: {
                  promo_code: upperPromoCode,
                  source: 'database_promo'
                }
              });
              
              sessionParams.discounts = [{
                coupon: coupon.id
              }];
              
              console.log('✅ Created coupon:', coupon.id);
            }
            
          } catch (stripeError) {
            console.error('❌ Stripe discount creation failed:', stripeError);
            return NextResponse.json(
              { error: 'Failed to apply discount code' },
              { status: 500 }
            );
          }
          
          // Add to metadata for tracking
          sessionParams.metadata.promo_code = upperPromoCode;
          sessionParams.metadata.promo_type = 'discount_percent';
          sessionParams.metadata.discount_percent = promoDetails.discount_percent.toString();
          
        } else if (promoDetails.type === 'free_trial') {
          // Free trial: Apply trial period
          console.log('⏰ Free trial promo:', promoDetails.trial_days, 'days');
          
          sessionParams.subscription_data = {
            trial_period_days: promoDetails.trial_days,
            metadata: {
              promo_code: upperPromoCode,
              promo_type: 'free_trial',
              trial_days: promoDetails.trial_days,
              source: 'database_promo'
            }
          };
          
          // Add to session metadata for webhook tracking
          sessionParams.metadata.promo_code = upperPromoCode;
          sessionParams.metadata.promo_type = 'free_trial';
          sessionParams.metadata.trial_days = promoDetails.trial_days.toString();
          sessionParams.metadata.is_trial = 'true';
          
          console.log(`✅ Free trial configured: ${promoDetails.trial_days} days free`);
          
        } else {
          console.warn('⚠️ Unsupported promo code type:', promoDetails.type);
          return NextResponse.json(
            { error: `Promotion code type "${promoDetails.type}" is not supported` },
            { status: 400 }
          );
        }
        
      } catch (promoError) {
        console.error('❌ Error processing promotion code:', promoError);
        return NextResponse.json(
          { error: 'Failed to process promotion code' },
          { status: 500 }
        );
      }
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Calculate actual amount after promo codes/discounts
    let actualAmountCents = await getPriceAmount(stripe, priceId);
    
    // For free subscription promo codes (trials), the upfront amount should be 0
    if (sessionParams.subscription_data?.trial_period_days && sessionParams.metadata?.promo_type === 'free_subscription') {
      actualAmountCents = 0;
      console.log('💰 Free subscription promo - recording $0.00 upfront amount');
    } else if (sessionParams.discounts && sessionParams.discounts.length > 0) {
      // For discount coupons, we'll record the original amount since Stripe handles the discount
      console.log('💰 Discount applied - recording original amount (Stripe will handle discount)');
    }

    // Log the checkout attempt with correct amount
    await supabase
      .from('payment_attempts')
      .insert({
        user_id: userId || null,
        stripe_session_id: session.id,
        amount_cents: actualAmountCents,
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