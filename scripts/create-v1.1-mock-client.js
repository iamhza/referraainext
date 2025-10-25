/**
 * Create Mock Client with v1.1 Data Model
 * 
 * Creates a test client in the new nested structure:
 * - identity, contact, bands, clinical, insurance
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function createMockClient() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';
  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    console.log('\n🧪 Creating v1.1 Mock Client');
    console.log('='.repeat(60));

    // Find case manager
    const caseManager = await db.collection('users').findOne({ 
      email: 'miknabil@yahoo.com' 
    });

    if (!caseManager) {
      console.log('❌ Case manager not found: miknabil@yahoo.com');
      return;
    }

    console.log(`\n✅ Found case manager: ${caseManager.email}`);
    console.log(`   User ID: ${caseManager._id}`);

    // Get org_member record
    const orgMember = await db.collection('org_members').findOne({
      userId: caseManager._id.toString()
    });

    if (!orgMember) {
      console.log('❌ No org_member record found for case manager');
      return;
    }

    console.log(`\n✅ Found org_member record:`);
    console.log(`   Organization ID: ${orgMember.organizationId}`);
    console.log(`   Role: ${orgMember.role}`);

    // Create v1.1 client with nested structure
    const newClient = {
      organizationId: orgMember.organizationId,
      caseManagerId: caseManager._id.toString(),
      status: 'ACTIVE',
      
      // Identity (nested)
      identity: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        dob: new Date('1985-03-15'),
        externalId: 'PMI-2025-001',
      },
      
      // Contact (nested)
      contact: {
        address: {
          line1: '456 Maple Avenue',
          city: 'Minneapolis',
          state: 'MN',
          zip: '55404',
          county: 'Hennepin',
        },
        phone: '612-555-0199',
        email: 'sarah.johnson@example.com',
      },
      
      // Bands (nested)
      bands: {
        language: 'English',
        accessibility: ['Wheelchair Access Required'],
      },
      
      // Clinical (nested)
      clinical: {
        primaryDiagnosis: 'Autism Spectrum Disorder',
        mentalHealthNeeds: 'Anxiety management support',
        physicalLimitations: 'Limited mobility',
      },
      
      // Insurance (nested)
      insurance: {
        type: 'medicaid',
        provider: 'Minnesota Medical Assistance',
        number: 'MMA123456789',
      },
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert client
    const result = await db.collection('clients').insertOne(newClient);
    
    console.log(`\n✅ Created v1.1 client: ${result.insertedId}`);
    console.log('\n📋 Client Details:');
    console.log(`   Name: ${newClient.identity.firstName} ${newClient.identity.lastName}`);
    console.log(`   DOB: ${newClient.identity.dob.toISOString().split('T')[0]}`);
    console.log(`   External ID: ${newClient.identity.externalId}`);
    console.log(`   Address: ${newClient.contact.address.line1}, ${newClient.contact.address.city}, ${newClient.contact.address.state} ${newClient.contact.address.zip}`);
    console.log(`   Phone: ${newClient.contact.phone}`);
    console.log(`   Email: ${newClient.contact.email}`);
    console.log(`   Language: ${newClient.bands.language}`);
    console.log(`   Diagnosis: ${newClient.clinical.primaryDiagnosis}`);
    console.log(`   Insurance: ${newClient.insurance.type} - ${newClient.insurance.provider}`);

    // Verify the client structure
    console.log('\n🧪 Verifying v1.1 Nested Structure...');
    const savedClient = await db.collection('clients').findOne({ _id: result.insertedId });
    
    console.log('\n✅ Verified nested structure:');
    console.log(`   ✓ identity: ${!!savedClient.identity}`);
    console.log(`   ✓ contact: ${!!savedClient.contact}`);
    console.log(`   ✓ bands: ${!!savedClient.bands}`);
    console.log(`   ✓ clinical: ${!!savedClient.clinical}`);
    console.log(`   ✓ insurance: ${!!savedClient.insurance}`);
    
    // Test manual flat conversion
    console.log('\n🧪 Testing Flat Conversion (API format)...');
    const flatClient = {
      _id: savedClient._id.toString(),
      organizationId: savedClient.organizationId,
      caseManagerId: savedClient.caseManagerId,
      status: savedClient.status,
      firstName: savedClient.identity.firstName,
      lastName: savedClient.identity.lastName,
      dateOfBirth: savedClient.identity.dob.toISOString(),
      pmiNumber: savedClient.identity.externalId,
      address: savedClient.contact.address.line1,
      city: savedClient.contact.address.city,
      state: savedClient.contact.address.state,
      zipCode: savedClient.contact.address.zip,
      county: savedClient.contact.address.county,
      phone: savedClient.contact.phone,
      email: savedClient.contact.email,
      primaryLanguage: savedClient.bands.language,
      primaryDiagnosis: savedClient.clinical.primaryDiagnosis,
      insuranceProvider: savedClient.insurance.provider,
      insuranceNumber: savedClient.insurance.number,
    };
    
    console.log('✅ Flat conversion successful:');
    console.log(`   Name: ${flatClient.firstName} ${flatClient.lastName}`);
    console.log(`   Address: ${flatClient.address}`);
    console.log(`   Phone: ${flatClient.phone}`);
    
    console.log('\n✅ Mock client created successfully!');
    console.log(`\n📍 Next Steps:`);
    console.log(`   1. Login as miknabil@yahoo.com`);
    console.log(`   2. Navigate to case manager dashboard`);
    console.log(`   3. Client should appear in the table`);
    console.log(`   4. Click to view client details in drawer`);
    console.log(`\n🎯 Client ID for testing: ${result.insertedId.toString()}`);

  } catch (error) {
    console.error('❌ Error creating mock client:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed\n');
  }
}

createMockClient();

