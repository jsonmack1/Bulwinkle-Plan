/**
 * Final comprehensive promo code test
 */

const testPromoCodesComprehensive = async () => {
  console.log('🎯 Final Promo Code Test - All Features\n');

  const baseUrl = 'http://localhost:3000';
  
  const codes = [
    { code: 'TELESCOPE2025', expected: 'free_subscription', months: 3 },
    { code: 'PAPERCLIP', expected: 'free_subscription', months: 1 },
    { code: 'MIDNIGHT50', expected: 'discount_percent', percent: 50 },
    { code: 'DEVTEST', expected: 'free_subscription', months: 12 }
  ];

  for (const testCase of codes) {
    console.log(`\n🧪 Testing ${testCase.code}...`);
    
    try {
      // Test validation
      const validateResponse = await fetch(`${baseUrl}/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: testCase.code,
          orderAmount: 7990, // $79.90 in cents
          userId: 'test_user_' + Date.now(),
          fingerprintHash: 'test_fp_' + Math.random()
        })
      });
      
      const validateResult = await validateResponse.json();
      
      if (validateResult.valid) {
        console.log('  ✅ Validation: PASSED');
        console.log(`     Type: ${validateResult.promoCode.type}`);
        
        if (testCase.expected === 'free_subscription') {
          console.log(`     Free months: ${validateResult.promoCode.freeMonths}`);
        } else if (testCase.expected === 'discount_percent') {
          console.log(`     Discount: ${validateResult.promoCode.discountPercent}%`);
        }
        
        if (validateResult.discountPreview) {
          const { originalAmount, discountAmount, finalAmount } = validateResult.discountPreview;
          console.log(`     Original: $${(originalAmount/100).toFixed(2)}`);
          console.log(`     Discount: $${(discountAmount/100).toFixed(2)}`);
          console.log(`     Final: $${(finalAmount/100).toFixed(2)}`);
        }
      } else {
        console.log('  ❌ Validation: FAILED -', validateResult.error);
      }
      
    } catch (error) {
      console.log('  ❌ Test Error:', error.message);
    }
  }

  console.log('\n🎉 Comprehensive test completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:3000/pricing in your browser');
  console.log('2. Click "Have a promo code?" button');
  console.log('3. Enter one of the test codes (e.g., TELESCOPE2025)');
  console.log('4. Click Apply button');
  console.log('5. You should see green success message with discount details');
  console.log('\nIf the UI test works, the promo code functionality is fully operational! 🎯');
};

testPromoCodesComprehensive().catch(console.error);