/**
 * Diagnose Subscription Issue
 * This script checks every step of the subscription detection process
 */

require('dotenv').config({ path: '.env.local' });

async function diagnoseSubscriptionIssue() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔍 DIAGNOSING SUBSCRIPTION ISSUE');
    console.log('================================');

    const testEmail = 'test13@testaccounts.com';
    
    // Step 1: Check database record
    console.log(`\n1️⃣ Database Record for ${testEmail}:`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (userError) {
      console.log('❌ Database error:', userError);
      return;
    }

    console.log('📊 Database fields:');
    console.log('   subscription_status:', user.subscription_status);
    console.log('   subscription_type:', user.subscription_type);
    console.log('   subscription_source:', user.subscription_source);
    console.log('   is_trial:', user.is_trial);
    console.log('   is_active:', user.is_active);
    console.log('   subscription_end_date:', user.subscription_end_date);
    console.log('   subscription_trial_end_date:', user.subscription_trial_end_date);
    console.log('   current_plan:', user.current_plan);

    // Step 2: Test subscription API directly
    console.log(`\n2️⃣ Testing Subscription API:`);
    try {
      const response = await fetch(`http://localhost:3000/api/user/subscription?userId=${user.id}`);
      const apiData = await response.json();
      
      console.log('📡 API Response:');
      console.log(JSON.stringify(apiData, null, 2));
      
      console.log('\n🔍 Key API fields:');
      console.log('   isPremium:', apiData.subscription?.isPremium);
      console.log('   isActive:', apiData.subscription?.isActive);
      console.log('   status:', apiData.subscription?.status);
      console.log('   plan:', apiData.subscription?.plan);
      
    } catch (apiError) {
      console.log('❌ API Error:', apiError.message);
    }

    // Step 3: Check subscription API logic manually
    console.log(`\n3️⃣ Manual Logic Check:`);
    const now = new Date();
    const endDate = user.subscription_end_date ? new Date(user.subscription_end_date) : null;
    
    console.log('   Current time:', now.toISOString());
    console.log('   End date:', endDate ? endDate.toISOString() : 'null');
    
    if (endDate) {
      const isActiveByDate = endDate > now;
      console.log('   Is active by date?', isActiveByDate);
      
      const daysRemaining = isActiveByDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      console.log('   Days remaining:', daysRemaining);
    } else {
      console.log('   No end date - checking status directly');
      console.log('   subscription_status === "premium"?', user.subscription_status === 'premium');
    }
    
    const isPremiumCalc = user.subscription_status === 'premium' && (endDate ? endDate > now : true);
    console.log('   Manual isPremium calculation:', isPremiumCalc);

    // Step 4: Check localStorage format
    console.log(`\n4️⃣ Auth Data Format Check:`);
    const authData = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at
    };
    console.log('📱 Auth data that should be in localStorage:');
    console.log(JSON.stringify(authData, null, 2));

    // Step 5: Check if database migration was applied
    console.log(`\n5️⃣ Database Schema Check:`);
    const { data: sampleUser } = await supabase
      .from('users')
      .select('subscription_type, subscription_source, is_trial, subscription_trial_end_date')
      .limit(1)
      .single();
      
    if (sampleUser.subscription_type !== undefined) {
      console.log('✅ Database migration appears to be applied');
    } else {
      console.log('❌ Database migration NOT applied - missing new columns');
    }

    // Step 6: Provide diagnosis
    console.log(`\n6️⃣ DIAGNOSIS:`);
    
    if (user.subscription_status === 'premium') {
      console.log('✅ User is marked as premium in database');
      
      if (endDate && endDate > now) {
        console.log('✅ Subscription end date is in the future');
        console.log('🔍 LIKELY ISSUE: Frontend subscription hook or API logic');
      } else if (!endDate) {
        console.log('⚠️ No subscription end date set');
        console.log('🔍 LIKELY ISSUE: Missing end date causing API to return false');
      } else {
        console.log('❌ Subscription end date is in the past');
        console.log('🔍 LIKELY ISSUE: Trial has expired');
      }
    } else {
      console.log('❌ User is NOT marked as premium in database');
      console.log('🔍 LIKELY ISSUE: Database update failed or webhook didn\'t process');
    }

    console.log(`\n🎯 RECOMMENDED FIX:`);
    if (user.subscription_status !== 'premium' || !endDate || endDate <= now) {
      console.log('1. Run manual fix script again with proper dates');
      console.log('2. Ensure subscription_end_date is set to 30 days from now');
      console.log('3. Verify database migration was applied in production');
    } else {
      console.log('1. Check frontend useSubscription hook logic');
      console.log('2. Verify localStorage key is correct');
      console.log('3. Check subscription API calculation logic');
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

diagnoseSubscriptionIssue().catch(console.error);