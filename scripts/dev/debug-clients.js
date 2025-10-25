const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugClients() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('referradb');
    
    // 1. Find user
    const user = await db.collection('users').findOne({
      email: 'kerriwilltest@atomicmail.io'
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 USER:');
    console.log(`  Email: ${user.email}`);
    console.log(`  User ID: ${user._id}`);
    console.log(`  Org ID: ${user.org_id}`);
    console.log(`  Org ID type: ${typeof user.org_id}`);
    
    // 2. Find sandbox org
    const sandboxOrg = await db.collection('sandbox_organizations').findOne({
      userId: user._id
    });
    
    console.log('\n🏢 SANDBOX ORG:');
    if (sandboxOrg) {
      console.log(`  Sandbox Org ID: ${sandboxOrg._id}`);
      console.log(`  Organization ID: ${sandboxOrg.organizationId}`);
      console.log(`  Organization ID type: ${typeof sandboxOrg.organizationId}`);
    } else {
      console.log('  ❌ No sandbox org found');
      return;
    }
    
    // 3. Check clients with different query approaches
    console.log('\n👥 CLIENTS:');
    
    // Try 1: Exact match as string
    const clients1 = await db.collection('clients').find({
      organizationId: user.org_id
    }).toArray();
    console.log(`  Query 1 (string match): ${clients1.length} clients found`);
    
    // Try 2: ObjectId match
    try {
      const clients2 = await db.collection('clients').find({
        organizationId: new ObjectId(user.org_id)
      }).toArray();
      console.log(`  Query 2 (ObjectId match): ${clients2.length} clients found`);
    } catch (e) {
      console.log(`  Query 2 (ObjectId match): Error - ${e.message}`);
    }
    
    // Try 3: Check what organizationId actually looks like in clients
    const sampleClient = await db.collection('clients').findOne({});
    if (sampleClient) {
      console.log(`\n📝 SAMPLE CLIENT:`);
      console.log(`  Client ID: ${sampleClient._id}`);
      console.log(`  Organization ID: ${sampleClient.organizationId}`);
      console.log(`  Organization ID type: ${typeof sampleClient.organizationId}`);
      console.log(`  Is ObjectId?: ${sampleClient.organizationId instanceof ObjectId}`);
    }
    
    // Try 4: Count all clients with any org id
    const allClientsCount = await db.collection('clients').countDocuments({});
    console.log(`\n  Total clients in DB: ${allClientsCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugClients();

