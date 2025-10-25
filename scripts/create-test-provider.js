/**
 * Create Test Provider
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function createTestProvider() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';
  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    // Get organization ID
    const caseManager = await db.collection('users').findOne({ 
      email: 'miknabil@yahoo.com' 
    });
    
    const orgMember = await db.collection('org_members').findOne({
      userId: caseManager._id.toString()
    });

    console.log('\n🏢 Creating test provider...');
    
    const provider = {
      organizationId: orgMember.organizationId,
      legalName: 'Harmony Care Services',
      name: 'Harmony Care Services',
      type: 'behavioral_health',
      description: 'Providing comprehensive behavioral health and independent living services',
      address: '123 Provider Lane, Minneapolis, MN 55401',
      phone: '612-555-0100',
      email: 'contact@harmonycare.org',
      website: 'https://harmonycare.org',
      services: ['Individualized Home Supports', 'ARMHS', 'Respite Care'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('providers').insertOne(provider);
    
    console.log(`✅ Created provider: ${result.insertedId}`);
    console.log(`   Name: ${provider.name}`);
    console.log(`   Organization: ${provider.organizationId}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

createTestProvider();

