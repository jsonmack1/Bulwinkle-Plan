/**
 * Test Stripe Promotion Code Flow
 * This script tests the complete Stripe-based promo code implementation
 */

const TEST_USER_ID = 'd20ea346-0bb9-45ee-86e4-328933610787';
const API_BASE = 'http://localhost:3000';

// Test price IDs (you'll need to update these with your actual Stripe price IDs)
const MONTHLY_PRICE_ID = 'price_1234567890'; // Replace with actual monthly price ID
const ANNUAL_PRICE_ID = 'price_0987654321';  // Replace with actual annual price ID

async function testStripePromoFlow() {
  console.log('🧪 Testing Stripe Promotion Code Flow');
  console.log('====================================');
  
  try {
    // Test 1: Valid promo code checkout creation
    console.log('\n1️⃣ Testing valid promo code checkout creation...');
    const validPromoResponse = await fetch(`${API_BASE}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: MONTHLY_PRICE_ID,
        billingPeriod: 'monthly',
        promoCode: 'PAPERCLIP',
        userId: TEST_USER_ID,
        email: 'test@example.com',
        fingerprintHash: 'test-fingerprint-123',
        successUrl: `${API_BASE}/dashboard?upgraded=true&promo=PAPERCLIP`,
        cancelUrl: `${API_BASE}/pricing?promo_failed=PAPERCLIP`
      })
    });
    
    console.log(`Response status: ${validPromoResponse.status}`);
    
    if (validPromoResponse.ok) {
      const checkoutData = await validPromoResponse.json();
      console.log('✅ Checkout session created successfully');
      console.log('Session ID:', checkoutData.sessionId);
      console.log('Checkout URL:', checkoutData.checkoutUrl);
      
      if (checkoutData.checkoutUrl) {
        console.log('🎉 SUCCESS: Stripe checkout URL generated with promo code!');
        console.log('💡 Users can complete this checkout to get free subscription');
      }
    } else {
      const errorText = await validPromoResponse.text();
      console.log('❌ Valid promo code test failed:', errorText);
    }
    
    // Test 2: Invalid promo code handling
    console.log('\n2️⃣ Testing invalid promo code handling...');
    const invalidPromoResponse = await fetch(`${API_BASE}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: MONTHLY_PRICE_ID,
        billingPeriod: 'monthly',
        promoCode: 'INVALID_CODE_12345',
        userId: TEST_USER_ID,
        email: 'test@example.com',
        fingerprintHash: 'test-fingerprint-123',
        successUrl: `${API_BASE}/dashboard`,
        cancelUrl: `${API_BASE}/pricing`
      })
    });
    
    console.log(`Invalid promo response status: ${invalidPromoResponse.status}`);
    
    if (invalidPromoResponse.status === 400) {
      const errorData = await invalidPromoResponse.json();
      console.log('✅ Invalid promo code properly rejected');
      console.log('Error message:', errorData.error);
    } else {
      console.log('❌ Invalid promo code handling may need improvement');
    }
    
    // Test 3: Checkout without promo code (baseline)
    console.log('\n3️⃣ Testing checkout without promo code...');
    const noPromoResponse = await fetch(`${API_BASE}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: MONTHLY_PRICE_ID,
        billingPeriod: 'monthly',
        userId: TEST_USER_ID,
        email: 'test@example.com',
        fingerprintHash: 'test-fingerprint-123',
        successUrl: `${API_BASE}/dashboard`,
        cancelUrl: `${API_BASE}/pricing`
      })
    });
    
    if (noPromoResponse.ok) {
      const noPromoData = await noPromoResponse.json();
      console.log('✅ Baseline checkout (no promo) works');
      console.log('Session ID:', noPromoData.sessionId);
    } else {
      console.log('❌ Baseline checkout failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function testStripePromoSetup() {
  console.log('\n\n🧪 Testing Stripe Promo Setup');
  console.log('=============================');
  
  // This would test the setup script, but requires Stripe secret key
  console.log('To test promo setup:');
  console.log('1. Ensure STRIPE_SECRET_KEY is in .env');
  console.log('2. Run: node setup-stripe-promo-codes.js');
  console.log('3. Check Stripe dashboard for created coupons and promotion codes');
}

async function testComponentIntegration() {
  console.log('\n\n🧪 Testing Component Integration');
  console.log('================================');
  
  console.log('Manual testing steps for StripePromoCodeInput component:');
  console.log('1. Add StripePromoCodeInput to pricing page');
  console.log('2. Enter "PAPERCLIP" and click Apply');
  console.log('3. Should redirect to Stripe checkout');
  console.log('4. Checkout should show $0.00 due to 100% discount');
  console.log('5. Complete checkout');
  console.log('6. Webhook should create premium subscription');
  console.log('7. Return to dashboard with Premium status');
}

async function runAllTests() {
  console.log('🚀 Starting Stripe Promo Code Tests');
  console.log('====================================\n');
  
  await testStripePromoFlow();
  await testStripePromoSetup();
  await testComponentIntegration();
  
  console.log('\n🏁 All tests completed');
  console.log('\nNext steps:');
  console.log('1. Run setup-stripe-promo-codes.js to create Stripe coupons');
  console.log('2. Update pricing page to use StripePromoCodeInput');
  console.log('3. Update price IDs in this test script');
  console.log('4. Test complete user flow manually');
}

// Helper function to get actual price IDs from environment or config
function getPriceIds() {
  // You might want to read these from environment variables or a config file
  return {
    monthly: process.env.STRIPE_MONTHLY_PRICE_ID || MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_ANNUAL_PRICE_ID || ANNUAL_PRICE_ID
  };
}

// Run if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { 
  testStripePromoFlow, 
  testStripePromoSetup, 
  testComponentIntegration,
  runAllTests 
};