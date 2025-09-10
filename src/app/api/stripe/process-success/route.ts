import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * SIMPLE SUCCESS PROCESSOR
 * Handles subscription setup immediately when user returns from Stripe
 * This bypasses complex webhook logic for immediate results
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    console.log('🎯 SIMPLE SUCCESS: Processing session', sessionId);

    // Initialize services
    const stripe = (await import('../../../../lib/stripe')).default;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    console.log('📊 Session data:', {
      id: session.id,
      email: session.customer_details?.email,
      promoCode: session.metadata?.promo_code,
      amountTotal: session.amount_total,
      paymentStatus: session.payment_status,
      subscriptionId: session.subscription
    });

    // If this is a successful PAPERCLIP session
    if (session.metadata?.promo_code === 'PAPERCLIP' && 
        session.payment_status === 'paid' && 
        session.subscription) {
      
      console.log('🎟️ PAPERCLIP SUCCESS detected');
      
      const customerEmail = session.customer_details?.email;
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription.id;

      if (!customerEmail) {
        return NextResponse.json({ error: 'No customer email found' }, { status: 400 });
      }

      // Get full subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Calculate dates
      const now = new Date();
      const trialEndDate = subscription.trial_end 
        ? new Date(subscription.trial_end * 1000)
        : new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      
      console.log('📅 PAPERCLIP dates:', {
        now: now.toISOString(),
        trialEnd: trialEndDate.toISOString(),
        subscriptionStatus: subscription.status
      });

      // Find user by email
      const { data: user } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', customerEmail)
        .single();

      if (!user) {
        console.log('❌ User not found for email:', customerEmail);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // DIRECT UPDATE - Set user to premium immediately
      const updateData = {
        subscription_status: 'premium',
        subscription_type: 'promo',
        subscription_source: 'PAPERCLIP',
        current_plan: 'monthly',
        subscription_start_date: now.toISOString(),
        subscription_end_date: trialEndDate.toISOString(),
        subscription_trial_end_date: trialEndDate.toISOString(),
        is_trial: true,
        is_active: true,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: subscription.customer,
        stripe_price_id: subscription.items.data[0]?.price?.id,
        subscription_amount_cents: subscription.items.data[0]?.price?.unit_amount || 999,
        subscription_currency: 'usd',
        updated_at: now.toISOString()
      };

      console.log('💾 DIRECT UPDATE data:', updateData);

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Update failed:', updateError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log('✅ PAPERCLIP SUCCESS: User upgraded to premium');
      
      // Log the event
      await supabase
        .from('subscription_events')
        .insert({
          user_id: user.id,
          event_type: 'paperclip_success_processed',
          event_data: {
            sessionId,
            subscriptionId,
            trialEndDate: trialEndDate.toISOString(),
            processedAt: now.toISOString(),
            method: 'direct_success_handler'
          }
        });

      return NextResponse.json({
        success: true,
        message: 'PAPERCLIP trial activated',
        user: {
          id: user.id,
          email: user.email,
          isPremium: true,
          trialEndDate: trialEndDate.toISOString()
        }
      });
    }

    // Handle other successful subscriptions
    if (session.payment_status === 'paid' && session.subscription) {
      console.log('💳 Paid subscription success detected');
      
      const customerEmail = session.customer_details?.email;
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription.id;

      if (customerEmail) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Find user
        const { data: user } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', customerEmail)
          .single();

        if (user) {
          const now = new Date();
          const endDate = new Date(subscription.current_period_end * 1000);
          
          // Set to premium
          await supabase
            .from('users')
            .update({
              subscription_status: 'premium',
              subscription_type: 'paid',
              subscription_source: 'payment',
              current_plan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
              subscription_start_date: now.toISOString(),
              subscription_end_date: endDate.toISOString(),
              is_trial: false,
              is_active: true,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: subscription.customer,
              stripe_price_id: subscription.items.data[0]?.price?.id,
              subscription_amount_cents: subscription.items.data[0]?.price?.unit_amount || 0,
              subscription_currency: 'usd',
              updated_at: now.toISOString()
            })
            .eq('id', user.id);

          console.log('✅ PAID subscription: User upgraded to premium');

          return NextResponse.json({
            success: true,
            message: 'Subscription activated',
            user: {
              id: user.id,
              email: user.email,
              isPremium: true,
              endDate: endDate.toISOString()
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session processed'
    });

  } catch (error) {
    console.error('❌ SUCCESS PROCESSOR failed:', error);
    return NextResponse.json(
      { error: 'Failed to process success', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}