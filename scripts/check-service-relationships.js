const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkServiceRelationships() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Check service_relationships collection
    const serviceRelationships = await db.collection('service_relationships').find().limit(10).toArray();
    console.log(`\n📊 Service Relationships: ${serviceRelationships.length} found`);
    
    if (serviceRelationships.length > 0) {
      console.log('\nFirst service relationship:');
      console.log(JSON.stringify(serviceRelationships[0], null, 2));
    } else {
      console.log('\n⚠️  No service relationships found!');
      console.log('This is why the expand button shows nothing.');
    }

    // Check clients
    const clients = await db.collection('clients').find().limit(5).toArray();
    console.log(`\n👥 Clients: ${clients.length} found`);
    
    if (clients.length > 0) {
      console.log('\nFirst client:');
      console.log(`ID: ${clients[0]._id}`);
      console.log(`Name: ${clients[0].firstName} ${clients[0].lastName}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkServiceRelationships();

