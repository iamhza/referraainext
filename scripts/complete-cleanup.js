/**
 * Complete Database Cleanup
 * 
 * Removes ALL mock data from the database:
 * - All clients
 * - All service relationships
 * - All actions
 * - All providers
 * - All referrals
 * 
 * WARNING: This is destructive! Only run in development.
 * 
 * Run: node scripts/complete-cleanup.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
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

    console.log('\n⚠️  WARNING: This will delete ALL mock data!');
    console.log('   - All clients');
    console.log('   - All service relationships');
    console.log('   - All actions');
    console.log('   - All providers');
    console.log('   - All referrals');
    console.log('\n🧹 Starting cleanup...\n');

    // Delete all service relationships
    const srResult = await db.collection('service_relationships').deleteMany({});
    console.log(`✅ Deleted ${srResult.deletedCount} service relationships`);

    // Delete all actions
    const actionsResult = await db.collection('actions').deleteMany({});
    console.log(`✅ Deleted ${actionsResult.deletedCount} actions`);

    // Delete all clients
    const clientsResult = await db.collection('clients').deleteMany({});
    console.log(`✅ Deleted ${clientsResult.deletedCount} clients`);

    // Delete all providers
    const providersResult = await db.collection('providers').deleteMany({});
    console.log(`✅ Deleted ${providersResult.deletedCount} providers`);

    // Delete all referrals
    const referralsResult = await db.collection('referrals').deleteMany({});
    console.log(`✅ Deleted ${referralsResult.deletedCount} referrals`);

    // Delete connections (legacy)
    const connectionsResult = await db.collection('connections').deleteMany({});
    console.log(`✅ Deleted ${connectionsResult.deletedCount} connections (legacy)`);

    // Delete pending_connections
    const pendingResult = await db.collection('pending_connections').deleteMany({});
    console.log(`✅ Deleted ${pendingResult.deletedCount} pending connections`);

    console.log('\n✨ Complete cleanup finished!');
    console.log('   Database is now clean and ready for fresh seed data.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
run();

