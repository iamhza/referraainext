// Quick script to get provider user IDs from your system
// Run with: node get-provider-ids.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed to list users

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function getProviderIds() {
  console.log('🔍 Fetching provider user IDs...\n');
  
  try {
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all users from auth.users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in your Supabase project');
      return;
    }

    console.log(`📊 Found ${users.length} total users\n`);
    
    // Filter for providers
    const providers = users.filter(user => user.user_metadata?.role === 'provider');
    const caseManagers = users.filter(user => user.user_metadata?.role === 'case_manager');
    const admins = users.filter(user => user.user_metadata?.role === 'admin');
    
    console.log('🏥 **PROVIDERS:**');
    console.log('================');
    if (providers.length === 0) {
      console.log('❌ No providers found');
    } else {
      providers.forEach((provider, index) => {
        console.log(`${index + 1}. ${provider.email}`);
        console.log(`   ID: ${provider.id}`);
        console.log(`   Organization: ${provider.user_metadata?.organization || 'Not set'}`);
        console.log(`   Created: ${new Date(provider.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('👩‍💼 **CASE MANAGERS:**');
    console.log('=====================');
    if (caseManagers.length === 0) {
      console.log('❌ No case managers found');
    } else {
      caseManagers.forEach((cm, index) => {
        console.log(`${index + 1}. ${cm.email}`);
        console.log(`   ID: ${cm.id}`);
        console.log(`   Name: ${cm.user_metadata?.name || 'Not set'}`);
        console.log('');
      });
    }

    console.log('👑 **ADMINS:**');
    console.log('=============');
    if (admins.length === 0) {
      console.log('❌ No admins found');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
        console.log(`   ID: ${admin.id}`);
        console.log('');
      });
    }

    // Generate updated seed script content
    console.log('\n🛠️  **FOR SEED SCRIPT:**');
    console.log('========================');
    if (providers.length > 0 && caseManagers.length > 0) {
      console.log('Update your seed-test-referral.js with these IDs:');
      console.log(`caseManagerId: '${caseManagers[0].id}' // ${caseManagers[0].email}`);
      console.log(`assignedProvider: '${providers[0].id}' // ${providers[0].email}`);
    } else {
      console.log('⚠️  You need to create provider and case manager accounts first!');
      console.log('Visit your app and sign up as different roles.');
    }

  } catch (error) {
    console.error('❌ Error fetching provider IDs:', error);
    console.log('\n💡 Tips:');
    console.log('1. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
    console.log('2. Check your Supabase project permissions');
    console.log('3. Verify your environment variables');
  }
}

// Run if called directly
if (require.main === module) {
  getProviderIds();
} 