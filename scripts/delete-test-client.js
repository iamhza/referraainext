/**
 * Delete Test Client
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function deleteTestClient() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';
  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    // Delete the test client we just created
    const clientId = '68f2d5f38438fadf8e5af66d';
    
    console.log(`\n🗑️  Deleting test client: ${clientId}`);
    
    const result = await db.collection('clients').deleteOne({
      _id: new ObjectId(clientId)
    });

    if (result.deletedCount > 0) {
      console.log('✅ Test client deleted successfully');
    } else {
      console.log('⚠️  Client not found (may have already been deleted)');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

deleteTestClient();

