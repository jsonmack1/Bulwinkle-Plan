/**
 * Fix PAPERCLIP to be a one-time 30-day trial (NOT repeating)
 * This uses Stripe's trial_period_days feature for a true one-time trial
 */

require('dotenv').config({ path: '.env.local' });

async function fixPaperclipOneTimeTrial() {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    console.log('🔧 Fixing PAPERCLIP to be a ONE-TIME 30-day trial');
    console.log('==================================================');

    // Step 1: Deactivate the current repeating PAPERCLIP
    console.log('\n1️⃣ Deactivating current repeating PAPERCLIP...');
    
    const existingCodes = await stripe.promotionCodes.list({
      code: 'PAPERCLIP',
      limit: 10
    });
    
    for (const code of existingCodes.data) {
      if (code.active) {
        await stripe.promotionCodes.update(code.id, { active: false });
        console.log(`🗑️ Deactivated: ${code.id}`);
      }
    }

    // Step 2: Create a dedicated trial price for PAPERCLIP
    console.log('\n2️⃣ Creating dedicated trial price for PAPERCLIP...');
    
    try {
      const trialPrice = await stripe.prices.create({
        unit_amount: 999, // $9.99 after trial
        currency: 'usd',
        recurring: {
          interval: 'month',
          trial_period_days: 30 // Built-in 30-day trial
        },
        product: 'prod_default', // You may need to create a product first
        metadata: {
          type: 'paperclip_trial',
          promo_code: 'PAPERCLIP',
          description: 'One-time 30-day trial then $9.99/month'
        }
      });
      
      console.log(`✅ Created trial price: ${trialPrice.id}`);
      console.log(`   Trial Period: 30 days`);
      console.log(`   After Trial: $9.99/month`);
      
      // Save this price ID for the checkout API
      console.log(`\n💡 IMPORTANT: Update your checkout API to use price: ${trialPrice.id} for PAPERCLIP`);
      
    } catch (priceError) {
      if (priceError.message.includes('No such product')) {
        console.log('⚠️ Need to create product first. Creating default product...');
        
        // Create product first
        const product = await stripe.products.create({
          id: 'prod_default',
          name: 'Peabody Premium Subscription',
          description: 'Premium access to Peabody lesson plan builder',
          metadata: {
            type: 'subscription',
            created_by: 'setup_script'
          }
        });
        
        console.log(`✅ Created product: ${product.id}`);
        
        // Now create the trial price
        const trialPrice = await stripe.prices.create({
          unit_amount: 999,
          currency: 'usd',
          recurring: {
            interval: 'month',
            trial_period_days: 30
          },
          product: product.id,
          metadata: {
            type: 'paperclip_trial',
            promo_code: 'PAPERCLIP',
            description: 'One-time 30-day trial then $9.99/month'
          }
        });
        
        console.log(`✅ Created trial price: ${trialPrice.id}`);
        
      } else {
        throw priceError;
      }
    }
    
    // Step 3: Alternative approach - Update checkout API to add trial directly
    console.log('\n3️⃣ RECOMMENDED APPROACH:');
    console.log('Instead of a promotion code, modify the checkout API to:');
    console.log('1. When PAPERCLIP is used, add subscription_data.trial_period_days: 30');
    console.log('2. Use the regular monthly price (price_1RziZ49H60ntGZzFuter4Ahj)');
    console.log('3. This gives a true one-time 30-day trial');
    
    console.log('\n4️⃣ CHECKOUT API MODIFICATION NEEDED:');
    console.log(`
// In create-checkout API, for PAPERCLIP:
const sessionConfig = {
  mode: 'subscription',
  line_items: [{
    price: 'price_1RziZ49H60ntGZzFuter4Ahj', // Regular monthly price
    quantity: 1,
  }],
  subscription_data: {
    trial_period_days: 30, // One-time 30-day trial
    metadata: {
      promo_code: 'PAPERCLIP',
      trial_type: 'one_time_30_day'
    }
  },
  metadata: {
    promo_code: 'PAPERCLIP'
  }
};
    `);
    
    console.log('\n✅ This approach ensures:');
    console.log('   ✓ One-time trial only');
    console.log('   ✓ Exactly 30 days');
    console.log('   ✓ Automatic billing after trial');
    console.log('   ✓ Proper trial tracking in Stripe');
    console.log('   ✓ Clear trial_end date');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Update create-checkout API to use trial_period_days for PAPERCLIP');
    console.log('2. Remove promotion code logic for PAPERCLIP');
    console.log('3. Use subscription_data.trial_period_days: 30');
    console.log('4. Test the complete flow');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

// Run the fix
if (require.main === module) {
  fixPaperclipOneTimeTrial();
}

module.exports = { fixPaperclipOneTimeTrial };