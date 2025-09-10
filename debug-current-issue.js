/**
 * Debug Current PAPERCLIP Issue
 * This script helps identify why the account is still showing as free
 */

require('dotenv').config({ path: '.env.local' });

async function debugCurrentIssue() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Debugging Current PAPERCLIP Issue');
    console.log('===================================');

    // Step 1: Check recent checkout sessions
    console.log('\n1️⃣ Checking recent checkout sessions...');
    const sessions = await stripe.checkout.sessions.list({
      limit: 5,
      expand: ['data.subscription', 'data.customer']
    });

    for (const session of sessions.data) {
      if (session.metadata?.promo_code === 'PAPERCLIP') {
        console.log(`\n🎟️ PAPERCLIP Session: ${session.id}`);
        console.log(`   Created: ${new Date(session.created * 1000).toLocaleString()}`);
        console.log(`   Email: ${session.customer_details?.email}`);
        console.log(`   Amount: $${(session.amount_total || 0) / 100}`);
        console.log(`   Payment Status: ${session.payment_status}`);
        console.log(`   Subscription: ${session.subscription}`);

        // Check if user exists in database
        const email = session.customer_details?.email;
        if (email) {
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (user) {
            console.log(`   📊 User in Database:`);
            console.log(`      ID: ${user.id}`);
            console.log(`      Status: ${user.subscription_status}`);
            console.log(`      Type: ${user.subscription_type || 'not set'}`);
            console.log(`      Source: ${user.subscription_source || 'not set'}`);
            console.log(`      Stripe Sub ID: ${user.stripe_subscription_id || 'not set'}`);
            console.log(`      End Date: ${user.subscription_end_date || 'not set'}`);
          } else {
            console.log(`   ❌ User not found in database for email: ${email}`);
            console.log(`   Error:`, error);
          }
        }
      }
    }

    // Step 2: Check Stripe webhook events
    console.log('\n2️⃣ Checking recent Stripe webhook events...');
    const events = await stripe.events.list({
      limit: 10,
      types: ['checkout.session.completed', 'customer.subscription.created']
    });

    console.log(`\nFound ${events.data.length} recent webhook events:`);
    for (const event of events.data) {
      console.log(`\n🎫 Event: ${event.type} (${event.id})`);
      console.log(`   Created: ${new Date(event.created * 1000).toLocaleString()}`);
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Customer: ${session.customer_details?.email || 'unknown'}`);
        console.log(`   Promo Code: ${session.metadata?.promo_code || 'none'}`);
        console.log(`   Amount: $${(session.amount_total || 0) / 100}`);
      } else if (event.type === 'customer.subscription.created') {
        const subscription = event.data.object;
        console.log(`   Subscription ID: ${subscription.id}`);
        console.log(`   Status: ${subscription.status}`);
        console.log(`   Customer: ${subscription.customer}`);
      }
    }

    // Step 3: Manual test of subscription API
    console.log('\n3️⃣ Testing subscription API for recent PAPERCLIP users...');
    
    const { data: recentUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, subscription_status, subscription_type, subscription_source')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (recentUsers) {
      for (const user of recentUsers) {
        if (user.subscription_source === 'PAPERCLIP' || user.email?.includes('test')) {
          console.log(`\n👤 Testing API for ${user.email}:`);
          
          // Test subscription API
          const response = await fetch(`http://localhost:3000/api/user/subscription?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log(`   API Response:`);
            console.log(`     Status: ${data.subscription?.status}`);
            console.log(`     isPremium: ${data.subscription?.isPremium}`);
            console.log(`     isActive: ${data.subscription?.isActive}`);
          } else {
            console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
          }
        }
      }
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Check if Stripe webhook is being called');
    console.log('2. Check webhook logs in Stripe Dashboard');
    console.log('3. Verify webhook endpoint is receiving checkout.session.completed events');
    console.log('4. Apply database migration manually in Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debugging
if (require.main === module) {
  debugCurrentIssue();
}

module.exports = { debugCurrentIssue };