// Debug script to find your production account
// Run with: node debug-production-account.js

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function findProductionAccount() {
  console.log('🔍 Searching for your production account...\n');

  try {
    // 1. List recent customers
    console.log('1️⃣ Recent Customers (last 10):');
    const customers = await stripe.customers.list({ limit: 10 });
    
    customers.data.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.email} (${customer.id})`);
      console.log(`      Created: ${new Date(customer.created * 1000).toLocaleString()}`);
      console.log(`      Name: ${customer.name || 'Not provided'}`);
    });

    // 2. List recent subscriptions
    console.log('\n2️⃣ Recent Subscriptions (last 10):');
    const subscriptions = await stripe.subscriptions.list({ 
      limit: 10,
      status: 'all' 
    });
    
    for (const subscription of subscriptions.data) {
      const customer = await stripe.customers.retrieve(subscription.customer);
      console.log(`   📋 Subscription: ${subscription.id}`);
      console.log(`      Customer: ${customer.email} (${customer.id})`);
      console.log(`      Status: ${subscription.status}`);
      console.log(`      Created: ${new Date(subscription.created * 1000).toLocaleString()}`);
      console.log(`      Current Period End: ${new Date(subscription.current_period_end * 1000).toLocaleString()}`);
      console.log(`      Plan: ${subscription.items.data[0]?.price?.recurring?.interval || 'N/A'}`);
      console.log('   ---');
    }

    // 3. List recent charges/payments
    console.log('\n3️⃣ Recent Payments (last 5):');
    const charges = await stripe.charges.list({ limit: 5 });
    
    for (const charge of charges.data) {
      const customer = charge.customer ? await stripe.customers.retrieve(charge.customer) : null;
      console.log(`   💳 Payment: ${charge.id}`);
      console.log(`      Amount: $${charge.amount / 100}`);
      console.log(`      Customer: ${customer?.email || 'N/A'} (${charge.customer || 'N/A'})`);
      console.log(`      Status: ${charge.status}`);
      console.log(`      Created: ${new Date(charge.created * 1000).toLocaleString()}`);
      console.log(`      Description: ${charge.description || 'N/A'}`);
      console.log('   ---');
    }

    // 4. List payment intents
    console.log('\n4️⃣ Recent Payment Intents (last 5):');
    const paymentIntents = await stripe.paymentIntents.list({ limit: 5 });
    
    for (const intent of paymentIntents.data) {
      const customer = intent.customer ? await stripe.customers.retrieve(intent.customer) : null;
      console.log(`   🎯 Payment Intent: ${intent.id}`);
      console.log(`      Amount: $${intent.amount / 100}`);
      console.log(`      Customer: ${customer?.email || 'N/A'} (${intent.customer || 'N/A'})`);
      console.log(`      Status: ${intent.status}`);
      console.log(`      Created: ${new Date(intent.created * 1000).toLocaleString()}`);
      console.log('   ---');
    }

    console.log('\n🎯 What to do next:');
    console.log('1. Find your email in the customers list above');
    console.log('2. Note the customer ID (starts with cus_)');
    console.log('3. Find the associated subscription ID (starts with sub_)');
    console.log('4. Use these IDs to test the webhook manually');
    console.log('\nTo test webhook processing, make a POST request to:');
    console.log('POST /api/stripe/test-webhook');
    console.log('Body: { "customerId": "cus_..." } or { "subscriptionId": "sub_..." }');

  } catch (error) {
    console.error('❌ Error searching accounts:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 This usually means:');
      console.log('   • Your STRIPE_SECRET_KEY is incorrect or not set');
      console.log('   • You\'re using a test key but looking for live data');
      console.log('   • The key doesn\'t have the required permissions');
    }
  }
}

// Check if running directly
if (require.main === module) {
  findProductionAccount();
}

module.exports = { findProductionAccount };