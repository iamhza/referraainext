const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

/**
 * Seed Test Data for Service Relationships
 * 
 * Adds:
 * - Authorizations (various statuses, expiration dates)
 * - Actions (open/completed)
 * - Documents (various types)
 * 
 * For case manager: miknabil@yahoo.com
 * Organization: TruWell Minnesota
 */

async function seedTestData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('referradb');
    
    // Get case manager and org
    const caseManager = await db.collection('users').findOne({ email: 'miknabil@yahoo.com' });
    if (!caseManager) {
      console.error('❌ Case manager not found');
      return;
    }
    
    const orgMember = await db.collection('org_members').findOne({ userId: caseManager._id.toString() });
    if (!orgMember) {
      console.error('❌ Org member not found');
      return;
    }
    
    const organizationId = orgMember.organizationId;
    console.log('📋 Case Manager:', caseManager.email);
    console.log('🏢 Organization ID:', organizationId, '\n');
    
    // Get all service relationships for this case manager
    const serviceRelationships = await db
      .collection('service_relationships')
      .find({
        caseManagerId: caseManager._id.toString(),
        organizationId: organizationId,
      })
      .toArray();
    
    console.log(`📊 Found ${serviceRelationships.length} service relationships\n`);
    
    if (serviceRelationships.length === 0) {
      console.error('❌ No service relationships found. Please seed clients first.');
      return;
    }
    
    // Authorization templates
    const authTemplates = [
      {
        status: 'APPROVED',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-03-31'), // 5 months from now
        units: 20,
        unitType: 'HOURS_PER_WEEK',
        approvalNumber: 'AUTH-2024-001234',
        submittedAt: new Date('2024-09-15'),
        approvalDate: new Date('2024-09-28'),
      },
      {
        status: 'APPROVED',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-01-31'), // ~3 months away
        units: 15,
        unitType: 'HOURS_PER_WEEK',
        approvalNumber: 'AUTH-2024-001122',
        submittedAt: new Date('2024-07-20'),
        approvalDate: new Date('2024-07-30'),
      },
      {
        status: 'APPROVED',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-11-30'), // Expires soon! (< 30 days)
        units: 25,
        unitType: 'HOURS_PER_WEEK',
        approvalNumber: 'AUTH-2024-001289',
        submittedAt: new Date('2024-08-15'),
        approvalDate: new Date('2024-08-25'),
      },
      {
        status: 'SUBMITTED',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        units: 18,
        unitType: 'HOURS_PER_WEEK',
        submittedAt: new Date('2024-10-15'),
      },
      {
        status: 'EXPIRED',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-09-30'), // Already expired
        units: 20,
        unitType: 'HOURS_PER_WEEK',
        approvalNumber: 'AUTH-2023-005678',
        submittedAt: new Date('2023-12-01'),
        approvalDate: new Date('2023-12-20'),
      },
      {
        status: 'DRAFT',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-07-31'),
        units: 22,
        unitType: 'HOURS_PER_WEEK',
      },
      {
        status: 'DENIED',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-03-31'),
        units: 30,
        unitType: 'HOURS_PER_WEEK',
        submittedAt: new Date('2024-09-10'),
      },
    ];
    
    // Action templates
    const actionTypes = [
      { type: 'REQUEST_INTAKE', priority: 'HIGH', dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: 'OPEN' }, // Due in 3 days
      { type: 'REQUEST_UPDATE', priority: 'NORMAL', dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: 'OPEN' }, // Due in 7 days
      { type: 'REQUEST_DOCUMENT', priority: 'CRITICAL', dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), status: 'OPEN' }, // Due tomorrow!
      { type: 'GENERAL_MESSAGE', priority: 'NORMAL', status: 'OPEN' },
      { type: 'REQUEST_UPDATE', priority: 'HIGH', status: 'COMPLETED', completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ];
    
    // Document templates
    const documentTypes = ['ISP', 'IAPP', 'PROGRESS_NOTE', 'AUTH', 'ROI', 'OTHER'];
    
    let authCount = 0;
    let actionCount = 0;
    let docCount = 0;
    
    // Seed data for each service relationship
    for (let i = 0; i < serviceRelationships.length; i++) {
      const sr = serviceRelationships[i];
      const srIdString = sr._id.toString();
      
      console.log(`\n🔄 Processing SR ${i + 1}/${serviceRelationships.length}: ${srIdString}`);
      
      // Get client info
      const client = await db.collection('clients').findOne({ _id: new ObjectId(sr.clientId) });
      const clientName = client ? `${client.identity?.firstName} ${client.identity?.lastName}` : 'Unknown Client';
      console.log(`   Client: ${clientName}`);
      
      // Add 1 authorization per service relationship (cycle through templates)
      const authTemplate = authTemplates[i % authTemplates.length];
      const authorization = {
        _id: new ObjectId(),
        organizationId: organizationId,
        clientId: sr.clientId,
        serviceRelationshipId: srIdString,
        ...authTemplate,
        createdByMemberId: caseManager._id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.collection('authorizations').insertOne(authorization);
      authCount++;
      console.log(`   ✅ Added authorization (${authorization.status})`);
      
      // Add 1-3 actions per service relationship
      const numActions = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numActions; j++) {
        const actionTemplate = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        const action = {
          _id: new ObjectId(),
          organizationId: organizationId,
          subjectType: 'SERVICE_RELATIONSHIP',
          subjectId: srIdString,
          ...actionTemplate,
          requestPayload: {
            notes: `Test action ${j + 1} for ${clientName}`,
            docType: actionTemplate.type === 'REQUEST_DOCUMENT' ? 'ISP' : undefined,
          },
          createdByMemberId: caseManager._id.toString(),
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          ...(actionTemplate.status === 'COMPLETED' ? {
            completedByMemberId: caseManager._id.toString(),
            responsePayload: { notes: 'Completed successfully' },
          } : {}),
        };
        
        await db.collection('actions').insertOne(action);
        actionCount++;
      }
      console.log(`   ✅ Added ${numActions} actions`);
      
      // Add 2-5 documents per service relationship
      const numDocs = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < numDocs; j++) {
        const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
        const document = {
          _id: new ObjectId(),
          organizationId: organizationId,
          clientId: sr.clientId,
          serviceRelationshipId: srIdString,
          uploadedByMemberId: caseManager._id.toString(),
          docType: docType,
          storageUri: `s3://referra-documents/${srIdString}/${docType}_${j + 1}.pdf`,
          fileName: `${docType}_${j + 1}.pdf`,
          fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
        };
        
        await db.collection('documents').insertOne(document);
        docCount++;
      }
      console.log(`   ✅ Added ${numDocs} documents`);
    }
    
    console.log('\n');
    console.log('═══════════════════════════════════════════');
    console.log('✅ SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════');
    console.log(`📄 Authorizations: ${authCount}`);
    console.log(`📋 Actions: ${actionCount}`);
    console.log(`📁 Documents: ${docCount}`);
    console.log('═══════════════════════════════════════════\n');
    
    console.log('🎯 Test scenarios included:');
    console.log('   ✅ Approved authorizations (3-5 months remaining)');
    console.log('   ⚠️  Expiring soon (< 30 days)');
    console.log('   🔴 Expired authorizations');
    console.log('   📋 Pending/Submitted authorizations');
    console.log('   📝 Draft authorizations');
    console.log('   ❌ Denied authorizations');
    console.log('   📋 Open actions (with due dates)');
    console.log('   ✅ Completed actions');
    console.log('   📄 Various document types (ISP, IAPP, etc.)\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run the seed
seedTestData().catch(console.error);

