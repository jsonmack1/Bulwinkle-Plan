import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

interface ApplyPromoRequest {
  code: string;
  userId?: string;
  fingerprintHash?: string;
  orderAmount?: number; // in cents
  subscriptionId?: string; // Stripe subscription ID
  metadata?: Record<string, any>;
}

interface PromoCodeApplicationResponse {
  success: boolean;
  promoCodeUseId?: string;
  discountApplied?: number; // in cents
  finalAmount?: number; // in cents
  subscriptionModification?: {
    type: 'free_months' | 'discount' | 'trial_extension' | 'free_subscription_granted' | 'free_subscription_pending';
    value?: number;
    months?: number;
    endDate?: string;
    description: string;
  };
  error?: string;
}

/**
 * Apply a promo code to an order or subscription
 * POST /api/promo/apply
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎟️ Promo code application API called');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase credentials: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body: ApplyPromoRequest = await request.json();
    const { code, userId, fingerprintHash, orderAmount, subscriptionId, metadata } = body;
    
    console.log('🎟️ Applying promo code:', { 
      code, 
      userId: userId ? 'present' : 'null', 
      fingerprintHash: fingerprintHash ? fingerprintHash.substring(0, 8) + '...' : 'null',
      orderAmount,
      subscriptionId: subscriptionId ? 'present' : 'null'
    });

    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Promo code is required'
      } as PromoCodeApplicationResponse, { status: 400 });
    }

    // Clean and normalize the promo code
    const normalizedCode = code.trim().toUpperCase();
    
    if (normalizedCode.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Promo code cannot be empty'
      } as PromoCodeApplicationResponse, { status: 400 });
    }

    // Get client context for tracking
    const clientIP = getClientIP(request);
    const ipHash = createHash('sha256').update(clientIP).digest('hex');
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const userAgentHash = createHash('sha256').update(userAgent).digest('hex');
    
    // Apply the promo code using the database function
    const { data: applicationResult, error: applicationError } = await supabase
      .rpc('apply_promo_code', {
        p_code: normalizedCode,
        p_user_id: userId || null,
        p_fingerprint_hash: fingerprintHash || null,
        p_order_amount_cents: orderAmount || null,
        p_ip_hash: ipHash,
        p_user_agent_hash: userAgentHash,
        p_metadata: {
          subscriptionId: subscriptionId || null,
          clientContext: {
            referrer: request.headers.get('referer') || 'direct',
            timestamp: new Date().toISOString()
          },
          customMetadata: metadata || {}
        }
      });

    if (applicationError) {
      console.error('❌ Promo code application error:', applicationError);
      return NextResponse.json({
        success: false,
        error: 'Failed to apply promo code'
      } as PromoCodeApplicationResponse, { status: 500 });
    }

    if (!applicationResult || applicationResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to apply promo code'
      } as PromoCodeApplicationResponse, { status: 500 });
    }

    const result = applicationResult[0];
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error_message || 'Failed to apply promo code'
      } as PromoCodeApplicationResponse);
    }

    // Get the promo code details for response
    const { data: promoCodeData, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (promoError || !promoCodeData) {
      console.error('❌ Failed to fetch promo code details:', promoError);
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve promo code details'
      } as PromoCodeApplicationResponse, { status: 500 });
    }

    // Calculate final amount if order amount was provided
    const finalAmount = orderAmount ? orderAmount - result.discount_applied_cents : undefined;

    // Determine subscription modification details
    let subscriptionModification = undefined;
    if (promoCodeData.type === 'free_subscription' && promoCodeData.free_months > 0) {
      subscriptionModification = {
        type: 'free_months' as const,
        value: promoCodeData.free_months,
        description: `${promoCodeData.free_months} month${promoCodeData.free_months > 1 ? 's' : ''} free`
      };
    } else if (promoCodeData.type === 'free_trial' && promoCodeData.trial_days > 0) {
      subscriptionModification = {
        type: 'trial_extension' as const,
        value: promoCodeData.trial_days,
        description: `${promoCodeData.trial_days} day${promoCodeData.trial_days > 1 ? 's' : ''} free trial`
      };
    } else if (result.discount_applied_cents > 0) {
      subscriptionModification = {
        type: 'discount' as const,
        value: result.discount_applied_cents,
        description: `$${(result.discount_applied_cents / 100).toFixed(2)} discount applied`
      };
    }

    // For free subscription promo codes, create/upgrade the user's subscription
    if (promoCodeData.type === 'free_subscription' && promoCodeData.free_months > 0) {
      if (userId) {
        // User is logged in - upgrade their account
        try {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + promoCodeData.free_months);
          
          console.log('🎁 Creating free subscription for user:', { userId, months: promoCodeData.free_months, endDate });
          
          const { error: updateError } = await supabase
            .from('users')
            .update({
              subscription_status: 'premium',
              subscription_tier: 'premium', 
              subscription_start_date: new Date().toISOString(),
              subscription_end_date: endDate.toISOString(),
              subscription_cancel_at_period_end: false
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('❌ Failed to create subscription:', updateError);
          } else {
            console.log('✅ Successfully created free subscription until:', endDate);
            // Update the response to indicate subscription was created
            subscriptionModification = {
              type: 'free_subscription_granted' as const,
              months: promoCodeData.free_months,
              endDate: endDate.toISOString(),
              description: `${promoCodeData.free_months} month${promoCodeData.free_months > 1 ? 's' : ''} of premium access granted`
            };
          }
        } catch (subscriptionError) {
          console.error('❌ Error creating subscription:', subscriptionError);
          // Don't fail the request, but log the error
        }
      } else {
        // Anonymous user - they'll need to create account to claim subscription
        console.log('🔍 Anonymous user applied free subscription code - will need to create account');
        subscriptionModification = {
          type: 'free_subscription_pending' as const,
          months: promoCodeData.free_months,
          description: `Create an account to claim ${promoCodeData.free_months} month${promoCodeData.free_months > 1 ? 's' : ''} of premium access`
        };
      }
    }

    // Track successful application for analytics
    try {
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId || null,
          event_name: 'promo_code_applied',
          event_category: 'promotion',
          event_properties: {
            code: normalizedCode,
            type: promoCodeData.type,
            discountApplied: result.discount_applied_cents,
            orderAmount,
            finalAmount,
            subscriptionId,
            freeMonths: promoCodeData.type === 'free_subscription' ? promoCodeData.free_months : undefined
          },
          fingerprint_hash: fingerprintHash || null,
          ip_hash: ipHash,
          user_agent: userAgent
        });
    } catch (analyticsError) {
      console.warn('⚠️ Failed to track promo application analytics:', analyticsError);
      // Don't fail the request for analytics errors
    }

    const response: PromoCodeApplicationResponse = {
      success: true,
      promoCodeUseId: result.promo_code_use_id,
      discountApplied: result.discount_applied_cents,
      finalAmount,
      subscriptionModification
    };

    console.log('✅ Promo code applied successfully:', { 
      code: normalizedCode, 
      discount: result.discount_applied_cents,
      useId: result.promo_code_use_id 
    });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Promo application failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to apply promo code'
    } as PromoCodeApplicationResponse, { status: 500 });
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || xRealIP || xForwardedFor?.split(',')[0] || 'unknown';
}