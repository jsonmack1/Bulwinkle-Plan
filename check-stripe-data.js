require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkStripeData() {
  console.log('🔍 Checking Stripe subscription data for PAPERCLIP...');
  
  // Get the PAPERCLIP sessions
  const sessions = await stripe.checkout.sessions.list({
    limit: 5,
    expand: ['data.subscription', 'data.customer']
  });
  
  for (const session of sessions.data) {
    if (session.metadata?.promo_code === 'PAPERCLIP') {
      console.log(`\n🎟️ PAPERCLIP Session: ${session.id}`);
      console.log(`   Email: ${session.customer_details?.email}`);
      console.log(`   Created: ${new Date(session.created * 1000).toISOString()}`);
      
      if (session.subscription) {
        const sub = session.subscription;
        console.log(`   📊 Subscription Details:`);
        console.log(`      ID: ${sub.id}`);
        console.log(`      Status: ${sub.status}`);
        console.log(`      Current Period Start: ${sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : 'N/A'}`);
        console.log(`      Current Period End: ${sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : 'N/A'}`);
        console.log(`      Trial Start: ${sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : 'N/A'}`);
        console.log(`      Trial End: ${sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : 'N/A'}`);
        console.log(`      Cancel at Period End: ${sub.cancel_at_period_end}`);
        
        if (sub.items?.data?.length > 0) {
          const item = sub.items.data[0];
          console.log(`      Price Details:`);
          console.log(`        Price ID: ${item.price.id}`);
          console.log(`        Interval: ${item.price.recurring?.interval}`);
          console.log(`        Interval Count: ${item.price.recurring?.interval_count}`);
          console.log(`        Amount: $${(item.price.unit_amount || 0) / 100}`);
        }
        
        // Check for discount/promotion
        if (sub.discount) {
          console.log(`      🎫 Discount Details:`);
          console.log(`        Promotion Code: ${sub.discount.promotion_code?.code}`);
          console.log(`        Coupon ID: ${sub.discount.coupon.id}`);
          console.log(`        Percent Off: ${sub.discount.coupon.percent_off}%`);
          console.log(`        Duration: ${sub.discount.coupon.duration}`);
          console.log(`        Duration in Months: ${sub.discount.coupon.duration_in_months}`);
        }
      }
    }
  }
  
  // Also check if we can get the PAPERCLIP promotion code details
  console.log('\n🎫 Checking PAPERCLIP promotion code details...');
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code: 'PAPERCLIP',
      limit: 1
    });
    
    if (promotionCodes.data.length > 0) {
      const promoCode = promotionCodes.data[0];
      console.log(`   Promotion Code: ${promoCode.code}`);
      console.log(`   Active: ${promoCode.active}`);
      console.log(`   Coupon ID: ${promoCode.coupon.id}`);
      console.log(`   Duration: ${promoCode.coupon.duration}`);
      console.log(`   Duration in Months: ${promoCode.coupon.duration_in_months}`);
      console.log(`   Percent Off: ${promoCode.coupon.percent_off}%`);
    }
  } catch (error) {
    console.log('   Could not fetch promotion code details:', error.message);
  }
}

checkStripeData().catch(console.error);