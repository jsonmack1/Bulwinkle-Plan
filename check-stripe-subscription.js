/**
 * Check Stripe Subscription Details
 * This script fetches the actual subscription from Stripe to see what status it has
 */

require('dotenv').config({ path: '.env.local' });

async function checkStripeSubscription() {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    console.log('🔍 Checking recent Stripe subscriptions...');
    console.log('==========================================');

    // Get recent subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 10,
      expand: ['data.customer', 'data.items.data.price']
    });

    console.log(`\n📋 Found ${subscriptions.data.length} recent subscriptions:\n`);

    for (const subscription of subscriptions.data) {
      const customer = subscription.customer;
      const priceInfo = subscription.items.data[0]?.price;
      
      console.log(`🎟️ Subscription: ${subscription.id}`);
      console.log(`   Customer: ${customer.email || customer.id}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Created: ${new Date(subscription.created * 1000).toLocaleString()}`);
      console.log(`   Current Period: ${new Date(subscription.current_period_start * 1000).toLocaleDateString()} - ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
      console.log(`   Price: $${(priceInfo?.unit_amount || 0) / 100} ${priceInfo?.currency || 'USD'} / ${priceInfo?.recurring?.interval || 'unknown'}`);
      
      // Check for discounts/promotions
      if (subscription.discount) {
        console.log(`   🎁 Discount: ${subscription.discount.coupon.percent_off || subscription.discount.coupon.amount_off}% off`);
        console.log(`   🎟️ Promo Code: ${subscription.discount.promotion_code || 'N/A'}`);
      } else {
        console.log(`   💰 Full Price (no discount)`);
      }
      
      console.log(`   Cancel at period end: ${subscription.cancel_at_period_end}`);
      console.log(`   Trial end: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleString() : 'No trial'}`);
      
      // Check latest invoice
      if (subscription.latest_invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
          console.log(`   💳 Latest Invoice: $${invoice.amount_paid / 100} paid, $${invoice.amount_due / 100} due`);
          console.log(`   📄 Invoice Status: ${invoice.status}`);
        } catch (err) {
          console.log(`   💳 Invoice: Error retrieving (${err.message})`);
        }
      }
      
      console.log('');
    }

    // Look specifically for PAPERCLIP usage
    console.log('\n🔍 Checking for PAPERCLIP promotion code usage...');
    const promoCodes = await stripe.promotionCodes.list({
      code: 'PAPERCLIP',
      limit: 1
    });

    if (promoCodes.data.length > 0) {
      const paperclip = promoCodes.data[0];
      console.log(`✅ PAPERCLIP promotion code found:`);
      console.log(`   ID: ${paperclip.id}`);
      console.log(`   Times redeemed: ${paperclip.times_redeemed}`);
      console.log(`   Active: ${paperclip.active}`);
      console.log(`   Coupon: ${paperclip.coupon.id} (${paperclip.coupon.percent_off}% off)`);
    } else {
      console.log('❌ PAPERCLIP promotion code not found');
    }

  } catch (error) {
    console.error('❌ Error checking Stripe subscriptions:', error.message);
  }
}

// Run the check
if (require.main === module) {
  checkStripeSubscription();
}

module.exports = { checkStripeSubscription };