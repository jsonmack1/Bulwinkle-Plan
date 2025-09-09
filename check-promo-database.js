/**
 * Test if promo code database tables and functions exist
 */

const checkPromoDatabase = async () => {
  console.log('🔍 Checking promo code database setup...\n');

  // Load environment
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test 1: Check if promo_codes table exists
    console.log('1. Checking promo_codes table...');
    const { data: promoCodes, error: promoError } = await supabase
      .from('promo_codes')
      .select('code, name, type, active')
      .limit(5);

    if (promoError) {
      console.log('❌ promo_codes table does not exist or has issues:', promoError.message);
    } else {
      console.log('✅ promo_codes table exists!');
      console.log('   Available codes:', promoCodes?.map(c => c.code).join(', ') || 'none');
    }

    // Test 2: Check if promo_code_uses table exists
    console.log('\n2. Checking promo_code_uses table...');
    const { data: uses, error: usesError } = await supabase
      .from('promo_code_uses')
      .select('id')
      .limit(1);

    if (usesError) {
      console.log('❌ promo_code_uses table does not exist:', usesError.message);
    } else {
      console.log('✅ promo_code_uses table exists!');
    }

    // Test 3: Check if validation function exists
    console.log('\n3. Checking is_promo_code_valid function...');
    const { data: funcResult, error: funcError } = await supabase
      .rpc('is_promo_code_valid', { 
        p_code: 'TELESCOPE2025'
      });

    if (funcError) {
      console.log('❌ is_promo_code_valid function does not exist:', funcError.message);
    } else {
      console.log('✅ is_promo_code_valid function exists!');
      console.log('   Test result:', funcResult?.[0] || 'no result');
    }

    // Test 4: Check if apply function exists
    console.log('\n4. Checking apply_promo_code function...');
    const { data: applyResult, error: applyError } = await supabase
      .rpc('apply_promo_code', { 
        p_code: 'TESTCODE_INVALID',
        p_user_id: 'test',
        p_order_amount_cents: 1000
      });

    if (applyError) {
      console.log('❌ apply_promo_code function does not exist:', applyError.message);
    } else {
      console.log('✅ apply_promo_code function exists!');
      console.log('   Test result (should fail):', applyResult?.[0] || 'no result');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }

  console.log('\n📋 Instructions to fix issues:');
  console.log('1. Open Supabase dashboard at: https://supabase.com/dashboard/project');
  console.log('2. Go to SQL Editor');
  console.log('3. Run setup-promo-codes-manual.sql first (creates tables and data)');
  console.log('4. Then run setup-promo-functions.sql (creates validation functions)');
  console.log('5. Run this check script again to verify');
};

checkPromoDatabase().catch(console.error);