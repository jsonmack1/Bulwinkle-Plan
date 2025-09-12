#!/usr/bin/env node
/**
 * Debug script to analyze user ID mismatches in promo code flow
 */

const debugUserMismatch = async () => {
  console.log('🔍 Debugging User ID Mismatch in Promo Code Flow\n');
  
  console.log('📊 Data Analysis from your tables:');
  console.log('');
  
  console.log('1️⃣ PROMO_CODE_USES table:');
  console.log('   user_id: "d20ea346-0bb9-45ee-86e4-328933610787"');
  console.log('   applied_at: "2025-09-10 01:32:24"');
  console.log('   discount_applied_cents: 0');
  console.log('   subscription_id: null');
  console.log('');
  
  console.log('2️⃣ PAYMENT_ATTEMPTS table:');
  console.log('   user_id: "ca8f4b44-2d3f-4169-9a00-dc9de73e1819" ❌ DIFFERENT USER!');
  console.log('   stripe_session_id: "cs_live_a157PF7C3GoHnwJYI2euScySwo1KGG4j8gk9NTr76gDluGW9EqZXFYirB1"');
  console.log('   amount_cents: 999 (should be 0 for free promo)');
  console.log('   status: "processing"');
  console.log('   created_at: "2025-09-11 22:25:01"');
  console.log('');
  
  console.log('3️⃣ SUBSCRIPTION_STATUS_VIEW:');
  console.log('   id: "2cdcd61d-7e90-4e7e-9320-b92961c15dab" ❌ THIRD DIFFERENT USER!');
  console.log('   subscription_status: "free" (not upgraded)');
  console.log('   stripe_customer_id: null');
  console.log('   stripe_subscription_id: null');
  console.log('');
  
  console.log('🚨 ROOT CAUSE ANALYSIS:');
  console.log('');
  console.log('❌ Problem 1: Multiple User IDs');
  console.log('   - Promo code applied to user d20ea346...');
  console.log('   - Checkout created for user ca8f4b44...');  
  console.log('   - Checking status of user 2cdcd61d...');
  console.log('   → These are 3 DIFFERENT users!');
  console.log('');
  
  console.log('❌ Problem 2: User Context Lost');
  console.log('   - User applies promo code → recorded for user A');
  console.log('   - User creates checkout → recorded for user B'); 
  console.log('   - Webhook tries to upgrade → can\'t find either user');
  console.log('   → User C (the one you\'re checking) never gets upgraded');
  console.log('');
  
  console.log('❌ Problem 3: Amount Mismatch');
  console.log('   - Payment attempt shows 999 cents ($9.99)');
  console.log('   - But promo code should make it $0.00');
  console.log('   → Promo code discount not applied to Stripe session');
  console.log('');
  
  console.log('🔧 REQUIRED FIXES:');
  console.log('');
  console.log('1. Fix user context consistency');
  console.log('   - Ensure same user_id used throughout entire flow');
  console.log('   - Fix authentication/session management');
  console.log('');
  
  console.log('2. Fix checkout session metadata');
  console.log('   - Ensure correct user_id passed to Stripe session');
  console.log('   - Add email as backup identifier');
  console.log('');
  
  console.log('3. Fix webhook user lookup');
  console.log('   - Use session metadata user_id as primary lookup');
  console.log('   - Use customer email as secondary lookup');
  console.log('   - Log all lookup attempts for debugging');
  console.log('');
  
  console.log('4. Fix amount calculation');
  console.log('   - Ensure free subscription codes show $0.00 in payment_attempts');
  console.log('   - Trial periods should have no immediate charge');
  console.log('');
  
  console.log('💡 IMMEDIATE ACTION NEEDED:');
  console.log('   Check your authentication system - users are getting different IDs');
  console.log('   This suggests session/auth context is being lost between API calls');
};

// Run the debug analysis
debugUserMismatch().catch(console.error);