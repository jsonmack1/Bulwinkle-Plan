import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

interface ValidatePromoRequest {
  code: string;
  userId?: string;
  fingerprintHash?: string;
  orderAmount?: number; // in cents
}

interface PromoCodeValidationResponse {
  valid: boolean;
  promoCode?: {
    id: string;
    code: string;
    name: string;
    description: string;
    type: 'free_subscription' | 'discount_percent' | 'discount_amount' | 'free_trial';
    discountPercent?: number;
    discountAmountCents?: number;
    freeMonths?: number;
    trialDays?: number;
  };
  discountPreview?: {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  };
  error?: string;
}

/**
 * Validate a promo code without applying it
 * POST /api/promo/validate
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎟️ Promo code validation API called');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase credentials: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body: ValidatePromoRequest = await request.json();
    const { code, userId, fingerprintHash, orderAmount } = body;
    
    console.log('🎟️ Validating promo code:', { 
      code, 
      userId: userId ? 'present' : 'null', 
      fingerprintHash: fingerprintHash ? fingerprintHash.substring(0, 8) + '...' : 'null',
      orderAmount 
    });

    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        valid: false,
        error: 'Promo code is required'
      } as PromoCodeValidationResponse, { status: 400 });
    }

    // Clean and normalize the promo code
    const normalizedCode = code.trim().toUpperCase();
    
    if (normalizedCode.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Promo code cannot be empty'
      } as PromoCodeValidationResponse, { status: 400 });
    }

    // Call the database function to validate the promo code
    const { data: validationResult, error: validationError } = await supabase
      .rpc('is_promo_code_valid', {
        p_code: normalizedCode,
        p_user_id: userId || null,
        p_fingerprint_hash: fingerprintHash || null
      });

    if (validationError) {
      console.error('❌ Promo code validation error:', validationError);
      console.error('❌ Full error details:', JSON.stringify(validationError, null, 2));
      console.error('❌ Parameters passed:', { normalizedCode, userId, fingerprintHash });
      return NextResponse.json({
        valid: false,
        error: 'Failed to validate promo code'
      } as PromoCodeValidationResponse, { status: 500 });
    }

    if (!validationResult || validationResult.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid promo code'
      } as PromoCodeValidationResponse);
    }

    const result = validationResult[0];
    
    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error_message || 'Promo code is not valid'
      } as PromoCodeValidationResponse);
    }

    // Extract promo code details
    const codeDetails = result.code_details;
    const promoCode = {
      id: result.promo_code_id,
      code: codeDetails.code,
      name: codeDetails.name,
      description: codeDetails.description,
      type: codeDetails.type,
      discountPercent: codeDetails.discount_percent,
      discountAmountCents: codeDetails.discount_amount_cents,
      freeMonths: codeDetails.free_months,
      trialDays: codeDetails.trial_days
    };

    // Calculate discount preview if orderAmount is provided
    let discountPreview = undefined;
    if (orderAmount && orderAmount > 0) {
      let discountAmount = 0;
      
      if (codeDetails.type === 'discount_percent' && codeDetails.discount_percent) {
        discountAmount = Math.round(orderAmount * codeDetails.discount_percent / 100);
      } else if (codeDetails.type === 'discount_amount' && codeDetails.discount_amount_cents) {
        discountAmount = Math.min(codeDetails.discount_amount_cents, orderAmount);
      } else if (codeDetails.type === 'free_subscription') {
        discountAmount = orderAmount; // 100% discount
      }
      
      discountPreview = {
        originalAmount: orderAmount,
        discountAmount,
        finalAmount: Math.max(0, orderAmount - discountAmount)
      };
    }

    // Track validation event for analytics
    try {
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId || null,
          event_name: 'promo_code_validated',
          event_category: 'promotion',
          event_properties: {
            code: normalizedCode,
            type: codeDetails.type,
            valid: true,
            orderAmount,
            discountPreview
          },
          fingerprint_hash: fingerprintHash || null,
          ip_hash: getClientIPHash(request),
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
    } catch (analyticsError) {
      console.warn('⚠️ Failed to track promo validation analytics:', analyticsError);
      // Don't fail the request for analytics errors
    }

    const response: PromoCodeValidationResponse = {
      valid: true,
      promoCode,
      discountPreview
    };

    console.log('✅ Promo code validation successful:', { code: normalizedCode, type: codeDetails.type });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Promo validation failed:', error);
    
    return NextResponse.json({
      valid: false,
      error: 'Failed to validate promo code'
    } as PromoCodeValidationResponse, { status: 500 });
  }
}

// Helper function to hash client IP
function getClientIPHash(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  const clientIP = cfConnectingIP || xRealIP || xForwardedFor?.split(',')[0] || 'unknown';
  return createHash('sha256').update(clientIP).digest('hex');
}