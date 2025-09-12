#!/usr/bin/env node
/**
 * Manually test the user upgrade logic
 * This simulates what the webhook should be doing
 */

const testManualUpgrade = async () => {
  console.log('🧪 Manual User Upgrade Test\n');
  
  const userData = {
    userId: '2cdcd61d-7e90-4e7e-9320-b92961c15dab',
    email: 'test18@testaccounts.com',
    stripeSubscriptionId: 'sub_1S6MWI9H60ntGZzFnhnlavLg',
    stripeCustomerId: 'cus_T2ROrJatcYJyxB'
  };
  
  console.log('📋 Test Data:', userData);
  console.log('');
  
  console.log('🔧 Manual Test - Update User via SQL');
  console.log('Run this SQL command in your database:');
  console.log('');
  console.log('```sql');
  console.log(`UPDATE users`);
  console.log(`SET`);
  console.log(`  stripe_subscription_id = '${userData.stripeSubscriptionId}',`);
  console.log(`  stripe_customer_id = '${userData.stripeCustomerId}',`);
  console.log(`  subscription_status = 'premium',`);
  console.log(`  current_plan = 'monthly',`);
  console.log(`  updated_at = NOW()`);
  console.log(`WHERE id = '${userData.userId}';`);
  console.log('```');
  console.log('');
  
  console.log('✅ Expected Result: 1 row affected');
  console.log('');
  
  console.log('🔍 Then verify with:');
  console.log('```sql');
  console.log(`SELECT`);
  console.log(`  id,`);
  console.log(`  email,`);
  console.log(`  subscription_status,`);
  console.log(`  current_plan,`);
  console.log(`  stripe_subscription_id,`);
  console.log(`  stripe_customer_id,`);
  console.log(`  updated_at`);
  console.log(`FROM users`);
  console.log(`WHERE id = '${userData.userId}';`);
  console.log('```');
  console.log('');
  
  console.log('✅ Expected After Update:');
  console.log('- subscription_status: "premium"');
  console.log('- current_plan: "monthly"');
  console.log('- stripe_subscription_id: "sub_1S6MWI9H60ntGZzFnhnlavLg"');
  console.log('- stripe_customer_id: "cus_T2ROrJatcYJyxB"');
  console.log('- updated_at: [current timestamp]');
  console.log('');
  
  console.log('🎯 If Manual Update Works:');
  console.log('→ Database permissions are OK');
  console.log('→ User record exists');
  console.log('→ Issue is in webhook processing');
  console.log('');
  
  console.log('🚨 If Manual Update Fails:');
  console.log('→ Database permissions issue');
  console.log('→ User record missing/corrupted');
  console.log('→ Table structure issue');
  console.log('');
  
  console.log('🔍 Next Steps:');
  console.log('1. Run the manual SQL update');
  console.log('2. Check if user gets premium status');
  console.log('3. If it works, the problem is webhook processing');
  console.log('4. If it fails, the problem is database/permissions');
};

// Run the test
testManualUpgrade().catch(console.error);