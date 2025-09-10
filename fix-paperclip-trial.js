/**
 * Fix PAPERCLIP to be a proper 30-day free trial
 * This will create the correct coupon structure for a true 30-day trial
 */

require('dotenv').config({ path: '.env.local' });

async function fixPaperclipTrial() {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    console.log('🔧 Fixing PAPERCLIP to be a proper 30-day free trial');
    console.log('===================================================');

    // Option 1: Create a new coupon for 30 days free (repeating for 1 month)
    console.log('\n1️⃣ Creating new PAPERCLIP coupon for proper 30-day trial...');
    
    const newCouponId = 'paperclip-30day-trial-v2';
    
    try {
      // Delete old promotion code first
      const existingCodes = await stripe.promotionCodes.list({
        code: 'PAPERCLIP',
        limit: 1
      });
      
      if (existingCodes.data.length > 0) {
        console.log('🗑️ Deactivating old PAPERCLIP promotion code...');
        await stripe.promotionCodes.update(existingCodes.data[0].id, {
          active: false
        });
      }
      
      // Create new coupon for proper trial
      const newCoupon = await stripe.coupons.create({
        id: newCouponId,
        duration: 'repeating',
        duration_in_months: 1, // Free for exactly 1 month
        percent_off: 100,
        max_redemptions: 1000,
        metadata: {
          campaign: 'paperclip_trial_v2',
          description: 'True 30-day free trial - 100% off first month only',
          created_by: 'fix_script',
          created_at: new Date().toISOString()
        }
      });
      
      console.log(`✅ Created new coupon: ${newCoupon.id}`);
      
      // Create new promotion code
      const newPromoCode = await stripe.promotionCodes.create({
        coupon: newCoupon.id,
        code: 'PAPERCLIP',
        max_redemptions: 1000,
        metadata: {
          campaign: 'paperclip_trial_v2',
          description: 'True 30-day free trial',
          created_by: 'fix_script',
          created_at: new Date().toISOString()
        }
      });
      
      console.log(`✅ Created new promotion code: ${newPromoCode.code}`);
      
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log('ℹ️ New coupon already exists, using existing one');
      } else {
        throw error;
      }
    }
    
    // Option 2: Better approach - Use Stripe's built-in trial periods
    console.log('\n2️⃣ Creating PAPERCLIP with Stripe trial periods (RECOMMENDED)...');
    
    try {
      // For trial periods, we don't need a coupon - we modify the checkout session
      console.log('💡 For trials, we should modify the checkout API to add trial_period_days: 30');
      console.log('   This gives a true 30-day trial, then charges the full amount');
      
      // Create a specific trial price if needed
      const trialPriceId = 'price_paperclip_trial';
      
      try {
        const trialPrice = await stripe.prices.create({
          id: trialPriceId,
          unit_amount: 999, // $9.99
          currency: 'usd',
          recurring: {
            interval: 'month',
            trial_period_days: 30 // 30-day trial built into the price
          },
          product: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID || 'prod_default',
          metadata: {
            type: 'paperclip_trial',
            description: '30-day trial then $9.99/month'
          }
        });
        
        console.log(`✅ Created trial price: ${trialPrice.id}`);
        
      } catch (priceError) {
        if (priceError.code === 'resource_already_exists') {
          console.log('ℹ️ Trial price already exists');
        } else {
          console.log('⚠️ Could not create trial price:', priceError.message);
        }
      }
      
    } catch (trialError) {
      console.log('⚠️ Trial setup failed:', trialError.message);
    }
    
    // Verify the setup
    console.log('\n3️⃣ Verifying new PAPERCLIP setup...');
    
    const updatedCodes = await stripe.promotionCodes.list({
      code: 'PAPERCLIP',
      limit: 1
    });
    
    if (updatedCodes.data.length > 0) {
      const code = updatedCodes.data[0];
      const coupon = await stripe.coupons.retrieve(code.coupon);
      
      console.log(`📊 Updated PAPERCLIP details:`);
      console.log(`   Code: ${code.code}`);
      console.log(`   Active: ${code.active}`);
      console.log(`   Coupon ID: ${coupon.id}`);
      console.log(`   Duration: ${coupon.duration}`);
      console.log(`   Duration in Months: ${coupon.duration_in_months}`);
      console.log(`   Percent Off: ${coupon.percent_off}%`);
    }
    
    console.log('\n📋 RECOMMENDED APPROACH:');
    console.log('1. Use the new repeating coupon (100% off for 1 month)');
    console.log('2. OR better: Use trial_period_days in checkout sessions');
    console.log('3. Update webhook to properly handle trial periods');
    console.log('4. Ensure database tracks trial_end_date separately');
    
    console.log('\n✅ PAPERCLIP trial fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

// Run the fix
if (require.main === module) {
  fixPaperclipTrial();
}

module.exports = { fixPaperclipTrial };