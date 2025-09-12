#!/usr/bin/env node
/**
 * Debug checkout session upgrade with real webhook data
 * Tests the exact user lookup that should be happening
 */

const debugCheckoutUpgrade = async () => {
  console.log('🔍 Debugging Checkout Session Upgrade with Real Data\n');
  
  // Real data from the webhook
  const webhookData = {
    sessionId: 'cs_live_a1cyY3r6hDEhhTcQdsB7Hqxqbw0KGaS5pGIe85GoUyiRsckgrZrVbo1y6U',
    subscriptionId: 'sub_1S6MWI9H60ntGZzFnhnlavLg',
    customerId: 'cus_T2ROrJatcYJyxB',
    userId: '2cdcd61d-7e90-4e7e-9320-b92961c15dab',
    userEmail: 'test18@testaccounts.com',
    promoCode: 'PAPERCLIP',
    billingPeriod: 'monthly'
  };
  
  console.log('📋 WEBHOOK DATA RECEIVED:');
  console.log('Session ID:', webhookData.sessionId);
  console.log('Subscription ID:', webhookData.subscriptionId);
  console.log('Customer ID:', webhookData.customerId);
  console.log('User ID:', webhookData.userId);
  console.log('User Email:', webhookData.userEmail);
  console.log('Promo Code:', webhookData.promoCode);
  console.log('');
  
  console.log('🔧 OUR CHECKOUT HANDLER SHOULD EXECUTE:');
  console.log('1. Receive checkout.session.completed event');
  console.log('2. Extract metadata from session');
  console.log('3. Find user_id:', webhookData.userId);
  console.log('4. Update user with:');
  console.log('   - stripe_subscription_id:', webhookData.subscriptionId);
  console.log('   - stripe_customer_id:', webhookData.customerId);
  console.log('   - subscription_status: "premium"');
  console.log('   - current_plan: "monthly"');
  console.log('');
  
  console.log('📝 SQL QUERY THAT SHOULD EXECUTE:');
  console.log(`UPDATE users SET`);
  console.log(`  stripe_subscription_id = '${webhookData.subscriptionId}',`);
  console.log(`  stripe_customer_id = '${webhookData.customerId}',`);
  console.log(`  subscription_status = 'premium',`);
  console.log(`  current_plan = '${webhookData.billingPeriod}',`);
  console.log(`  updated_at = NOW()`);
  console.log(`WHERE id = '${webhookData.userId}';`);
  console.log('');
  
  console.log('🚨 DEBUGGING CHECKLIST:');
  console.log('');
  
  console.log('1. ✅ Is webhook being received?');
  console.log('   - Check server logs for: "🎫 Webhook received at:"');
  console.log('   - Should see checkout.session.completed event');
  console.log('');
  
  console.log('2. ✅ Is webhook signature valid?');
  console.log('   - Check server logs for: "✅ Webhook signature verified successfully"');
  console.log('   - If not, STRIPE_WEBHOOK_SECRET is wrong');
  console.log('');
  
  console.log('3. ❓ Is checkout handler being called?');
  console.log('   - Check server logs for: "✅ Checkout completed:"');
  console.log('   - Should see session ID:', webhookData.sessionId);
  console.log('');
  
  console.log('4. ❓ Is user lookup working?');
  console.log('   - Check server logs for: "🔍 Trying to upgrade user by ID:"');
  console.log('   - Should see user ID:', webhookData.userId);
  console.log('');
  
  console.log('5. ❓ Is user update succeeding?');
  console.log('   - Check server logs for: "✅ User upgraded by ID:"');
  console.log('   - If not, database permissions issue');
  console.log('');
  
  console.log('💡 MOST LIKELY ISSUES:');
  console.log('');
  
  console.log('❌ Issue 1: Webhook not configured for checkout.session.completed');
  console.log('   - Check Stripe Dashboard > Webhooks > Events');
  console.log('   - Must include: checkout.session.completed');
  console.log('');
  
  console.log('❌ Issue 2: Server logs show webhook errors');
  console.log('   - Check for signature verification failures');
  console.log('   - Check for database connection errors');
  console.log('   - Check for user lookup failures');
  console.log('');
  
  console.log('❌ Issue 3: Handler not processing subscription field');
  console.log('   - Our code checks: if (session.subscription && (userId || userEmail))');
  console.log('   - Subscription exists:', !!webhookData.subscriptionId);
  console.log('   - User ID exists:', !!webhookData.userId);
  console.log('   - Should trigger upgrade: YES');
  console.log('');
  
  console.log('🔧 IMMEDIATE ACTION:');
  console.log('Check your server logs during the checkout completion time:');
  console.log('Timestamp to look for: around 2025-09-12T02:15:00Z');
  console.log('Look for our enhanced webhook logging messages');
  console.log('');
  
  console.log('🎯 EXPECTED LOG SEQUENCE:');
  console.log('1. "🎫 Webhook received at: 2025-09-12T02:15:00Z"');
  console.log('2. "✅ Webhook signature verified successfully"');
  console.log('3. "🎫 Stripe webhook event: checkout.session.completed"');
  console.log('4. "✅ Checkout completed: cs_live_a1cyY3..."');
  console.log('5. "🔧 Attempting immediate user upgrade from checkout session"');
  console.log('6. "🔍 Trying to upgrade user by ID: 2cdcd61d-7e90-..."');
  console.log('7. "✅ User upgraded by ID: 2cdcd61d-7e90-..."');
  console.log('');
  
  console.log('If any of these messages are missing, that tells us exactly where the problem is!');
};

// Run the debug
debugCheckoutUpgrade().catch(console.error);