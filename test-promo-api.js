/**
 * Test script to verify promo code API functionality
 * Run with: node test-promo-api.js
 */

const testPromoAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Promo Code API...\n');

  // Test 1: Validate TELESCOPE2025
  console.log('1. Testing TELESCOPE2025 validation...');
  try {
    const response = await fetch(`${baseUrl}/api/promo/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'TELESCOPE2025',
        orderAmount: 7990, // $79.90 in cents
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
  }

  console.log('\n2. Testing PAPERCLIP validation...');
  try {
    const response = await fetch(`${baseUrl}/api/promo/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'PAPERCLIP',
        orderAmount: 999, // $9.99 in cents
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
  }

  console.log('\n3. Testing invalid code...');
  try {
    const response = await fetch(`${baseUrl}/api/promo/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'INVALIDCODE123',
        orderAmount: 7990,
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Invalid code test failed:', error.message);
  }

  console.log('\n✅ Promo API tests completed!');
};

// Run tests if node environment has fetch support
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch for testing...');
  const { default: fetch } = require('node-fetch');
  global.fetch = fetch;
}

testPromoAPI().catch(console.error);