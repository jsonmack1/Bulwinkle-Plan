require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function getFullSubscriptionDetails() {
  console.log('🔍 Getting FULL subscription details from Stripe...');
  
  // Get the problematic subscription IDs
  const subscriptionIds = [
    'sub_1S5eNH9H60ntGZzFn5B4cpfj', // williams.jason005@gmail.com
    'sub_1S5e8V9H60ntGZzFKw91T5UG', // jason@jmackcreative.com
    'sub_1S5dXF9H60ntGZzFREZhA9SD'  // Test10@testaccounts.com
  ];
  
  for (const subId of subscriptionIds) {
    try {
      console.log(`\n📊 Subscription: ${subId}`);
      
      // Get full subscription details
      const subscription = await stripe.subscriptions.retrieve(subId, {
        expand: ['customer', 'items.data.price', 'discount.promotion_code', 'latest_invoice']
      });
      
      console.log(`   Customer Email: ${subscription.customer.email}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Created: ${new Date(subscription.created * 1000).toISOString()}`);
      console.log(`   Current Period Start: ${new Date(subscription.current_period_start * 1000).toISOString()}`);
      console.log(`   Current Period End: ${new Date(subscription.current_period_end * 1000).toISOString()}`);
      console.log(`   Trial Start: ${subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : 'N/A'}`);
      console.log(`   Trial End: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'N/A'}`);
      console.log(`   Cancel at Period End: ${subscription.cancel_at_period_end}`);
      
      // Price info
      if (subscription.items?.data?.length > 0) {
        const item = subscription.items.data[0];
        console.log(`   💰 Price Details:`);
        console.log(`     Price ID: ${item.price.id}`);
        console.log(`     Amount: $${(item.price.unit_amount || 0) / 100}`);
        console.log(`     Interval: ${item.price.recurring?.interval}`);
        console.log(`     Interval Count: ${item.price.recurring?.interval_count}`);
      }
      
      // Discount info
      if (subscription.discount) {
        console.log(`   🎫 Discount Details:`);
        console.log(`     Promotion Code: ${subscription.discount.promotion_code?.code}`);
        console.log(`     Coupon ID: ${subscription.discount.coupon.id}`);
        console.log(`     Duration: ${subscription.discount.coupon.duration}`);
        console.log(`     Duration in Months: ${subscription.discount.coupon.duration_in_months}`);
        console.log(`     Percent Off: ${subscription.discount.coupon.percent_off}%`);
        console.log(`     Discount Start: ${new Date(subscription.discount.start * 1000).toISOString()}`);
        console.log(`     Discount End: ${subscription.discount.end ? new Date(subscription.discount.end * 1000).toISOString() : 'Never'}`);
      }
      
      // Check what happens after the current period
      console.log(`   🔄 Next Billing:`);
      if (subscription.trial_end && subscription.trial_end > Date.now() / 1000) {
        console.log(`     Currently in trial until: ${new Date(subscription.trial_end * 1000).toISOString()}`);
        console.log(`     Next charge will be: $${(subscription.items.data[0]?.price?.unit_amount || 0) / 100}`);
      } else if (subscription.discount && subscription.discount.coupon.duration === 'once') {
        console.log(`     One-time discount applied`);
        console.log(`     Next period will charge: $${(subscription.items.data[0]?.price?.unit_amount || 0) / 100}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error fetching ${subId}:`, error.message);
    }
  }
  
  // Check what a proper 30-day free trial should look like
  console.log('\n🎯 ANALYSIS: What we need for a proper 30-day free trial:');
  console.log('1. trial_end should be set to 30 days from now');
  console.log('2. current_period_end should match trial_end');
  console.log('3. Status should be "trialing"');
  console.log('4. After trial ends, it should charge the regular price');
  console.log('');
  console.log('🚨 CURRENT ISSUE: PAPERCLIP appears to be a 100% discount, not a trial');
  console.log('   This means users get charged $0 for the first period, then $9.99/month');
  console.log('   We need to check if this is the intended behavior or if we need trial periods');
}

getFullSubscriptionDetails().catch(console.error);