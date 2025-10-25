/**
 * Migration Script: Add status field to service_relationships
 * 
 * This script adds the new 5-state lifecycle status to existing service_relationships.
 * Default status: ACTIVE (for existing activated relationships)
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addStatusField() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';

  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    // Count total service relationships
    const total = await db.collection('service_relationships').countDocuments();
    console.log(`📊 Found ${total} service relationships`);

    if (total === 0) {
      console.log('✅ No service relationships to migrate');
      return;
    }

    // Add status field to all existing service relationships
    // Logic:
    // - If isActivated = true → ACTIVE
    // - If isActivated = false → REFERRAL_SENT
    console.log('🔄 Adding status field to service relationships...');

    const result = await db.collection('service_relationships').updateMany(
      { status: { $exists: false } },
      [
        {
          $set: {
            status: {
              $cond: {
                if: { $eq: ['$isActivated', true] },
                then: 'ACTIVE',
                else: 'REFERRAL_SENT'
              }
            },
            updatedAt: new Date().toISOString()
          }
        }
      ]
    );

    console.log(`✅ Updated ${result.modifiedCount} service relationships`);
    console.log('   - Activated relationships → ACTIVE');
    console.log('   - Non-activated relationships → REFERRAL_SENT');

    // Verify results
    const activeCount = await db.collection('service_relationships').countDocuments({ status: 'ACTIVE' });
    const referralCount = await db.collection('service_relationships').countDocuments({ status: 'REFERRAL_SENT' });

    console.log('\n📊 Status Distribution:');
    console.log(`   ACTIVE: ${activeCount}`);
    console.log(`   REFERRAL_SENT: ${referralCount}`);

    console.log('\n✨ Migration complete!');
    console.log('   Service relationships now have status field');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
addStatusField();

