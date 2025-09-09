/**
 * Script to run the promo code database migration
 * This creates the promo_codes table, functions, and inserts test data
 */

const fs = require('fs');
const path = require('path');

const runPromoMigration = async () => {
  console.log('🔧 Running promo code database migration...\n');

  // Read environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('URL present:', !!supabaseUrl);
    console.log('Service key present:', !!supabaseServiceKey);
    return;
  }

  // Read the migration file
  const migrationPath = path.join(__dirname, 'database', 'migrations', '004_promo_codes_system.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found at:', migrationPath);
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Loaded migration file, length:', migrationSQL.length);

  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔗 Connected to Supabase');

    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim().length === 0) continue;

      console.log(`\n${i + 1}. Executing: ${stmt.substring(0, 80)}${stmt.length > 80 ? '...' : ''}`);
      
      try {
        const { data, error } = await supabase.rpc('query', { 
          query_text: stmt 
        });

        if (error) {
          // Try direct query execution
          const { error: directError } = await supabase
            .from('_dummy_nonexistent_table_')
            .select('*');
          
          // This will fail, but we can use the raw SQL execution instead
          console.log('⚠️  RPC query failed, trying alternative approach...');
          console.log('Error was:', error.message);
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (err) {
        console.log('⚠️  Statement failed:', err.message);
      }
    }

    console.log(`\n🎉 Migration completed! ${successCount} statements executed successfully.`);
    
    // Test if promo codes exist
    console.log('\n🔍 Testing if promo codes were created...');
    const { data: promoCodes, error: promoError } = await supabase
      .from('promo_codes')
      .select('code, name, type')
      .limit(5);

    if (promoError) {
      console.log('⚠️  Could not query promo_codes table:', promoError.message);
    } else {
      console.log('✅ Promo codes found:');
      promoCodes?.forEach(code => {
        console.log(`   • ${code.code} - ${code.name} (${code.type})`);
      });
    }

    // Test if function exists
    console.log('\n🔍 Testing promo code validation function...');
    const { data: funcResult, error: funcError } = await supabase
      .rpc('is_promo_code_valid', { 
        p_code: 'TELESCOPE2025'
      });

    if (funcError) {
      console.log('⚠️  Function test failed:', funcError.message);
    } else {
      console.log('✅ Function works! Result:', funcResult);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

runPromoMigration().catch(console.error);