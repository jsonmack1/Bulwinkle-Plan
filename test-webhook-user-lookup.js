#!/usr/bin/env node
/**
 * Test webhook user lookup with real user data
 * Simulates the webhook queries to see if they would find the user
 */

const { createClient } = require('@supabase/supabase-js');

const testWebhookUserLookup = async () => {
  console.log('🧪 Testing Webhook User Lookup with Real Data\n');
  
  // Using your actual data
  const realUserId = '2cdcd61d-7e90-4e7e-9320-b92961c15dab';
  const realEmail = 'test18@testaccounts.com';
  
  // Mock Stripe data that webhook would receive
  const mockCustomerId = 'cus_test_customer_id';
  const mockSubscriptionId = 'sub_test_subscription_id';
  
  console.log('📋 Test Data:');
  console.log(`  Real User ID: ${realUserId}`);
  console.log(`  Real Email: ${realEmail}`);
  console.log(`  Mock Stripe Customer ID: ${mockCustomerId}`);
  console.log(`  Mock Subscription ID: ${mockSubscriptionId}`);
  console.log('');
  
  // Test if we can create a Supabase client (simulating webhook)
  try {
    console.log('🔍 Testing Database Connection...');
    
    // Note: This would need actual Supabase credentials to work
    console.log('❌ Cannot test live database connection from script');
    console.log('   Need to check manually in production logs');
    console.log('');
    
    console.log('📝 Manual Tests to Run:');
    console.log('');
    
    console.log('1. Test User Lookup by ID:');
    console.log(`   SQL: SELECT * FROM users WHERE id = '${realUserId}';`);
    console.log('   Expected: Should return user record');
    console.log('');
    
    console.log('2. Test User Lookup by Email:');
    console.log(`   SQL: SELECT * FROM users WHERE email = '${realEmail}';`);
    console.log('   Expected: Should return same user record');
    console.log('');
    
    console.log('3. Test User Update by ID:');
    console.log(`   SQL: UPDATE users SET`);
    console.log(`        subscription_status = 'premium',`);
    console.log(`        current_plan = 'monthly',`);
    console.log(`        stripe_subscription_id = '${mockSubscriptionId}',`);
    console.log(`        stripe_customer_id = '${mockCustomerId}',`);
    console.log(`        updated_at = NOW()`);
    console.log(`        WHERE id = '${realUserId}';`);
    console.log('   Expected: 1 row affected');
    console.log('');
    
    console.log('4. Test User Update by Email (fallback):');
    console.log(`   SQL: UPDATE users SET`);
    console.log(`        subscription_status = 'premium',`);
    console.log(`        current_plan = 'monthly',`);
    console.log(`        stripe_subscription_id = '${mockSubscriptionId}',`);
    console.log(`        stripe_customer_id = '${mockCustomerId}',`);
    console.log(`        updated_at = NOW()`);
    console.log(`        WHERE email = '${realEmail}';`);
    console.log('   Expected: 1 row affected');
    console.log('');
    
    console.log('🎯 Webhook Simulation:');
    console.log('');
    
    console.log('Mock checkout.session.completed event:');
    console.log('```json');
    console.log(JSON.stringify({
      id: 'cs_live_a1gDNe60UV5XJtR7l3xh41AlG61i3xwjSbXHadNxbVP8xbTAtIXJpXUZfW',
      customer: mockCustomerId,
      subscription: mockSubscriptionId,
      payment_status: 'paid',
      amount_total: 0, // Should be 0 for promo codes
      metadata: {
        user_id: realUserId,
        user_email: realEmail,
        promo_code: 'TELESCOPE2025',
        promo_type: 'free_subscription',
        billing_period: 'monthly'
      }
    }, null, 2));
    console.log('```');
    console.log('');
    
    console.log('✅ Expected Webhook Behavior:');
    console.log('1. Receive checkout.session.completed');
    console.log('2. Extract user_id from metadata');
    console.log(`3. Find user with ID: ${realUserId}`);
    console.log('4. Update user to premium status');
    console.log('5. Set stripe_subscription_id and stripe_customer_id');
    console.log('');
    
    console.log('🚨 If webhook is not working, check:');
    console.log('1. Stripe webhook endpoint URL');
    console.log('2. Webhook secret configuration');
    console.log('3. Server logs during checkout');
    console.log('4. Database permissions for webhook user');
    console.log('5. Network connectivity from webhook to database');
    
  } catch (error) {
    console.error('❌ Error in test setup:', error.message);
  }
};

// Run the test
testWebhookUserLookup().catch(console.error);