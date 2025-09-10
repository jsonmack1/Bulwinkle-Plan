/**
 * Fix Existing PAPERCLIP Users
 * This script manually processes recent PAPERCLIP sessions and updates users
 */

require('dotenv').config({ path: '.env.local' });

async function fixPaperclipUsers() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Fixing Existing PAPERCLIP Users');
    console.log('=================================');

    // Get recent PAPERCLIP checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      expand: ['data.subscription', 'data.customer']
    });

    for (const session of sessions.data) {
      if (session.metadata?.promo_code === 'PAPERCLIP' && 
          session.payment_status === 'paid' && 
          session.subscription) {
        
        const email = session.customer_details?.email;
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : session.subscription.id;

        if (!email) {
          console.log(`⚠️ Skipping session ${session.id} - no email`);
          continue;
        }

        console.log(`\n🎟️ Processing PAPERCLIP session for ${email}:`);
        console.log(`   Session: ${session.id}`);
        console.log(`   Subscription: ${subscriptionId}`);
        console.log(`   Created: ${new Date(session.created * 1000).toLocaleString()}`);

        // Get full subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['customer', 'items.data.price']
        });

        console.log(`   Subscription Status: ${subscription.status}`);
        const startDate = subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date();
        const endDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        console.log(`   Current Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);

        // Check if user exists
        let { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User doesn't exist, create them
          console.log(`   👤 Creating user for ${email}...`);
          
          const { data: newUser, error: createError } = await supabase
            .rpc('create_user_by_email', {
              p_email: email,
              p_name: email.split('@')[0],
              p_stripe_customer_id: subscription.customer.id || subscription.customer
            });

          if (createError) {
            console.error(`   ❌ Failed to create user: ${createError.message}`);
            continue;
          }

          // Get the created user
          const { data: createdUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (fetchError) {
            console.error(`   ❌ Failed to fetch created user: ${fetchError.message}`);
            continue;
          }

          user = createdUser;
          console.log(`   ✅ Created user: ${user.id}`);
        } else if (userError) {
          console.error(`   ❌ Error fetching user: ${userError.message}`);
          continue;
        } else {
          console.log(`   ✅ Found existing user: ${user.id}`);
        }

        // Update user with PAPERCLIP subscription details
        const updateData = {
          stripe_subscription_id: subscriptionId,
          subscription_status: 'premium',
          subscription_type: 'promo',
          subscription_source: 'PAPERCLIP',
          current_plan: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          subscription_cancel_at_period_end: subscription.cancel_at_period_end || false,
          stripe_customer_id: subscription.customer.id || subscription.customer,
          stripe_price_id: subscription.items.data[0]?.price?.id,
          subscription_amount_cents: subscription.items.data[0]?.price?.unit_amount || 0,
          subscription_currency: subscription.items.data[0]?.price?.currency || 'usd',
          updated_at: new Date().toISOString()
        };

        console.log(`   📝 Updating user with PAPERCLIP subscription...`);

        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error(`   ❌ Failed to update user: ${updateError.message}`);
        } else {
          console.log(`   ✅ Successfully updated user to premium!`);
          console.log(`      Status: ${updatedUser.subscription_status}`);
          console.log(`      Type: ${updatedUser.subscription_type}`);
          console.log(`      Source: ${updatedUser.subscription_source}`);
          console.log(`      End Date: ${updatedUser.subscription_end_date}`);
        }
      }
    }

    // Check final status
    console.log('\n📊 Final status check:');
    const { data: allUsers, error: fetchAllError } = await supabase
      .from('users')
      .select('email, subscription_status, subscription_type, subscription_source, subscription_end_date')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (fetchAllError) {
      console.error('❌ Error fetching users:', fetchAllError);
    } else {
      allUsers.forEach(user => {
        console.log(`   👤 ${user.email}: ${user.subscription_status} (${user.subscription_type || 'none'}) - Source: ${user.subscription_source || 'none'}`);
      });
    }

    console.log('\n🎉 PAPERCLIP user fix completed!');
    console.log('\nNext steps:');
    console.log('1. Apply the database migration SQL manually in Supabase');
    console.log('2. Test login with the fixed users');
    console.log('3. Check if header shows Premium status');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
if (require.main === module) {
  fixPaperclipUsers();
}

module.exports = { fixPaperclipUsers };