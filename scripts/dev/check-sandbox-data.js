const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkSandboxData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('referradb');
    
    // 1. Check user
    const user = await db.collection('users').findOne({
      email: 'kerriwilltest@atomicmail.io'
    });
    
    console.log('👤 USER:');
    if (user) {
      console.log(`  ✅ Found: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Org ID: ${user.org_id || 'NULL'}`);
      console.log(`  Tour Completed: ${user.tourCompleted || false}`);
    } else {
      console.log('  ❌ User not found');
      return;
    }
    
    console.log('\n🏢 SANDBOX ORG:');
    // 2. Check if sandbox org exists
    const sandboxOrgs = await db.collection('sandbox_organizations').find({ userId: user._id.toString() }).toArray();
    console.log(`  Found ${sandboxOrgs.length} sandbox org(s)`);
    
    if (sandboxOrgs.length > 0) {
      const sandboxOrg = sandboxOrgs[0];
      console.log(`  ✅ Sandbox Org ID: ${sandboxOrg._id}`);
      console.log(`  Organization ID: ${sandboxOrg.organizationId}`);
      console.log(`  Tier: ${sandboxOrg.tier}`);
      console.log(`  Role: ${sandboxOrg.role}`);
      console.log(`  Status: ${sandboxOrg.status}`);
      console.log(`  Expires: ${sandboxOrg.expiresAt}`);
      
      // 3. Check organization
      console.log('\n🏛️  ORGANIZATION:');
      const org = await db.collection('organizations').findOne({ _id: sandboxOrg.organizationId });
      if (org) {
        console.log(`  ✅ Org Name: ${org.name}`);
        console.log(`  Is Sandbox: ${org.isSandbox}`);
      } else {
        console.log('  ❌ Organization not found!');
      }
      
      // 4. Check clients
      console.log('\n👥 CLIENTS:');
      const clientCount = await db.collection('clients').countDocuments({ organizationId: sandboxOrg.organizationId.toString() });
      console.log(`  Found ${clientCount} clients`);
      
      if (clientCount > 0) {
        const sampleClient = await db.collection('clients').findOne({ organizationId: sandboxOrg.organizationId.toString() });
        console.log(`  Sample: ${sampleClient?.firstName} ${sampleClient?.lastName}`);
      }
      
      // 5. Check providers
      console.log('\n🏥 PROVIDERS:');
      const providerCount = await db.collection('providers').countDocuments({});
      console.log(`  Found ${providerCount} total providers`);
      
    } else {
      console.log('  ❌ No sandbox organization found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkSandboxData();

