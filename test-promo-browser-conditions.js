/**
 * Test promo code API under browser-like conditions
 */

const testPromoBrowserConditions = async () => {
  console.log('🔍 Testing Promo Code API under browser conditions...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test scenarios that might occur from the browser
  const testCases = [
    {
      name: 'With userId and fingerprint (typical browser call)',
      payload: {
        code: 'TELESCOPE2025',
        orderAmount: 7990,
        userId: 'test_user_12345',
        fingerprintHash: 'test_fingerprint_hash_12345'
      }
    },
    {
      name: 'With fingerprint but no userId (anonymous user)',
      payload: {
        code: 'TELESCOPE2025', 
        orderAmount: 7990,
        fingerprintHash: 'test_fingerprint_hash_12345'
      }
    },
    {
      name: 'With userId but no fingerprint',
      payload: {
        code: 'TELESCOPE2025',
        orderAmount: 7990,
        userId: 'test_user_12345'
      }
    },
    {
      name: 'With null values (common in JS)',
      payload: {
        code: 'TELESCOPE2025',
        orderAmount: 7990,
        userId: null,
        fingerprintHash: null
      }
    },
    {
      name: 'With undefined values',
      payload: {
        code: 'TELESCOPE2025',
        orderAmount: 7990,
        userId: undefined,
        fingerprintHash: undefined  
      }
    },
    {
      name: 'Different promo code',
      payload: {
        code: 'PAPERCLIP',
        orderAmount: 999,
        userId: 'test_user_12345',
        fingerprintHash: 'test_fingerprint_hash_12345'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}:`);
    
    try {
      const response = await fetch(`${baseUrl}/api/promo/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify(testCase.payload)
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Success: Valid=${result.valid}`);
        if (result.promoCode) {
          console.log(`   💰 Code: ${result.promoCode.code} (${result.promoCode.type})`);
        }
        if (result.discountPreview) {
          console.log(`   💸 Discount: $${result.discountPreview.discountAmount/100} off`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   💥 Request failed: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🔍 Additional debugging test...');
  
  // Test with exact browser headers
  try {
    const browserLikeResponse = await fetch(`${baseUrl}/api/promo/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'http://localhost:3000/pricing'
      },
      body: JSON.stringify({
        code: 'TELESCOPE2025',
        orderAmount: 7990,
        userId: 'clh5k2j3p0001l508w9r9x3yq', // Realistic user ID format
        fingerprintHash: 'a1b2c3d4e5f6789012345678901234567890abcd'
      })
    });
    
    console.log(`Browser-like request: ${browserLikeResponse.status}`);
    
    if (!browserLikeResponse.ok) {
      const errorDetails = await browserLikeResponse.text();
      console.log('Error details:', errorDetails);
    }
    
  } catch (error) {
    console.log('Browser-like request failed:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('If any of the above tests show 500 errors, that explains the browser issue.');
  console.log('The difference between curl (working) and browser (failing) is likely:');
  console.log('• Additional headers sent by browser');
  console.log('• Different parameter combinations (userId, fingerprint)');
  console.log('• Request origin/referer headers');
  console.log('• Specific parameter values causing database function issues');
};

testPromoBrowserConditions().catch(console.error);