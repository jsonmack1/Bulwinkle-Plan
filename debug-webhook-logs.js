/**
 * Debug Webhook Logs
 * This script helps check what's happening with the webhook processing
 */

const TEST_USER_EMAIL = 'test@example.com'; // Replace with the email you used for testing

async function checkWebhookProcessing() {
  console.log('🕵️ Debugging Webhook Processing');
  console.log('==============================');
  
  try {
    // Check if user exists and their current status
    const response = await fetch('http://localhost:3000/api/test-supabase');
    const data = await response.json();
    
    if (data.users) {
      console.log('\n📋 Current users in database:');
      data.users.forEach(user => {
        console.log(`  👤 ${user.email}:`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Status: ${user.subscription_status}`);
        console.log(`     Plan: ${user.current_plan}`);
        console.log(`     Stripe Sub ID: ${user.stripe_subscription_id}`);
        console.log(`     End Date: ${user.subscription_end_date}`);
        console.log(`     Created: ${user.created_at}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

async function checkStripeSubscription() {
  console.log('\n🔍 Check Stripe Dashboard:');
  console.log('1. Go to https://dashboard.stripe.com/subscriptions');
  console.log('2. Find the subscription created with PAPERCLIP');
  console.log('3. Check the status - it should be "Active"');
  console.log('4. Check the discount - should show 100% off first payment');
  console.log('5. Look at Events tab for webhook deliveries');
}

async function suggestDebugging() {
  console.log('\n🛠️ Debugging Steps:');
  console.log('1. Check webhook endpoint logs in Stripe Dashboard');
  console.log('2. Look for "subscription.created" events');
  console.log('3. Check if webhook is receiving and processing correctly');
  console.log('4. Verify subscription status is "active" not "incomplete"');
  
  console.log('\n🎯 Most Likely Issues:');
  console.log('• Subscription status might be "trialing" instead of "active"');
  console.log('• Webhook might be processing but with wrong status logic');
  console.log('• User might exist but subscription_status not updating');
}

async function runDebugging() {
  await checkWebhookProcessing();
  await checkStripeSubscription();
  await suggestDebugging();
  
  console.log('\n✅ Next Steps:');
  console.log('1. Try PAPERCLIP again with the updated webhook');
  console.log('2. Check the console logs for detailed subscription info');
  console.log('3. Verify user gets premium status in header');
}

// Run debugging
runDebugging();