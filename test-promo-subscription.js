/**
 * Test promo code subscription creation
 */

const testPromoSubscription = async () => {
  console.log('🎁 Testing Promo Code Subscription Creation...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test applying a free subscription promo code
  const testCases = [
    {
      name: 'Anonymous user with PAPERCLIP (1 month free)',
      payload: {
        code: 'PAPERCLIP',
        orderAmount: 0,
        fingerprintHash: 'test_anonymous_fingerprint_123'
      }
    },
    {
      name: 'Mock authenticated user with TELESCOPE2025 (3 months free)',
      payload: {
        code: 'TELESCOPE2025',
        orderAmount: 0,
        userId: 'test_user_12345',
        fingerprintHash: 'test_auth_fingerprint_123'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 ${testCase.name}:`);
    
    try {
      // First validate the promo code
      console.log('   📋 Step 1: Validating promo code...');
      const validateResponse = await fetch(`${baseUrl}/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });
      
      if (!validateResponse.ok) {
        console.log(`   ❌ Validation failed: ${validateResponse.status}`);
        continue;
      }
      
      const validateResult = await validateResponse.json();
      console.log(`   ✅ Validation success: ${validateResult.promoCode.code} (${validateResult.promoCode.type})`);
      
      if (validateResult.promoCode.type === 'free_subscription') {
        console.log(`   🎁 Free subscription: ${validateResult.promoCode.freeMonths} months`);
        
        // Apply the promo code
        console.log('   📋 Step 2: Applying promo code...');
        const applyResponse = await fetch(`${baseUrl}/api/promo/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...testCase.payload,
            metadata: {
              test: true,
              timestamp: new Date().toISOString()
            }
          })
        });
        
        if (applyResponse.ok) {
          const applyResult = await applyResponse.json();
          console.log('   ✅ Application success!');
          
          if (applyResult.subscriptionModification) {
            console.log(`   🎯 Subscription: ${applyResult.subscriptionModification.type}`);
            console.log(`   📅 Description: ${applyResult.subscriptionModification.description}`);
            
            if (applyResult.subscriptionModification.endDate) {
              const endDate = new Date(applyResult.subscriptionModification.endDate);
              console.log(`   ⏰ Valid until: ${endDate.toLocaleDateString()}`);
            }
          }
        } else {
          const error = await applyResponse.text();
          console.log(`   ❌ Application failed: ${applyResponse.status} - ${error}`);
        }
      }
      
    } catch (error) {
      console.log(`   💥 Test failed: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Test Summary:');
  console.log('✅ Anonymous users should see "Create account to claim" message');
  console.log('✅ Authenticated users should get immediate subscription activation');
  console.log('✅ Page should reload after successful activation to show premium status');
  console.log('\n📋 Next Steps:');
  console.log('1. Test in browser with a real user account');
  console.log('2. Verify header shows premium status after promo application');
  console.log('3. Check that premium features are unlocked');
};

testPromoSubscription().catch(console.error);