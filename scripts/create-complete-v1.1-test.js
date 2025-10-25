/**
 * Create Complete v1.1 Test Scenario
 * 
 * Creates:
 * 1. Client (v1.1 nested structure)
 * 2. Service Relationship (linked to services collection)
 * 3. Actions (v1.1 simplified types)
 * 4. Authorization (optional)
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function createCompleteTest() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';
  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    console.log('\n🧪 Creating Complete v1.1 Test Scenario');
    console.log('='.repeat(70));

    // ========================================
    // STEP 1: Get Case Manager
    // ========================================
    console.log('\n📋 Step 1: Finding case manager...');
    const caseManager = await db.collection('users').findOne({ 
      email: 'miknabil@yahoo.com' 
    });

    if (!caseManager) {
      console.log('❌ Case manager not found: miknabil@yahoo.com');
      return;
    }

    const orgMember = await db.collection('org_members').findOne({
      userId: caseManager._id.toString()
    });

    console.log(`✅ Case Manager: ${caseManager.email}`);
    console.log(`   Organization: ${orgMember.organizationId}`);

    // ========================================
    // STEP 2: Get a Provider
    // ========================================
    console.log('\n📋 Step 2: Finding a provider...');
    const provider = await db.collection('providers').findOne({
      organizationId: orgMember.organizationId
    });

    if (!provider) {
      console.log('❌ No providers found for organization');
      return;
    }

    console.log(`✅ Provider: ${provider.name || provider.legalName}`);

    // ========================================
    // STEP 3: Get a Service from services collection
    // ========================================
    console.log('\n📋 Step 3: Getting service from services collection...');
    const service = await db.collection('services').findOne({
      name: { $exists: true }
    });

    if (!service) {
      console.log('❌ No services found');
      return;
    }

    console.log(`✅ Service: ${service.name}`);
    console.log(`   Category: ${service.category}`);
    console.log(`   Service ID: ${service._id}`);

    // ========================================
    // STEP 4: Create v1.1 Client
    // ========================================
    console.log('\n📋 Step 4: Creating v1.1 client...');
    const newClient = {
      organizationId: orgMember.organizationId,
      caseManagerId: caseManager._id.toString(),
      status: 'ACTIVE',
      
      identity: {
        firstName: 'Michael',
        lastName: 'Anderson',
        dob: new Date('1992-07-22'),
        externalId: 'PMI-2025-002',
      },
      
      contact: {
        address: {
          line1: '789 Oak Street',
          city: 'St. Paul',
          state: 'MN',
          zip: '55102',
          county: 'Ramsey',
        },
        phone: '651-555-0234',
        email: 'michael.anderson@example.com',
      },
      
      bands: {
        language: 'English',
        accessibility: [],
      },
      
      clinical: {
        primaryDiagnosis: 'Developmental Disability',
        mentalHealthNeeds: null,
        physicalLimitations: null,
      },
      
      insurance: {
        type: 'medicaid',
        provider: 'Minnesota Medical Assistance',
        number: 'MMA987654321',
      },
      
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const clientResult = await db.collection('clients').insertOne(newClient);
    const clientId = clientResult.insertedId.toString();
    
    console.log(`✅ Created client: ${clientId}`);
    console.log(`   Name: ${newClient.identity.firstName} ${newClient.identity.lastName}`);

    // ========================================
    // STEP 5: Create Service Relationship
    // ========================================
    console.log('\n📋 Step 5: Creating service relationship...');
    const serviceRelationship = {
      organizationId: orgMember.organizationId,
      clientId: clientId,
      providerId: provider._id.toString(),
      
      // Reference to services collection (v1.1 correction)
      serviceId: service._id.toString(),
      serviceName: service.name,
      serviceCategory: service.category,
      
      // Denormalized for performance
      clientName: `${newClient.identity.firstName} ${newClient.identity.lastName}`,
      providerName: provider.name || provider.legalName,
      
      // Status (5-state lifecycle)
      status: 'PENDING_START',
      
      // Case manager
      caseManagerId: caseManager._id.toString(),
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    };

    const srResult = await db.collection('service_relationships').insertOne(serviceRelationship);
    const serviceRelationshipId = srResult.insertedId.toString();
    
    console.log(`✅ Created service relationship: ${serviceRelationshipId}`);
    console.log(`   Client: ${serviceRelationship.clientName}`);
    console.log(`   Provider: ${serviceRelationship.providerName}`);
    console.log(`   Service: ${serviceRelationship.serviceName}`);
    console.log(`   Status: ${serviceRelationship.status}`);

    // ========================================
    // STEP 6: Create Actions (v1.1 simplified)
    // ========================================
    console.log('\n📋 Step 6: Creating v1.1 actions...');
    
    const actions = [
      {
        organizationId: orgMember.organizationId,
        subjectType: 'SERVICE_RELATIONSHIP',
        subjectId: serviceRelationshipId,
        type: 'REQUEST_INTAKE',
        status: 'OPEN',
        priority: 'HIGH',
        requestPayload: {
          notes: 'Please schedule intake appointment for Michael',
          scheduledDate: new Date('2025-01-20T10:00:00Z'),
          location: 'Main office'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        dueAt: new Date('2025-01-15'),
        createdByMemberId: orgMember._id.toString(),
      },
      {
        organizationId: orgMember.organizationId,
        subjectType: 'SERVICE_RELATIONSHIP',
        subjectId: serviceRelationshipId,
        type: 'REQUEST_DOCUMENT',
        status: 'OPEN',
        priority: 'NORMAL',
        requestPayload: {
          notes: 'Need support plan for authorization',
          docType: 'Support Plan'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        dueAt: new Date('2025-01-18'),
        createdByMemberId: orgMember._id.toString(),
      }
    ];

    const actionsResult = await db.collection('actions').insertMany(actions);
    console.log(`✅ Created ${Object.keys(actionsResult.insertedIds).length} actions`);
    console.log(`   1. REQUEST_INTAKE (HIGH priority)`);
    console.log(`   2. REQUEST_DOCUMENT (NORMAL priority)`);

    // ========================================
    // STEP 7: Create Authorization
    // ========================================
    console.log('\n📋 Step 7: Creating authorization...');
    
    const authorization = {
      organizationId: orgMember.organizationId,
      clientId: clientId,
      serviceRelationshipId: serviceRelationshipId,
      
      status: 'DRAFT',
      
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-08-01'),
      units: 20,
      unitType: 'HOURS_PER_WEEK',
      approvalNumber: null,
      
      submittedAt: null,
      submittedBy: null,
      approvalDate: null,
      approvedBy: null,
      
      createdBy: orgMember._id.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const authResult = await db.collection('authorizations').insertOne(authorization);
    console.log(`✅ Created authorization: ${authResult.insertedId}`);
    console.log(`   Status: ${authorization.status}`);
    console.log(`   Units: ${authorization.units} ${authorization.unitType}`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('✅ Complete v1.1 Test Scenario Created!');
    console.log('='.repeat(70));
    console.log('\n📊 Created:');
    console.log(`   ✓ Client: ${clientId}`);
    console.log(`   ✓ Service Relationship: ${serviceRelationshipId}`);
    console.log(`   ✓ Actions: ${Object.keys(actionsResult.insertedIds).length}`);
    console.log(`   ✓ Authorization: ${authResult.insertedId}`);
    
    console.log('\n🔗 References:');
    console.log(`   Service ID: ${service._id} (from services collection)`);
    console.log(`   Provider ID: ${provider._id}`);
    console.log(`   Case Manager: ${caseManager.email}`);
    
    console.log('\n📍 Test This:');
    console.log(`   1. Login as miknabil@yahoo.com`);
    console.log(`   2. Go to case manager dashboard`);
    console.log(`   3. Should see client "Michael Anderson" in table`);
    console.log(`   4. Expand row to see service relationship`);
    console.log(`   5. Click service to see actions in drawer`);
    console.log(`   6. View authorization tab`);
    
    console.log('\n🧹 Cleanup:');
    console.log(`   node scripts/cleanup-test-data.js ${clientId}`);

  } catch (error) {
    console.error('\n❌ Error creating test scenario:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed\n');
  }
}

createCompleteTest();

