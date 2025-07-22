// Quick seed script to create test data for end-to-end referral flow
// Run with: node seed-test-referral.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/referradb';

async function seedTestData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('referradb');
    
    console.log('🔄 Seeding test data for referral flow...');
    
    // 1. Create a test client
    const testClient = {
      firstName: 'John',
      lastName: 'Testclient',
      email: 'john.testclient@example.com',
      phone: '612-555-0123',
      dateOfBirth: '1985-06-15',
      address: {
        street: '123 Test Street',
        city: 'Minneapolis',
        state: 'MN',
        zip: '55401'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      caseManagerId: '77b4f272-b205-413d-b20f-39fad78ca4e8', // zakie.suleman@gmail.com
      source: 'seed_script'
    };
    
    const clientResult = await db.collection('clients').insertOne(testClient);
    console.log('✅ Test client created:', clientResult.insertedId);
    
    // 2. Create a test referral
    const testReferral = {
      clientInfo: {
        _id: clientResult.insertedId.toString(),
        firstName: testClient.firstName,
        lastName: testClient.lastName,
        email: testClient.email,
        phone: testClient.phone,
        dateOfBirth: testClient.dateOfBirth,
        address: testClient.address
      },
      serviceDetails: {
        type: 'Adult rehabilitative mental health services (ARMHS)',
        urgency: 'high',
        additionalNotes: 'Client needs immediate ARMHS services. Previous provider left the field. Client prefers female provider if possible.',
        preferredStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      },
      status: 'provider_selection_required', // Ready for provider response
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      caseManagerId: '77b4f272-b205-413d-b20f-39fad78ca4e8', // zakie.suleman@gmail.com
      caseManager: {
        id: '77b4f272-b205-413d-b20f-39fad78ca4e8',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '612-555-0456'
      },
      assignedProvider: 'eb165509-20d0-436f-aa20-f8e22a0ca127', // admin@truwellmn.com (Truwell)
      assignmentDate: new Date().toISOString(),
      timeline: [
        {
          id: 'timeline-1',
          type: 'referral_created',
          title: 'Referral Created',
          description: 'Referral submitted for Adult rehabilitative mental health services (ARMHS)',
          timestamp: new Date().toISOString(),
          actor: {
            name: 'Sarah Johnson',
            role: 'case_manager'
          }
        },
        {
          id: 'timeline-2',
          type: 'provider_assigned',
          title: 'Provider Assigned',
          description: 'Referral assigned to provider for review',
          timestamp: new Date().toISOString(),
          actor: {
            name: 'Admin',
            role: 'admin'
          }
        }
      ],
      comments: [
        {
          _id: new MongoClient().db().collection().insertOne({}).insertedId,
          authorName: 'Sarah Johnson',
          authorRole: 'case_manager',
          content: 'Client has urgent need for ARMHS services. Please prioritize this referral.',
          category: 'status',
          priority: 'urgent',
          createdAt: new Date().toISOString()
        }
      ]
    };
    
    const referralResult = await db.collection('referrals').insertOne(testReferral);
    console.log('✅ Test referral created:', referralResult.insertedId);
    
    console.log('\n🎉 Test data seeded successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update the caseManagerId and assignedProvider fields with real IDs');
    console.log('2. Login as the provider and navigate to /provider/referrals');
    console.log('3. Click on the test referral to see the details page');
    console.log('4. Test the accept/decline functionality');
    console.log('\n📝 Test Referral ID:', referralResult.insertedId);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    await client.close();
  }
}

// Run the seeding
if (require.main === module) {
  seedTestData();
} 