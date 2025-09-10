/**
 * Find Subscription with PAPERCLIP Promo Code
 * This script searches for subscriptions that used the PAPERCLIP promotion code
 */

require('dotenv').config({ path: '.env.local' });

async function findPromoSubscriptions() {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    console.log('🔍 Searching for subscriptions with PAPERCLIP promo code...');
    console.log('========================================================');

    // Get the PAPERCLIP promotion code first
    const promoCodes = await stripe.promotionCodes.list({
      code: 'PAPERCLIP',
      limit: 1
    });

    if (promoCodes.data.length === 0) {
      console.log('❌ PAPERCLIP promotion code not found');
      return;
    }

    const paperclipPromo = promoCodes.data[0];
    console.log(`✅ Found PAPERCLIP promo: ${paperclipPromo.id}`);
    console.log(`   Times redeemed: ${paperclipPromo.times_redeemed}`);

    // Search for subscriptions with this promotion code
    // We'll need to check recent subscriptions and look at their checkout sessions
    console.log('\n🔍 Checking recent checkout sessions for PAPERCLIP...');
    
    const sessions = await stripe.checkout.sessions.list({
      limit: 20,
      expand: ['data.subscription', 'data.customer']
    });

    console.log(`\n📋 Found ${sessions.data.length} recent checkout sessions:\n`);

    for (const session of sessions.data) {
      if (session.mode === 'subscription' && session.subscription) {
        const hasPromoCode = session.metadata?.promo_code === 'PAPERCLIP';
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        
        console.log(`🛒 Checkout Session: ${session.id}`);
        console.log(`   Created: ${new Date(session.created * 1000).toLocaleString()}`);
        console.log(`   Customer: ${session.customer_details?.email || session.customer?.email || 'Unknown'}`);
        console.log(`   Amount Total: $${(session.amount_total || 0) / 100}`);
        console.log(`   Payment Status: ${session.payment_status}`);
        console.log(`   Promo Code in Metadata: ${hasPromoCode ? 'PAPERCLIP' : 'None'}`);
        console.log(`   Subscription ID: ${subscriptionId}`);
        
        if (hasPromoCode) {
          console.log('   🎉 THIS SESSION USED PAPERCLIP!');
          
          // Get the full subscription details
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ['customer', 'items.data.price', 'discount.promotion_code']
            });
            
            console.log(`   📊 Subscription Details:`);
            console.log(`      Status: ${subscription.status}`);
            console.log(`      Customer: ${subscription.customer.email || subscription.customer.id}`);
            console.log(`      Current Period: ${new Date(subscription.current_period_start * 1000).toLocaleDateString()} - ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
            
            if (subscription.discount) {
              console.log(`      🎁 Active Discount: ${subscription.discount.coupon.percent_off || subscription.discount.coupon.amount_off}% off`);
              console.log(`      🎟️ Promotion Code: ${subscription.discount.promotion_code?.code || 'N/A'}`);
            } else {
              console.log(`      💰 No active discount found`);
            }
            
            // Check if this subscription is in our database
            console.log(`   🔍 Checking if subscription is in Supabase...`);
            
          } catch (subError) {
            console.log(`   ❌ Error fetching subscription: ${subError.message}`);
          }
        }
        
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error searching for promo subscriptions:', error.message);
  }
}

// Run the search
if (require.main === module) {
  findPromoSubscriptions();
}

module.exports = { findPromoSubscriptions };