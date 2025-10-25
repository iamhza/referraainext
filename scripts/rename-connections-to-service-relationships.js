/**
 * Migration Script: Rename connections collection to service_relationships
 * 
 * This script renames the MongoDB collection from 'connections' to 'service_relationships'
 * to better represent the Service-Client-Provider relationship concept.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function renameCollection() {
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

    // Check if 'connections' collection exists
    const collections = await db.listCollections({ name: 'connections' }).toArray();
    
    if (collections.length === 0) {
      console.log('⚠️  Collection "connections" does not exist. Nothing to rename.');
      console.log('   (It may have already been renamed to "service_relationships")');
      process.exit(0);
    }

    // Check if 'service_relationships' already exists
    const targetExists = await db.listCollections({ name: 'service_relationships' }).toArray();
    
    if (targetExists.length > 0) {
      console.log('⚠️  Collection "service_relationships" already exists!');
      console.log('   Cannot rename "connections" to "service_relationships".');
      console.log('   Please manually resolve this conflict.');
      process.exit(1);
    }

    // Get document count before rename
    const count = await db.collection('connections').countDocuments();
    console.log(`📊 Found ${count} documents in "connections" collection`);

    // Rename the collection
    console.log('🔄 Renaming collection from "connections" to "service_relationships"...');
    await db.collection('connections').rename('service_relationships');

    // Verify rename was successful
    const verifyCount = await db.collection('service_relationships').countDocuments();
    console.log(`✅ Successfully renamed collection to "service_relationships"`);
    console.log(`📊 Verified: ${verifyCount} documents in new collection`);

    if (count !== verifyCount) {
      console.warn('⚠️  Document count mismatch! Please verify data integrity.');
    }

    console.log('\n✨ Migration complete!');
    console.log('   Collection "connections" → "service_relationships"');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
renameCollection();

