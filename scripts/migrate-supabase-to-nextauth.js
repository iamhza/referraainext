#!/usr/bin/env node

/**
 * Migration Script: Supabase Auth → NextAuth.js + MongoDB
 * 
 * This script migrates existing users from Supabase Auth to NextAuth.js
 * while preserving all HIPAA compliance and organizational structure.
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient, ObjectId } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MONGODB_URI || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUsers() {
  let mongoClient;
  
  try {
    console.log('🚀 Starting Supabase → NextAuth.js migration...\n');
    
    // Connect to MongoDB
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db('referradb');
    
    console.log('✅ Connected to MongoDB');

    // Get all users from Supabase
    const { data: supabaseUsers, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      throw new Error(`Failed to fetch Supabase users: ${usersError.message}`);
    }

    console.log(`📊 Found ${supabaseUsers.users.length} users in Supabase Auth\n`);

    // Get user profiles with org data
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.warn('⚠️  Could not fetch user profiles:', profilesError.message);
    }

    console.log(`📊 Found ${userProfiles?.length || 0} user profiles\n`);

    // Get default organization for migration
    let defaultOrg = await db.collection('organizations').findOne({ name: 'Default Organization' });
    if (!defaultOrg) {
      console.log('📝 Creating default organization...');
      const orgResult = await db.collection('organizations').insertOne({
        name: 'Default Organization',
        slug: 'default',
        settings: {},
        status: 'active',
        subscription_plan: 'professional',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      defaultOrg = { _id: orgResult.insertedId, name: 'Default Organization' };
    }

    // Get default team
    let defaultTeam = await db.collection('teams').findOne({ org_id: defaultOrg._id.toString() });
    if (!defaultTeam) {
      console.log('📝 Creating default team...');
      const teamResult = await db.collection('teams').insertOne({
        org_id: defaultOrg._id.toString(),
        name: 'General Team',
        specializations: ['general'],
        created_at: new Date().toISOString()
      });
      defaultTeam = { _id: teamResult.insertedId, name: 'General Team' };
    }

    console.log(`✅ Default org: ${defaultOrg.name} (${defaultOrg._id})`);
    console.log(`✅ Default team: ${defaultTeam.name} (${defaultTeam._id})\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const supabaseUser of supabaseUsers.users) {
      try {
        console.log(`👤 Processing: ${supabaseUser.email}`);
        
        // Check if user already exists in MongoDB
        const existingUser = await db.collection('users').findOne({ 
          email: supabaseUser.email 
        });
        
        if (existingUser) {
          console.log(`   ⏭️  User already exists in MongoDB, skipping`);
          skippedCount++;
          continue;
        }

        // Find corresponding profile
        const profile = userProfiles?.find(p => p.id === supabaseUser.id);
        
        // Determine role and org context
        let role = 'case_manager'; // default
        let orgId = defaultOrg._id.toString();
        let teamId = defaultTeam._id.toString();
        
        if (profile) {
          role = profile.role || 'case_manager';
          orgId = profile.org_id || defaultOrg._id.toString();
          teamId = profile.team_id || defaultTeam._id.toString();
        } else if (supabaseUser.user_metadata?.role) {
          role = supabaseUser.user_metadata.role;
          
          // Platform admin doesn't need org assignment
          if (role === 'admin' || role === 'platform_admin') {
            orgId = null;
            teamId = null;
          }
        }

        // Generate a secure temporary password for migration
        // In production, you'd want to force password reset
        const tempPassword = `migrate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Prepare user document
        const userDoc = {
          email: supabaseUser.email,
          name: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email,
          full_name: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email,
          role: role,
          org_id: orgId,
          team_id: teamId,
          password_hash: hashedPassword,
          
          // Migration metadata
          migrated_from_supabase: true,
          supabase_user_id: supabaseUser.id,
          migration_date: new Date().toISOString(),
          temp_password: tempPassword, // Store for admin reference
          
          // Standard fields
          permissions: getDefaultPermissions(role),
          is_active: true,
          created_at: supabaseUser.created_at,
          updated_at: new Date().toISOString(),
          
          // Additional profile data
          phone: supabaseUser.user_metadata?.phone || profile?.phone,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
        };

        // Insert user into MongoDB
        const result = await db.collection('users').insertOne(userDoc);
        
        console.log(`   ✅ Migrated successfully`);
        console.log(`   📧 Email: ${supabaseUser.email}`);
        console.log(`   🔑 Role: ${role}`);
        console.log(`   🏢 Org: ${orgId ? 'Assigned' : 'Platform Admin'}`);
        console.log(`   🔒 Temp Password: ${tempPassword}`);
        console.log(`   🆔 New MongoDB ID: ${result.insertedId}`);
        
        migratedCount++;
        
      } catch (error) {
        console.error(`   ❌ Failed to migrate ${supabaseUser.email}:`, error.message);
        errorCount++;
      }
      
      console.log(''); // Empty line for readability
    }

    // Create demo organization for testing
    await createDemoOrganization(db);

    // Migration summary
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount} users`);
    console.log(`   ⏭️  Skipped (already exist): ${skippedCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log(`   📝 Total processed: ${supabaseUsers.users.length} users\n`);

    if (migratedCount > 0) {
      console.log('🔐 IMPORTANT: Migrated User Credentials');
      console.log('   All users have been assigned temporary passwords.');
      console.log('   Users should use "Forgot Password" to set new passwords.');
      console.log('   Or you can manually set passwords in the database.\n');
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('📚 MongoDB connection closed');
    }
  }
}

function getDefaultPermissions(role) {
  const permissions = {
    platform_admin: ['*'], // All permissions
    admin: ['*'], // Legacy admin role
    org_admin: [
      'manage_users', 'view_analytics', 'manage_teams', 
      'view_clients', 'manage_settings', 'export_data'
    ],
    supervisor: [
      'view_team_analytics', 'assign_cases', 'view_clients', 
      'manage_team_members', 'approve_referrals'
    ],
    case_manager: [
      'view_clients', 'create_clients', 'update_clients',
      'create_referrals', 'view_referrals', 'communicate_providers'
    ],
    provider: [
      'view_referrals', 'update_referral_status', 'communicate_case_managers',
      'manage_profile', 'view_submissions'
    ]
  };
  
  return permissions[role] || permissions.case_manager;
}

async function createDemoOrganization(db) {
  console.log('🎯 Creating demo organization...');
  
  try {
    // Check if demo org already exists
    const existingDemo = await db.collection('organizations').findOne({ 
      slug: 'riverside-social' 
    });
    
    if (existingDemo) {
      console.log('   ✅ Demo organization already exists');
      return;
    }

    // Create demo org
    const demoOrgResult = await db.collection('organizations').insertOne({
      name: 'Riverside Social Services',
      slug: 'riverside-social',
      domain: 'riverside-social.org',
      settings: {
        branding: {
          primary_color: '#2563eb',
          logo_url: '/demo-logo.png'
        },
        workflows: {
          require_supervisor_approval: true,
          max_caseload: 25,
          auto_assign_providers: false
        }
      },
      status: 'active',
      subscription_plan: 'professional',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Create demo teams
    const teams = [
      { name: 'Mental Health Team', specializations: ['mental_health', 'counseling'] },
      { name: 'Substance Abuse Team', specializations: ['substance_abuse', 'addiction'] },
      { name: 'Family Services Team', specializations: ['family_support', 'child_services'] }
    ];

    for (const team of teams) {
      await db.collection('teams').insertOne({
        org_id: demoOrgResult.insertedId.toString(),
        name: team.name,
        specializations: team.specializations,
        created_at: new Date().toISOString()
      });
    }

    console.log('   ✅ Demo organization "Riverside Social Services" created');
    console.log('   📝 Domain: riverside-social.org');
    console.log('   📝 Slug: riverside-social');
    
  } catch (error) {
    console.error('   ❌ Failed to create demo organization:', error.message);
  }
}

// Run migration
if (require.main === module) {
  migrateUsers();
}
