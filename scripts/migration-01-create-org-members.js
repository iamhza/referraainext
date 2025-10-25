/**
 * Migration 01: Create org_members Junction Table
 * 
 * Creates org_members collection from existing users,
 * establishing the many-to-many relationship between users and organizations.
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';
  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    console.log('\n📋 Migration 01: Create org_members junction table');
    console.log('='.repeat(60));

    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n✅ Found ${users.length} users to migrate`);

    // Create org_members from users
    const orgMembers = [];
    
    for (const user of users) {
      const organizationId = user.organizationId || user.org_id;
      
      if (!organizationId) {
        console.log(`⚠️  Skipping user ${user.email} - no organization ID`);
        continue;
      }

      // Map old roles to new roles
      const roleMap = {
        'admin': 'ORG_ADMIN',
        'platform_admin': 'ORG_ADMIN',
        'case_manager': 'CASE_MANAGER',
        'supervisor': 'SUPERVISOR',
        'provider': 'PROVIDER_USER',
      };

      const newRole = roleMap[user.role] || 'CASE_MANAGER';

      const orgMember = {
        organizationId: organizationId.toString(),
        userId: user._id.toString(),
        role: newRole,
        teamId: user.team_id || null,
        providerId: user.role === 'provider' ? user._id.toString() : null,
        isActive: user.is_active !== false,
        createdAt: user.created_at || new Date(),
        updatedAt: user.updated_at || new Date(),
      };

      orgMembers.push(orgMember);
    }

    // Insert org_members
    if (orgMembers.length > 0) {
      const result = await db.collection('org_members').insertMany(orgMembers);
      console.log(`✅ Created ${Object.keys(result.insertedIds).length} org_member records`);
    }

    // Create indexes
    await db.collection('org_members').createIndex({ organizationId: 1, userId: 1 }, { unique: true });
    await db.collection('org_members').createIndex({ userId: 1 });
    await db.collection('org_members').createIndex({ organizationId: 1, role: 1 });
    console.log('✅ Created indexes on org_members');

    // Clean up users collection (remove org/role fields)
    const cleanupResult = await db.collection('users').updateMany({}, {
      $unset: {
        role: '',
        organizationId: '',
        org_id: '',
        team_id: '',
        is_active: '',
        migrated_from_supabase: '',
        supabase_user_id: '',
        migration_date: '',
        temp_password: '',
        tempPassword: '',
        password: '',
        full_name: '',
        permissions: '',
      },
      $set: {
        updatedAt: new Date(),
      }
    });
    console.log(`✅ Cleaned up ${cleanupResult.modifiedCount} user records`);

    console.log('\n✨ Migration 01 complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

run();

