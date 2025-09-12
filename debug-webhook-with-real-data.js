#!/usr/bin/env node
/**
 * Debug webhook processing with real user data
 * Using actual user ID: 2cdcd61d-7e90-4e7e-9320-b92961c15dab
 */

const debugWebhookRealData = async () => {
  console.log('🔍 Debugging Webhook with Real User Data\n');
  
  const realUserId = '2cdcd61d-7e90-4e7e-9320-b92961c15dab';
  const realEmail = 'test18@testaccounts.com';
  const realSessionId = 'cs_live_a1gDNe60UV5XJtR7l3xh41AlG61i3xwjSbXHadNxbVP8xbTAtIXJpXUZfW';
  
  console.log('📊 REAL DATA ANALYSIS:');
  console.log('');
  console.log('User Record:');
  console.log(`  ID: ${realUserId}`);
  console.log(`  Email: ${realEmail}`);
  console.log(`  Status: free (❌ should be premium)`);
  console.log(`  Stripe Customer ID: null (❌ missing)`);
  console.log(`  Stripe Subscription ID: null (❌ missing)`);
  console.log('');
  
  console.log('Payment Attempt:');
  console.log(`  Session ID: ${realSessionId}`);
  console.log(`  Amount: 999 cents (❌ should be 0 for promo)`);
  console.log(`  Status: processing`);
  console.log('');
  
  console.log('🔍 DIAGNOSTIC QUESTIONS:');
  console.log('');
  console.log('1. Is the webhook endpoint correctly configured?');
  console.log('   Check: Stripe Dashboard → Webhooks → Events');
  console.log('   Expected events: checkout.session.completed, customer.subscription.created');
  console.log('');
  
  console.log('2. Are webhooks being received?');
  console.log('   Check server logs for: "🎫 Stripe webhook event"');
  console.log('   If missing: webhook not firing or endpoint misconfigured');
  console.log('');
  
  console.log('3. Is user lookup working?');
  console.log('   Test queries that webhook should perform:');
  console.log('');
  
  // Simulate the webhook queries
  console.log('   Query 1: Find by stripe_customer_id (will fail - customer_id is null)');
  console.log('   Query 2: Find by user_id from session metadata');
  console.log(`   Query 3: Find by email (${realEmail})`);
  console.log('');
  
  console.log('4. Is promo code amount calculation correct?');
  console.log('   Free subscription codes should show $0.00 in payment_attempts');
  console.log('   Current: $9.99 suggests promo not applied to Stripe session');
  console.log('');
  
  console.log('🚨 IMMEDIATE TESTING NEEDED:');
  console.log('');
  console.log('Test 1: Webhook Connectivity');
  console.log('  - Check Stripe webhook logs');
  console.log('  - Verify endpoint URL is correct');
  console.log('  - Check for webhook secret mismatch');
  console.log('');
  
  console.log('Test 2: Database Query with Real Data');
  console.log('  SQL to test manually:');
  console.log(`  SELECT * FROM users WHERE id = '${realUserId}';`);
  console.log(`  SELECT * FROM users WHERE email = '${realEmail}';`);
  console.log('');
  
  console.log('Test 3: Stripe Session Metadata');
  console.log('  Check what metadata was actually sent to Stripe:');
  console.log(`  stripe.checkout.sessions.retrieve('${realSessionId}')`);
  console.log('');
  
  console.log('💡 LIKELY ROOT CAUSES:');
  console.log('');
  console.log('1. Webhook not firing → Check Stripe dashboard');
  console.log('2. Webhook firing but failing → Check server logs');
  console.log('3. User lookup failing → Test SQL queries manually');
  console.log('4. Promo amount not calculated → Check checkout creation');
  console.log('');
  
  console.log('🎯 NEXT STEPS:');
  console.log('1. Check Stripe webhook delivery logs');
  console.log('2. Check server application logs during checkout');
  console.log('3. Test user lookup queries manually in database');
  console.log('4. Verify promo code trial period creation in Stripe');
};

// Run the debug
debugWebhookRealData().catch(console.error);