/**
 * Manual PAPERCLIP Fix for Production
 * This script manually upgrades users who completed PAPERCLIP checkout but didn't get upgraded
 */

require('dotenv').config({ path: '.env.local' });

async function manualPaperclipFix() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔧 Manual PAPERCLIP Fix for Production');
    console.log('====================================');

    // List of users to fix (add emails here)
    const emailsToFix = [
      'test13@testaccounts.com',
      // Add more emails as needed
    ];

    for (const email of emailsToFix) {
      console.log(`\n🎟️ Fixing PAPERCLIP user: ${email}`);
      
      // Calculate trial dates
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      
      // Update user to premium with PAPERCLIP trial
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          subscription_status: 'premium',
          subscription_type: 'promo',
          subscription_source: 'PAPERCLIP',
          current_plan: 'monthly',
          subscription_start_date: now.toISOString(),
          subscription_end_date: trialEndDate.toISOString(),
          subscription_trial_end_date: trialEndDate.toISOString(),
          is_trial: true,
          is_active: true,
          updated_at: now.toISOString()
        })
        .eq('email', email)
        .select()
        .single();
        
      if (error) {
        console.log(`❌ Failed to fix ${email}:`, error.message);
      } else {
        console.log(`✅ Successfully fixed ${email}`);
        console.log(`   Status: ${updatedUser.subscription_status}`);
        console.log(`   Type: ${updatedUser.subscription_type}`);
        console.log(`   Trial ends: ${updatedUser.subscription_trial_end_date}`);
        
        // Log the manual fix
        await supabase
          .from('subscription_events')
          .insert({
            user_id: updatedUser.id,
            event_type: 'manual_paperclip_fix',
            event_data: {
              email: email,
              fixedAt: now.toISOString(),
              trialEndDate: trialEndDate.toISOString(),
              method: 'manual_script'
            }
          });
      }
    }

    console.log('\n🎉 Manual fix completed!');
    console.log('Users should now see premium dashboard after refreshing.');
    
  } catch (error) {
    console.error('❌ Manual fix failed:', error.message);
  }
}

manualPaperclipFix().catch(console.error);