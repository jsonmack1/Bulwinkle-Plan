/**
 * Setup Stripe Promotion Codes
 * This script creates coupons and promotion codes in Stripe for our promo campaigns
 */

require('dotenv').config();

async function setupStripePromoCodes() {
  try {
    // Import Stripe with secret key
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    console.log('🎟️ Setting up Stripe Promotion Codes');
    console.log('=====================================');

    // Define our promo campaigns
    const promoCampaigns = [
      {
        couponId: 'paperclip-30days-free',
        promoCode: 'PAPERCLIP',
        description: '30 days free premium subscription',
        duration: 'once', // One-time 100% discount for first billing cycle
        percentOff: 100,
        maxRedemptions: 1000
      },
      {
        couponId: 'telescope-3months-free',
        promoCode: 'TELESCOPE2025',
        description: '3 months free premium access',
        duration: 'repeating',
        durationInMonths: 3,
        percentOff: 100,
        maxRedemptions: 500
      },
      {
        couponId: 'midnight-50-percent',
        promoCode: 'MIDNIGHT50',
        description: '50% off first payment',
        duration: 'once',
        percentOff: 50,
        maxRedemptions: 1000
      }
    ];

    for (const campaign of promoCampaigns) {
      console.log(`\n🎫 Creating campaign: ${campaign.promoCode}`);
      
      try {
        // Step 1: Create or update coupon
        console.log(`  📋 Creating coupon: ${campaign.couponId}`);
        
        const couponParams = {
          id: campaign.couponId,
          duration: campaign.duration,
          percent_off: campaign.percentOff,
          max_redemptions: campaign.maxRedemptions,
          metadata: {
            campaign: campaign.promoCode.toLowerCase(),
            description: campaign.description,
            created_by: 'setup_script',
            created_at: new Date().toISOString()
          }
        };

        // Add duration_in_months for repeating coupons
        if (campaign.duration === 'repeating' && campaign.durationInMonths) {
          couponParams.duration_in_months = campaign.durationInMonths;
        }

        let coupon;
        try {
          // Try to create new coupon
          coupon = await stripe.coupons.create(couponParams);
          console.log(`  ✅ Created coupon: ${coupon.id}`);
        } catch (error) {
          if (error.code === 'resource_already_exists') {
            // Coupon already exists, retrieve it
            coupon = await stripe.coupons.retrieve(campaign.couponId);
            console.log(`  ♻️  Coupon already exists: ${coupon.id}`);
          } else {
            throw error;
          }
        }

        // Step 2: Create promotion code
        console.log(`  🎟️ Creating promotion code: ${campaign.promoCode}`);
        
        try {
          // Check if promotion code already exists
          const existingCodes = await stripe.promotionCodes.list({
            code: campaign.promoCode,
            limit: 1
          });

          let promotionCode;
          if (existingCodes.data.length > 0) {
            promotionCode = existingCodes.data[0];
            console.log(`  ♻️  Promotion code already exists: ${promotionCode.code}`);
          } else {
            // Create new promotion code
            promotionCode = await stripe.promotionCodes.create({
              coupon: coupon.id,
              code: campaign.promoCode,
              max_redemptions: campaign.maxRedemptions,
              metadata: {
                campaign: campaign.promoCode.toLowerCase(),
                description: campaign.description,
                created_by: 'setup_script',
                created_at: new Date().toISOString()
              }
            });
            console.log(`  ✅ Created promotion code: ${promotionCode.code}`);
          }

          // Display summary
          console.log(`  📊 Summary:`);
          console.log(`     Code: ${promotionCode.code}`);
          console.log(`     Discount: ${campaign.percentOff}% off`);
          console.log(`     Duration: ${campaign.duration}${campaign.durationInMonths ? ` (${campaign.durationInMonths} months)` : ''}`);
          console.log(`     Max Redemptions: ${campaign.maxRedemptions}`);
          console.log(`     Active: ${promotionCode.active}`);

        } catch (promoError) {
          console.error(`  ❌ Failed to create promotion code:`, promoError.message);
        }

      } catch (campaignError) {
        console.error(`❌ Failed to set up campaign ${campaign.promoCode}:`, campaignError.message);
      }
    }

    console.log('\n🎉 Stripe promotion codes setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update PromoCodeInput component to use Stripe checkout');
    console.log('2. Modify create-checkout API to handle promotion codes');
    console.log('3. Test the complete flow');

    // List all promotion codes for verification
    console.log('\n📋 Current promotion codes in Stripe:');
    const allPromoCodes = await stripe.promotionCodes.list({ limit: 10 });
    
    for (const code of allPromoCodes.data) {
      console.log(`  ${code.code} - ${code.coupon.percent_off}% off (${code.active ? 'Active' : 'Inactive'})`);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupStripePromoCodes();
}

module.exports = { setupStripePromoCodes };