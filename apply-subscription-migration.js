/**
 * Apply Enhanced Subscription Tracking Migration
 * This script applies the database migration and updates existing subscription records
 */

require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Applying Enhanced Subscription Tracking Migration');
    console.log('==================================================');

    // Step 1: Add new columns
    console.log('\n1️⃣ Adding new subscription tracking columns...');
    
    const addColumnsQueries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_source TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_price_id TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_amount_cents INTEGER DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_currency TEXT DEFAULT 'usd'`
    ];

    for (const query of addColumnsQueries) {
      const { error } = await supabase.rpc('execute_sql', { query });
      if (error) {
        console.error(`❌ Error executing: ${query}`, error);
      } else {
        console.log(`✅ Executed: ${query.substring(0, 50)}...`);
      }
    }

    // Step 2: Create indexes
    console.log('\n2️⃣ Creating indexes...');
    
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type)`,
      `CREATE INDEX IF NOT EXISTS idx_users_subscription_source ON users(subscription_source)`,
      `CREATE INDEX IF NOT EXISTS idx_users_stripe_price_id ON users(stripe_price_id)`
    ];

    for (const query of indexQueries) {
      const { error } = await supabase.rpc('execute_sql', { query });
      if (error) {
        console.error(`❌ Error creating index: ${query}`, error);
      } else {
        console.log(`✅ Created index: ${query.substring(0, 50)}...`);
      }
    }

    // Step 3: Create subscription_events table
    console.log('\n3️⃣ Creating subscription_events table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS subscription_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `;

    const { error: tableError } = await supabase.rpc('execute_sql', { query: createTableQuery });
    if (tableError) {
      console.error('❌ Error creating subscription_events table:', tableError);
    } else {
      console.log('✅ Created subscription_events table');
    }

    // Step 4: Update existing users
    console.log('\n4️⃣ Updating existing user subscription types...');
    
    const updateQuery = `
      UPDATE users 
      SET 
        subscription_type = CASE 
          WHEN subscription_status = 'premium' THEN 'paid'
          ELSE 'free'
        END,
        subscription_source = CASE
          WHEN subscription_status = 'premium' THEN 'payment'
          ELSE NULL
        END
      WHERE subscription_type IS NULL OR subscription_type = 'free'
    `;

    const { error: updateError } = await supabase.rpc('execute_sql', { query: updateQuery });
    if (updateError) {
      console.error('❌ Error updating existing users:', updateError);
    } else {
      console.log('✅ Updated existing user subscription types');
    }

    // Step 5: Check current state
    console.log('\n5️⃣ Checking current subscription status...');
    
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, subscription_status, subscription_type, subscription_source, stripe_subscription_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
    } else {
      console.log('\n📋 Recent users with subscription info:');
      users.forEach(user => {
        console.log(`  👤 ${user.email}:`);
        console.log(`     Status: ${user.subscription_status}`);
        console.log(`     Type: ${user.subscription_type}`);
        console.log(`     Source: ${user.subscription_source || 'none'}`);
        console.log(`     Stripe Sub: ${user.stripe_subscription_id || 'none'}`);
        console.log('');
      });
    }

    // Step 6: Try to update existing PAPERCLIP subscriptions
    console.log('\n6️⃣ Looking for existing PAPERCLIP subscriptions to update...');
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Get recent checkout sessions with PAPERCLIP
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      expand: ['data.subscription', 'data.customer']
    });

    for (const session of sessions.data) {
      if (session.metadata?.promo_code === 'PAPERCLIP' && session.subscription) {
        const customerEmail = session.customer_details?.email;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        
        console.log(`🎟️ Found PAPERCLIP session for ${customerEmail}, updating...`);
        
        // Update the user record with proper promo info
        const { error: promoUpdateError } = await supabase
          .from('users')
          .update({
            subscription_type: 'promo',
            subscription_source: 'PAPERCLIP',
            subscription_status: 'premium'
          })
          .eq('email', customerEmail);

        if (promoUpdateError) {
          console.error(`❌ Error updating ${customerEmail}:`, promoUpdateError);
        } else {
          console.log(`✅ Updated ${customerEmail} to promo subscription`);
        }
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy the enhanced webhook');
    console.log('2. Test PAPERCLIP again');
    console.log('3. Check subscription status in header');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Alternative method if execute_sql RPC doesn't exist
async function applyMigrationDirect() {
  console.log('\n⚠️ If the migration above failed, you can run this SQL directly in Supabase:');
  console.log('\n-- Copy this SQL and run it in Supabase SQL Editor:');
  console.log(`
-- Enhanced Subscription Tracking Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_amount_cents INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_currency TEXT DEFAULT 'usd';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_source ON users(subscription_source);
CREATE INDEX IF NOT EXISTS idx_users_stripe_price_id ON users(stripe_price_id);

-- Create subscription_events table
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update existing users
UPDATE users 
SET 
  subscription_type = CASE 
    WHEN subscription_status = 'premium' THEN 'paid'
    ELSE 'free'
  END,
  subscription_source = CASE
    WHEN subscription_status = 'premium' THEN 'payment'
    ELSE NULL
  END
WHERE subscription_type IS NULL OR subscription_type = 'free';
  `);
}

// Run the migration
if (require.main === module) {
  applyMigration()
    .then(() => applyMigrationDirect())
    .catch(console.error);
}

module.exports = { applyMigration };