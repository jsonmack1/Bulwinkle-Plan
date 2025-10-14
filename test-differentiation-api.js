/**
 * Test script to diagnose differentiation API errors
 * Run this with: node test-differentiation-api.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 DIFFERENTIATION API DIAGNOSTIC TEST\n');
console.log('=' .repeat(60));

// 1. Check if API key is loaded
console.log('\n1️⃣ Environment Variable Check:');
console.log('-'.repeat(60));
const apiKey = process.env.ANTHROPIC_API_KEY;
console.log('API Key exists:', !!apiKey);
console.log('API Key length:', apiKey?.length || 0);
console.log('API Key prefix:', apiKey?.substring(0, 15) + '...' || 'N/A');
console.log('Valid format:', apiKey?.startsWith('sk-ant-') || false);

// 2. Test API key validation logic (from route.ts)
console.log('\n2️⃣ Validation Logic Test:');
console.log('-'.repeat(60));
const envKey = process.env.ANTHROPIC_API_KEY;
const isValidKey = envKey && envKey.length > 20 && envKey.startsWith('sk-ant-');
const anthropicKey = isValidKey ? envKey : null;

console.log('envKey exists:', !!envKey);
console.log('Length check (> 20):', envKey?.length > 20);
console.log('Prefix check (sk-ant-):', envKey?.startsWith('sk-ant-'));
console.log('isValidKey:', isValidKey);
console.log('anthropicKey assigned:', !!anthropicKey);

if (!anthropicKey) {
  console.log('\n❌ PROBLEM IDENTIFIED: API key validation failed!');
  console.log('   The validation logic is rejecting your API key.');
  process.exit(1);
}

// 3. Test actual API call
console.log('\n3️⃣ Testing Actual API Call:');
console.log('-'.repeat(60));

const testPayload = {
  activityContent: "Test activity: Students will learn basic addition.",
  gradeLevel: "2nd Grade",
  subject: "Math",
  topic: "Addition",
  activityType: "Guided Practice",
  duration: "30"
};

async function testAPI() {
  try {
    console.log('Making test API call to Anthropic...');
    console.log('Using API key:', anthropicKey.substring(0, 15) + '...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Say "API test successful" if you can read this.'
        }]
      })
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('\n❌ API ERROR:');
      console.log('Status:', response.status);
      console.log('Error body:', errorText);

      try {
        const errorJson = JSON.parse(errorText);
        console.log('\nParsed error:');
        console.log(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON
      }

      return false;
    }

    const data = await response.json();
    console.log('\n✅ API CALL SUCCESSFUL!');
    console.log('Response:', JSON.stringify(data, null, 2));
    return true;

  } catch (error) {
    console.log('\n❌ FETCH ERROR:');
    console.log('Error type:', error.name);
    console.log('Error message:', error.message);
    console.log('Full error:', error);
    return false;
  }
}

testAPI().then(success => {
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('✅ DIAGNOSIS: API key is working correctly!');
    console.log('   The issue must be in the route handler logic.');
    console.log('\n💡 Next steps:');
    console.log('   1. Check the server console logs when clicking the button');
    console.log('   2. Look for console.log messages starting with 🔑, 🎯, ❌');
    console.log('   3. The error might be in the response parsing logic');
  } else {
    console.log('❌ DIAGNOSIS: API call is failing!');
    console.log('   This could be:');
    console.log('   - Invalid API key');
    console.log('   - Network/firewall issue');
    console.log('   - Anthropic API service issue');
    console.log('   - Rate limiting');
  }
  console.log('='.repeat(60) + '\n');
});
