/**
 * Test script to verify subscription API fixes
 * This tests both the RLS fix and promo code application
 */

const TEST_USER_ID = 'd20ea346-0bb9-45ee-86e4-328933610787';
const API_BASE = 'http://localhost:3000';

async function testSubscriptionAPI() {
  console.log('🧪 Testing Subscription API Fixes');
  console.log('==================================');
  
  try {
    // Test 1: Check if subscription API now works (should not get 500 error)
    console.log('\n1️⃣ Testing subscription API endpoint...');
    const subscriptionResponse = await fetch(`${API_BASE}/api/user/subscription?userId=${TEST_USER_ID}`);
    
    console.log(`Response status: ${subscriptionResponse.status}`);
    
    if (subscriptionResponse.ok) {
      const subscriptionData = await subscriptionResponse.json();
      console.log('✅ Subscription API working!');
      console.log('Current subscription status:', {
        status: subscriptionData.subscription?.status,
        isPremium: subscriptionData.subscription?.isPremium,
        isActive: subscriptionData.subscription?.isActive,
        endDate: subscriptionData.subscription?.endDate
      });
    } else {
      const errorText = await subscriptionResponse.text();
      console.log('❌ Subscription API still failing:', errorText);
      return;
    }
    
    // Test 2: Apply promo code
    console.log('\n2️⃣ Testing promo code application...');
    const promoResponse = await fetch(`${API_BASE}/api/promo/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'PAPERCLIP',
        userId: TEST_USER_ID,
        fingerprintHash: 'test-fingerprint-123',
        orderAmount: 0,
        metadata: {
          appliedFrom: 'test_script',
          timestamp: new Date().toISOString(),
          userEmail: 'test@example.com',
          userName: 'Test User'
        }
      })
    });
    
    console.log(`Promo response status: ${promoResponse.status}`);
    
    if (promoResponse.ok) {
      const promoData = await promoResponse.json();
      console.log('✅ Promo code application response:', {
        success: promoData.success,
        subscriptionModification: promoData.subscriptionModification
      });
    } else {
      const errorText = await promoResponse.text();
      console.log('❌ Promo code application failed:', errorText);
    }
    
    // Test 3: Check subscription status after promo code
    console.log('\n3️⃣ Testing subscription status after promo code...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const postPromoResponse = await fetch(`${API_BASE}/api/user/subscription?userId=${TEST_USER_ID}`);
    
    if (postPromoResponse.ok) {
      const postPromoData = await postPromoResponse.json();
      console.log('✅ Post-promo subscription status:', {
        status: postPromoData.subscription?.status,
        isPremium: postPromoData.subscription?.isPremium,
        isActive: postPromoData.subscription?.isActive,
        endDate: postPromoData.subscription?.endDate
      });
      
      if (postPromoData.subscription?.isPremium) {
        console.log('🎉 SUCCESS: User is now premium after promo code!');
      } else {
        console.log('⚠️  ISSUE: User is still not premium after promo code');
      }
    } else {
      console.log('❌ Failed to check post-promo status');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test invalid promo code feedback
async function testInvalidPromoCode() {
  console.log('\n\n🧪 Testing Invalid Promo Code Feedback');
  console.log('======================================');
  
  try {
    const response = await fetch(`${API_BASE}/api/promo/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'INVALID_CODE_12345',
        userId: TEST_USER_ID,
        fingerprintHash: 'test-fingerprint-123',
        orderAmount: 2999
      })
    });
    
    const data = await response.json();
    console.log('Invalid promo code response:', {
      valid: data.valid,
      error: data.error
    });
    
    if (!data.valid && data.error) {
      console.log('✅ Invalid promo code properly returns error message');
    } else {
      console.log('❌ Invalid promo code handling may need improvement');
    }
    
  } catch (error) {
    console.error('❌ Invalid promo test failed:', error);
  }
}

async function runAllTests() {
  await testSubscriptionAPI();
  await testInvalidPromoCode();
  console.log('\n🏁 All tests completed');
}

// Run if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testSubscriptionAPI, testInvalidPromoCode, runAllTests };