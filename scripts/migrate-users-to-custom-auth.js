#!/usr/bin/env node

/**
 * Migrate specific users from Supabase Auth to custom auth system
 * Users: sulemanhs@gmail.com, miknabil@yahoo.com, dannyghost@gmail.com
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create service role client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Users to migrate with their new passwords
const USERS_TO_MIGRATE = [
  {
    email: 'sulemanhs@gmail.com',
    password: 'admin123456',  // You can change this
    role: 'admin',
    org_id: null  // Platform admin = no org restriction
  },
  {
    email: 'miknabil@yahoo.com', 
    password: 'case123456',   // You can change this
    role: 'case_manager',
    org_id: '583037a1-6a33-4713-a550-22c1b2865e4a',  // Default org
    team_id: '71e97b73-3be5-466e-b2ce-244659a91993'   // General team
  },
  {
    email: 'dannyghost@gmail.com',
    password: 'provider123456',  // You can change this  
    role: 'provider',
    org_id: '583037a1-6a33-4713-a550-22c1b2865e4a'  // Default org
  }
];

async function migrateUsers() {
  console.log('🚀 Starting user migration to custom auth...\n');

  for (const userData of USERS_TO_MIGRATE) {
    try {
      console.log(`📝 Migrating ${userData.email}...`);

      // 1. Get existing user data from Supabase
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, full_name, created_at')
        .eq('id', (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === userData.email)?.id)
        .single();

      if (!existingProfile) {
        console.log(`   ⚠️  User ${userData.email} not found in user_profiles, using email as name`);
      }

      // 2. Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // 3. Insert into app_users table
      const { data: newUser, error } = await supabase
        .from('app_users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          full_name: existingProfile?.full_name || userData.email,
          role: userData.role,
          org_id: userData.org_id,
          team_id: userData.team_id,
          migrated_from_supabase_id: existingProfile?.id,
          migration_notes: `Migrated from Supabase Auth on ${new Date().toISOString()}`,
          created_at: existingProfile?.created_at || new Date().toISOString()
        })
        .select('id, email, role')
        .single();

      if (error) {
        console.error(`   ❌ Failed to migrate ${userData.email}:`, error.message);
        continue;
      }

      console.log(`   ✅ Successfully migrated ${userData.email}`);
      console.log(`      • Role: ${newUser.role}`);
      console.log(`      • New ID: ${newUser.id}`);
      console.log(`      • Password: ${userData.password} (save this!)`);

    } catch (error) {
      console.error(`   💥 Error migrating ${userData.email}:`, error.message);
    }

    console.log(''); // Empty line for readability
  }

  // 4. Verify migration
  console.log('🔍 Verifying migration...');
  
  const { data: migratedUsers, error: verifyError } = await supabase
    .from('app_users')
    .select('email, role, org_id, created_at')
    .in('email', USERS_TO_MIGRATE.map(u => u.email));

  if (verifyError) {
    console.error('❌ Failed to verify migration:', verifyError.message);
    return;
  }

  console.log('\n📊 Migration Summary:');
  migratedUsers.forEach(user => {
    console.log(`   • ${user.email} → ${user.role} (org: ${user.org_id || 'ALL'})`);
  });

  console.log('\n🎉 Migration completed successfully!');
  console.log('\n🔑 Login Credentials:');
  USERS_TO_MIGRATE.forEach(user => {
    console.log(`   • ${user.email} / ${user.password}`);
  });

  console.log('\n🚀 Next steps:');
  console.log('   1. Test login with new credentials');
  console.log('   2. Build custom auth API endpoints');
  console.log('   3. Update existing APIs to use custom auth');
}

// Run migration
if (require.main === module) {
  migrateUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsers };
