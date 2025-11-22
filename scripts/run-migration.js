const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Reading migration file...');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_add_partial_payment_support.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration...\n');
  console.log('Migration SQL:');
  console.log('-----------------------------------');
  console.log(migrationSQL);
  console.log('-----------------------------------\n');

  // Split the SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`[${i + 1}/${statements.length}] Executing statement...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        console.error('\nNote: Some errors might be expected (e.g., "already exists" errors)');
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`Exception executing statement ${i + 1}:`, err.message);
    }
  }

  console.log('\n-----------------------------------');
  console.log('Migration process completed!');
  console.log('-----------------------------------');
  console.log('\nIMPORTANT: Please verify the migration by going to:');
  console.log(`${supabaseUrl}/project/default/editor`);
  console.log('\nAnd checking that:');
  console.log('1. donors table has total_amount and paid_amount columns');
  console.log('2. payment_status accepts "partial" value');
  console.log('3. The trigger update_seva_booked_slots() has been updated');
}

runMigration().catch(console.error);
