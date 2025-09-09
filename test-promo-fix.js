/**
 * Test promo code fix after permissions are updated
 */

const testPromoFix = async () => {
  console.log('🔧 Testing Promo Code Fix...\n');
  
  const testCases = [
    {
      name: 'Browser-like request (previously failing)',
      payload: {
        code: 'TELESCOPE2025',
        orderAmount: 7990,
        userId: 'test_user_12345', 
        fingerprintHash: 'test_fingerprint_12345'
      }
    },
    {
      name: 'Anonymous user with fingerprint',
      payload: {
        code: 'PAPERCLIP',
        orderAmount: 999,
        fingerprintHash: 'anonymous_fingerprint_12345'
      }
    },
    {
      name: 'Authenticated user without fingerprint',
      payload: {
        code: 'MIDNIGHT50',
        orderAmount: 7990,
        userId: 'auth_user_12345'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 ${testCase.name}:`);
    
    try {
      const response = await fetch('http://localhost:3000/api/promo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ SUCCESS: Valid=${result.valid}`);
        if (result.promoCode) {
          console.log(`   💰 ${result.promoCode.code}: ${result.promoCode.name}`);
          console.log(`   🎁 Type: ${result.promoCode.type}`);
          if (result.discountPreview) {
            console.log(`   💸 Discount: $${result.discountPreview.discountAmount/100}`);
          }
        }
      } else {
        const error = await response.text();
        console.log(`   ❌ FAILED: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 If all tests show SUCCESS, the promo code 500 error is fixed!');
  console.log('🎯 Users should now be able to apply promo codes from the UI.');
};

testPromoFix().catch(console.error);