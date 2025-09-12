#!/usr/bin/env node
/**
 * Diagnose why subscription webhooks are not firing
 * Based on actual session: cs_live_a1cSsdk5SZgUPj07istnqAQZ4swGCaKbMOC5mwK5rSu5Q9xtEAs9a6ZF0r
 */

const diagnoseMissingWebhooks = async () => {
  console.log('🔍 Diagnosing Missing Subscription Webhooks\n');
  
  const sessionId = 'cs_live_a1cSsdk5SZgUPj07istnqAQZ4swGCaKbMOC5mwK5rSu5Q9xtEAs9a6ZF0r';
  
  console.log('📊 CURRENT STATUS:');
  console.log('✅ Payment amount fixed: $0.00 recorded');
  console.log('✅ Checkout session created successfully');
  console.log('❌ User account not upgraded to premium');
  console.log('❌ No subscription webhooks received');
  console.log('');
  
  console.log('🔍 WEBHOOK ANALYSIS:');
  console.log('Received webhooks: payment_method.created');
  console.log('Missing webhooks: checkout.session.completed, customer.subscription.created');
  console.log('');
  
  console.log('🚨 CRITICAL ISSUE IDENTIFIED:');
  console.log('The Stripe checkout session is NOT creating a subscription!');
  console.log('');
  
  console.log('💡 LIKELY CAUSES:');
  console.log('');
  
  console.log('1. Trial Period Configuration Issue:');
  console.log('   - Free subscription promo codes should create subscriptions with trials');
  console.log('   - If trial_period_days is set incorrectly, subscription creation fails');
  console.log('   - Check: sessionParams.subscription_data.trial_period_days');
  console.log('');
  
  console.log('2. Stripe Price ID Issue:');
  console.log('   - Using incorrect price ID that doesn\'t support subscriptions');
  console.log('   - Check: NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID in environment');
  console.log('   - Verify: Price exists in Stripe dashboard and is for subscriptions');
  console.log('');
  
  console.log('3. Checkout Mode Mismatch:');
  console.log('   - Mode should be "subscription" for recurring payments');
  console.log('   - Check: sessionParams.mode = "subscription"');
  console.log('');
  
  console.log('4. Webhook Configuration:');
  console.log('   - Webhook endpoint may not be listening for subscription events');
  console.log('   - Check Stripe Dashboard > Webhooks > Events to listen for');
  console.log('   - Required events: checkout.session.completed, customer.subscription.created');
  console.log('');
  
  console.log('🔧 IMMEDIATE DEBUGGING STEPS:');
  console.log('');
  
  console.log('Step 1: Check Stripe Session Details');
  console.log('Using Stripe CLI or Dashboard, inspect this session:');
  console.log(`stripe checkout sessions retrieve ${sessionId}`);
  console.log('Look for: subscription field, trial_end, subscription_data');
  console.log('');
  
  console.log('Step 2: Check Environment Variables');
  console.log('Verify these are set correctly:');
  console.log('- NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID');
  console.log('- NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID');
  console.log('- STRIPE_SECRET_KEY');
  console.log('- STRIPE_WEBHOOK_SECRET');
  console.log('');
  
  console.log('Step 3: Test Subscription Creation Manually');
  console.log('Create a test subscription in Stripe Dashboard to see if webhooks fire');
  console.log('');
  
  console.log('Step 4: Check Server Logs');
  console.log('Look for these log messages during checkout:');
  console.log('- "🎁 Free subscription promo detected"');
  console.log('- "✅ Free subscription configured"');
  console.log('- "🎫 Stripe webhook event: customer.subscription.created"');
  console.log('');
  
  console.log('🎯 EXPECTED FLOW FOR PROMO CODES:');
  console.log('1. User applies TELESCOPE2025');
  console.log('2. Creates checkout session with mode="subscription"');
  console.log('3. Sets trial_period_days=90 in subscription_data');
  console.log('4. User completes checkout');
  console.log('5. Stripe creates subscription with trial');
  console.log('6. Fires: checkout.session.completed');
  console.log('7. Fires: customer.subscription.created');
  console.log('8. Webhook upgrades user to premium');
  console.log('');
  
  console.log('🚨 CURRENT BROKEN FLOW:');
  console.log('1. User applies promo code ✅');
  console.log('2. Creates checkout session ✅');
  console.log('3. Records $0.00 payment ✅');
  console.log('4. User completes checkout ✅');
  console.log('5. ❌ NO SUBSCRIPTION CREATED');
  console.log('6. ❌ NO SUBSCRIPTION WEBHOOKS');
  console.log('7. ❌ USER NOT UPGRADED');
  console.log('');
  
  console.log('🔧 LIKELY FIX NEEDED:');
  console.log('Check the checkout session creation logic for trial subscriptions.');
  console.log('The issue is probably in the subscription_data configuration.');
  console.log('Trial subscriptions should still create actual Stripe subscriptions.');
};

// Run the diagnosis
diagnoseMissingWebhooks().catch(console.error);