#!/usr/bin/env node

/**
 * Add orgId field to all MongoDB collections for multi-tenant support
 * This handles the PHI data that lives in MongoDB
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Check for environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable not found');
  console.log('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'referradb';

async function addOrgIdToCollections() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Collections that need orgId
    const collections = [
      'clients',      // Client PHI data
      'referrals',    // Referral data with client info
      'submissions',  // Provider submissions
      'comments',     // Messaging/communications
      'connections'   // Provider-client connections
    ];

    for (const collectionName of collections) {
      console.log(`\n📋 Processing ${collectionName} collection...`);
      
      const collection = db.collection(collectionName);
      
      // Check if collection exists
      const exists = await collection.countDocuments({});
      if (exists === 0) {
        console.log(`   ⚠️  Collection ${collectionName} is empty or doesn't exist`);
        continue;
      }

      // Add orgId field to documents that don't have it
      const result = await collection.updateMany(
        { orgId: { $exists: false } },
        { 
          $set: { 
            orgId: null,  // Will be set when users are assigned to organizations
            needsOrgAssignment: true,
            updatedAt: new Date()
          }
        }
      );

      console.log(`   ✅ Updated ${result.modifiedCount} documents in ${collectionName}`);

      // Create index for performance
      try {
        await collection.createIndex({ orgId: 1 });
        console.log(`   📇 Created orgId index for ${collectionName}`);
      } catch (indexError) {
        console.log(`   ⚠️  Index may already exist for ${collectionName}`);
      }

      // Create compound indexes for common queries
      if (collectionName === 'clients') {
        await collection.createIndex({ orgId: 1, caseManagerId: 1 });
        await collection.createIndex({ orgId: 1, status: 1 });
        console.log(`   📇 Created compound indexes for ${collectionName}`);
      }

      if (collectionName === 'referrals') {
        await collection.createIndex({ orgId: 1, caseManagerId: 1 });
        await collection.createIndex({ orgId: 1, status: 1 });
        console.log(`   📇 Created compound indexes for ${collectionName}`);
      }
    }

    console.log('\n🎉 Successfully added orgId fields to all MongoDB collections!');

  } catch (error) {
    console.error('❌ Error updating MongoDB:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function createDataIsolationHelpers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // Create a helper collection for org management
    const orgHelpers = db.collection('organization_helpers');
    
    await orgHelpers.createIndex({ type: 1, orgId: 1 });
    
    // Insert helper document for data migration tracking
    await orgHelpers.updateOne(
      { type: 'migration_status' },
      { 
        $set: { 
          type: 'migration_status',
          orgIdAdded: true,
          lastUpdated: new Date(),
          collectionsUpdated: ['clients', 'referrals', 'submissions', 'comments', 'connections']
        }
      },
      { upsert: true }
    );

    console.log('✅ Created organization helpers collection');

  } catch (error) {
    console.error('❌ Error creating helpers:', error);
  } finally {
    await client.close();
  }
}

// Run the migration
if (require.main === module) {
  addOrgIdToCollections()
    .then(() => createDataIsolationHelpers())
    .then(() => {
      console.log('\n🚀 MongoDB multi-tenant setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addOrgIdToCollections, createDataIsolationHelpers };
