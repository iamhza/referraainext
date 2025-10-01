#!/usr/bin/env node

/**
 * Migration script to move existing users and data to organizations
 * This sets up the multi-tenant structure for existing data
 */

const { MongoClient } = require('mongodb');
const { createServerClient } = require('@supabase/ssr');
require('dotenv').config({ path: '.env.local' });

// Check for environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable not found');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'referradb';

// Create Supabase client
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    cookies: {
      get() { return undefined; },
    },
  }
);

async function migrateToOrganizations() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🚀 Connected to MongoDB and Supabase');
    
    const db = client.db(DB_NAME);

    // Step 1: Create default organization if none exist
    console.log('\n📋 Step 1: Setting up default organization...');
    
    const { data: existingOrgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    let defaultOrgId;
    
    if (orgError || !existingOrgs || existingOrgs.length === 0) {
      // Create default organization
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: 'Default Organization',
          slug: 'default-org',
          status: 'active',
          subscription_plan: 'professional',
          settings: {
            migration: true,
            created_from_existing_data: true
          }
        })
        .select('id')
        .single();

      if (createError) {
        throw new Error(`Failed to create default organization: ${createError.message}`);
      }

      defaultOrgId = newOrg.id;
      console.log(`   ✅ Created default organization: ${defaultOrgId}`);
    } else {
      defaultOrgId = existingOrgs[0].id;
      console.log(`   ✅ Using existing organization: ${defaultOrgId}`);
    }

    // Step 2: Create default team
    console.log('\n🏢 Step 2: Setting up default team...');
    
    const { data: existingTeams } = await supabase
      .from('teams')
      .select('id')
      .eq('org_id', defaultOrgId)
      .limit(1);

    let defaultTeamId;
    
    if (!existingTeams || existingTeams.length === 0) {
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          org_id: defaultOrgId,
          name: 'General Team',
          description: 'Default team for migrated users'
        })
        .select('id')
        .single();

      if (teamError) {
        throw new Error(`Failed to create default team: ${teamError.message}`);
      }

      defaultTeamId = newTeam.id;
      console.log(`   ✅ Created default team: ${defaultTeamId}`);
    } else {
      defaultTeamId = existingTeams[0].id;
      console.log(`   ✅ Using existing team: ${defaultTeamId}`);
    }

    // Step 3: Migrate user profiles
    console.log('\n👥 Step 3: Migrating user profiles...');
    
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .is('org_id', null);

    if (profilesError) {
      throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
    }

    if (userProfiles && userProfiles.length > 0) {
      // Update profiles to belong to default organization
      const updates = userProfiles.map(profile => ({
        id: profile.id,
        org_id: defaultOrgId,
        team_id: profile.role === 'case_manager' ? defaultTeamId : null
      }));

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            org_id: update.org_id,
            team_id: update.team_id
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`   ⚠️  Failed to update profile ${update.id}:`, updateError.message);
        }
      }

      console.log(`   ✅ Updated ${userProfiles.length} user profiles`);
    } else {
      console.log(`   ℹ️  No user profiles need migration`);
    }

    // Step 4: Migrate MongoDB data
    console.log('\n📊 Step 4: Migrating MongoDB collections...');
    
    const collections = ['clients', 'referrals'];
    
    for (const collectionName of collections) {
      console.log(`\n   📋 Processing ${collectionName}...`);
      
      const collection = db.collection(collectionName);
      
      // Find documents that need organization assignment
      const docsToUpdate = await collection.find({
        $or: [
          { orgId: { $exists: false } },
          { orgId: null },
          { needsOrgAssignment: true }
        ]
      }).toArray();

      if (docsToUpdate.length > 0) {
        console.log(`   📝 Found ${docsToUpdate.length} documents to update`);
        
        const bulkOps = docsToUpdate.map(doc => ({
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: {
                orgId: defaultOrgId,
                migratedAt: new Date(),
                updatedAt: new Date()
              },
              $unset: {
                needsOrgAssignment: ""
              }
            }
          }
        }));

        const result = await collection.bulkWrite(bulkOps);
        console.log(`   ✅ Updated ${result.modifiedCount} documents in ${collectionName}`);
      } else {
        console.log(`   ℹ️  No documents need migration in ${collectionName}`);
      }
    }

    // Step 5: Create migration audit log
    console.log('\n📝 Step 5: Creating audit log...');
    
    const { error: auditError } = await supabase
      .from('organization_audit_logs')
      .insert({
        org_id: defaultOrgId,
        user_id: null,
        action: 'data_migration',
        entity_type: 'organization',
        entity_id: defaultOrgId,
        metadata: {
          migration_type: 'initial_setup',
          collections_migrated: collections,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.warn(`   ⚠️  Failed to create audit log: ${auditError.message}`);
    } else {
      console.log(`   ✅ Created migration audit log`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   • Organization ID: ${defaultOrgId}`);
    console.log(`   • Team ID: ${defaultTeamId}`);
    console.log(`   • User profiles migrated: ${userProfiles?.length || 0}`);
    
    // Get final counts
    const clientCount = await db.collection('clients').countDocuments({ orgId: defaultOrgId });
    const referralCount = await db.collection('referrals').countDocuments({ orgId: defaultOrgId });
    
    console.log(`   • Clients assigned: ${clientCount}`);
    console.log(`   • Referrals assigned: ${referralCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the migration
if (require.main === module) {
  migrateToOrganizations()
    .then(() => {
      console.log('\n🚀 Multi-tenant migration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToOrganizations };
