// Test script for Stripe production setup
// Run with: node test-stripe-production.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeProduction() {
  console.log('🧪 Testing Stripe Production Setup...\n');

  try {
    // 1. Test API connection
    console.log('1. Testing API connection...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.display_name}`);
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Live mode: ${!account.livemode ? '❌ TEST MODE' : '✅ LIVE MODE'}`);

    // 2. Test webhook endpoint
    console.log('\n2. Testing webhook endpoints...');
    const webhooks = await stripe.webhookEndpoints.list();
    console.log(`✅ Found ${webhooks.data.length} webhook endpoint(s)`);
    webhooks.data.forEach((webhook, index) => {
      console.log(`   ${index + 1}. ${webhook.url} (${webhook.status})`);
      console.log(`      Events: ${webhook.enabled_events.join(', ')}`);
    });

    // 3. Test products and prices
    console.log('\n3. Testing products and prices...');
    const products = await stripe.products.list({ active: true, limit: 10 });
    console.log(`✅ Found ${products.data.length} active product(s)`);
    
    for (const product of products.data) {
      const prices = await stripe.prices.list({ product: product.id, active: true });
      console.log(`   📦 ${product.name}`);
      prices.data.forEach(price => {
        const amount = price.unit_amount ? `$${price.unit_amount / 100}` : 'Free';
        const interval = price.recurring ? `/${price.recurring.interval}` : '';
        console.log(`      💰 ${amount}${interval} (${price.id})`);
      });
    }

    // 4. Environment variables check
    console.log('\n4. Checking environment variables...');
    const requiredVars = [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID'
    ];

    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        const value = process.env[varName];
        const masked = value.substring(0, 8) + '*'.repeat(Math.max(0, value.length - 8));
        console.log(`   ✅ ${varName}: ${masked}`);
      } else {
        console.log(`   ❌ ${varName}: Missing`);
      }
    });

    console.log('\n🎉 Production setup test completed!');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Test a real subscription with a real credit card');
    console.log('   2. Verify webhook events are received by your application');
    console.log('   3. Test the complete customer journey');

  } catch (error) {
    console.error('❌ Error testing Stripe production setup:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 This usually means:');
      console.log('   • Your STRIPE_SECRET_KEY is incorrect or not set');
      console.log('   • You\'re using a test key in production');
      console.log('   • The key doesn\'t have the required permissions');
    }
  }
}

// Check if running directly
if (require.main === module) {
  testStripeProduction();
}

module.exports = { testStripeProduction };