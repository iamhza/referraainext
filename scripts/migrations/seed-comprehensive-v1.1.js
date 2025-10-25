const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

/**
 * Comprehensive v1.1 Data Model Seed Script
 * 
 * Seeds complete, realistic data for:
 * - Clients (v1.1 nested structure)
 * - Providers (with licenses, contacts)
 * - Service Relationships (all statuses)
 * - Authorizations (all statuses, realistic dates)
 * - Actions (4 simplified types)
 * - Documents (all doc types)
 * 
 * For: miknabil@yahoo.com @ TruWell Minnesota
 */

async function seedComprehensiveData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('referradb');
    
    // ============================================
    // STEP 1: Get Case Manager & Organization
    // ============================================
    console.log('📋 STEP 1: Fetching Case Manager & Organization\n');
    
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
    const userId = caseManager._id.toString();
    
    console.log(`✅ Case Manager: ${caseManager.name} (${caseManager.email})`);
    console.log(`✅ Organization ID: ${organizationId}`);
    console.log(`✅ User ID: ${userId}\n`);
    
    // ============================================
    // STEP 2: Clean Existing Data (optional)
    // ============================================
    console.log('🧹 STEP 2: Cleaning Existing Test Data\n');
    
    // Delete existing test data for this case manager
    const deleteResults = await Promise.all([
      db.collection('service_relationships').deleteMany({ caseManagerId: userId }),
      db.collection('authorizations').deleteMany({ organizationId: organizationId }),
      db.collection('actions').deleteMany({ organizationId: organizationId }),
      db.collection('documents').deleteMany({ organizationId: organizationId }),
      db.collection('clients').deleteMany({ caseManagerId: userId }),
    ]);
    
    console.log(`   Deleted ${deleteResults[0].deletedCount} service relationships`);
    console.log(`   Deleted ${deleteResults[1].deletedCount} authorizations`);
    console.log(`   Deleted ${deleteResults[2].deletedCount} actions`);
    console.log(`   Deleted ${deleteResults[3].deletedCount} documents`);
    console.log(`   Deleted ${deleteResults[4].deletedCount} clients\n`);
    
    // ============================================
    // STEP 3: Create Realistic Clients (v1.1)
    // ============================================
    console.log('👥 STEP 3: Creating Clients (v1.1 Structure)\n');
    
    const clientsData = [
      {
        identity: { firstName: 'Michael', lastName: 'Anderson', dob: new Date('1985-03-15'), externalId: 'PMI-2024-001' },
        contact: {
          address: { line1: '123 Oak Street', city: 'Minneapolis', state: 'MN', zip: '55401', county: 'Hennepin' },
          phone: '612-555-0101',
          email: 'michael.a@email.com',
        },
        bands: { language: 'English', accessibility: ['Wheelchair Access'] },
        clinical: { primaryDiagnosis: 'Autism Spectrum Disorder', mentalHealthNeeds: 'Anxiety support', physicalLimitations: 'Mobility challenges' },
        insurance: { type: 'medicaid', provider: 'Minnesota Health Care Programs', number: 'MN-12345678' },
      },
      {
        identity: { firstName: 'Sarah', lastName: 'Chen', dob: new Date('1992-07-22'), externalId: 'PMI-2024-002' },
        contact: {
          address: { line1: '456 Maple Avenue', city: 'St. Paul', state: 'MN', zip: '55102', county: 'Ramsey' },
          phone: '651-555-0202',
          email: 'sarah.chen@email.com',
        },
        bands: { language: 'English, Mandarin', accessibility: ['Visual Impairment Support'] },
        clinical: { primaryDiagnosis: 'Intellectual Disability', mentalHealthNeeds: 'Depression management', physicalLimitations: 'None' },
        insurance: { type: 'medicaid', provider: 'Minnesota Health Care Programs', number: 'MN-23456789' },
      },
      {
        identity: { firstName: 'James', lastName: 'Rodriguez', dob: new Date('1978-11-08'), externalId: 'PMI-2024-003' },
        contact: {
          address: { line1: '789 Elm Court', city: 'Bloomington', state: 'MN', zip: '55420', county: 'Hennepin' },
          phone: '952-555-0303',
        },
        bands: { language: 'English, Spanish', accessibility: [] },
        clinical: { primaryDiagnosis: 'Cerebral Palsy', mentalHealthNeeds: 'None', physicalLimitations: 'Limited mobility, uses wheelchair' },
        insurance: { type: 'medicaid', provider: 'Minnesota Health Care Programs', number: 'MN-34567890' },
      },
      {
        identity: { firstName: 'Emily', lastName: 'Johnson', dob: new Date('1995-05-30'), externalId: 'PMI-2024-004' },
        contact: {
          address: { line1: '321 Pine Street', city: 'Eden Prairie', state: 'MN', zip: '55344', county: 'Hennepin' },
          phone: '952-555-0404',
          email: 'emily.j@email.com',
        },
        bands: { language: 'English', accessibility: ['Hearing Impairment Support'] },
        clinical: { primaryDiagnosis: 'Down Syndrome', mentalHealthNeeds: 'Behavioral support', physicalLimitations: 'None' },
        insurance: { type: 'medicaid', provider: 'Minnesota Health Care Programs', number: 'MN-45678901' },
      },
      {
        identity: { firstName: 'David', lastName: 'Thompson', dob: new Date('1982-09-14'), externalId: 'PMI-2024-005' },
        contact: {
          address: { line1: '654 Birch Lane', city: 'Minnetonka', state: 'MN', zip: '55305', county: 'Hennepin' },
          phone: '952-555-0505',
          email: 'david.t@email.com',
        },
        bands: { language: 'English', accessibility: [] },
        clinical: { primaryDiagnosis: 'Traumatic Brain Injury', mentalHealthNeeds: 'PTSD support', physicalLimitations: 'Memory impairment' },
        insurance: { type: 'medicaid', provider: 'Minnesota Health Care Programs', number: 'MN-56789012' },
      },
    ];
    
    const createdClients = [];
    for (const clientData of clientsData) {
      const newClient = {
        _id: new ObjectId(),
        organizationId: organizationId,
        caseManagerId: userId,
        status: 'ACTIVE',
        ...clientData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.collection('clients').insertOne(newClient);
      createdClients.push(newClient);
      console.log(`   ✅ Created client: ${newClient.identity.firstName} ${newClient.identity.lastName}`);
    }
    console.log(`\n   Total: ${createdClients.length} clients created\n`);
    
    // ============================================
    // STEP 4: Get/Create Providers
    // ============================================
    console.log('🏢 STEP 4: Fetching Providers\n');
    
    const providers = await db.collection('providers')
      .find({ organizationId: organizationId })
      .limit(5)
      .toArray();
    
    console.log(`   Found ${providers.length} providers\n`);
    
    if (providers.length === 0) {
      console.error('❌ No providers found. Please seed providers first.');
      return;
    }
    
    // ============================================
    // STEP 5: Get Services from Catalog
    // ============================================
    console.log('📋 STEP 5: Fetching Services\n');
    
    const services = await db.collection('services')
      .find({ isActive: true })
      .limit(10)
      .toArray();
    
    console.log(`   Found ${services.length} services\n`);
    
    if (services.length === 0) {
      console.error('❌ No services found in catalog.');
      return;
    }
    
    // ============================================
    // STEP 6: Create Service Relationships
    // ============================================
    console.log('🔗 STEP 6: Creating Service Relationships\n');
    
    const statuses = ['PENDING_START', 'ACTIVE', 'PAUSED', 'CLOSED'];
    const flags = [null, null, 'NEEDS_ATTENTION', 'QUALITY_CONCERN', 'FUNDING_ISSUE', 'PROVIDER_UNRESPONSIVE'];
    const pendingReasons = ['AWAITING_DOCS', 'AWAITING_CONSENT', 'AWAITING_STAFFING', 'SCHEDULING_INTAKE'];
    const pauseReasons = ['TEMP_HOLD', 'HOSPITALIZED', 'CLIENT_UNAVAILABLE', 'PROVIDER_UNAVAILABLE'];
    const closeReasons = ['GOALS_MET', 'FUNDING_ENDED', 'CLIENT_MOVED', 'PROVIDER_SWITCH'];
    
    const createdServiceRels = [];
    
    // Create 2-3 service relationships per client
    for (const clientObj of createdClients) {
      const numServices = Math.floor(Math.random() * 2) + 2; // 2-3 services per client
      
      for (let i = 0; i < numServices; i++) {
        const provider = providers[Math.floor(Math.random() * providers.length)];
        const service = services[Math.floor(Math.random() * services.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const flag = flags[Math.floor(Math.random() * flags.length)];
        
        const serviceRel = {
          _id: new ObjectId(),
          organizationId: organizationId,
          clientId: clientObj._id.toString(),
          providerId: provider._id.toString(),
          serviceId: service._id.toString(),
          caseManagerId: userId,
          status: status,
          flag: flag,
          ...(status === 'PENDING_START' && { pendingReason: pendingReasons[Math.floor(Math.random() * pendingReasons.length)] }),
          ...(status === 'PAUSED' && { pauseReason: pauseReasons[Math.floor(Math.random() * pauseReasons.length)] }),
          ...(status === 'CLOSED' && { closeReason: closeReasons[Math.floor(Math.random() * closeReasons.length)] }),
          ...(status === 'ACTIVE' && {
            startDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Started 0-180 days ago
            phiReleased: {
              at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
              byMemberId: userId,
            },
          }),
          lastActivityAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Created within last year
          updatedAt: new Date(),
        };
        
        await db.collection('service_relationships').insertOne(serviceRel);
        createdServiceRels.push(serviceRel);
        
        console.log(`   ✅ ${clientObj.identity.firstName} ${clientObj.identity.lastName} → ${service.name} (${status})`);
      }
    }
    
    console.log(`\n   Total: ${createdServiceRels.length} service relationships created\n`);
    
    // ============================================
    // STEP 7: Create Authorizations
    // ============================================
    console.log('📄 STEP 7: Creating Authorizations\n');
    
    const authStatuses = ['APPROVED', 'SUBMITTED', 'DRAFT', 'DENIED', 'EXPIRED'];
    let authCount = 0;
    
    for (const sr of createdServiceRels) {
      // Only create authorizations for non-closed services
      if (sr.status === 'CLOSED') continue;
      
      const authStatus = authStatuses[Math.floor(Math.random() * authStatuses.length)];
      
      // Determine dates based on status
      let startDate, endDate, submittedAt, approvalDate, approvalNumber;
      
      if (authStatus === 'APPROVED') {
        startDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Started 0-90 days ago
        
        // Randomly decide expiration urgency
        const urgency = Math.random();
        if (urgency < 0.2) {
          // 20% chance: Expiring soon (< 30 days)
          endDate = new Date(Date.now() + (Math.random() * 25 + 5) * 24 * 60 * 60 * 1000); // 5-30 days
        } else if (urgency < 0.3) {
          // 10% chance: Already expired
          endDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // 0-30 days ago
        } else {
          // 70% chance: Good standing (2-6 months)
          endDate = new Date(Date.now() + (Math.random() * 120 + 60) * 24 * 60 * 60 * 1000); // 2-6 months
        }
        
        submittedAt = new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000); // Submitted 2 weeks before start
        approvalDate = new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000); // Approved 3 days before start
        approvalNumber = `AUTH-2024-${String(authCount + 1).padStart(6, '0')}`;
      } else if (authStatus === 'SUBMITTED') {
        startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Starts in 2 weeks
        endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months duration
        submittedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Submitted in last week
      } else if (authStatus === 'DRAFT') {
        startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Planned start in 1 month
        endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000);
      } else if (authStatus === 'DENIED') {
        startDate = new Date(Date.now());
        endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000);
        submittedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      } else if (authStatus === 'EXPIRED') {
        startDate = new Date(Date.now() - 270 * 24 * 60 * 60 * 1000); // Started 9 months ago
        endDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Expired 0-60 days ago
        submittedAt = new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000);
        approvalDate = new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000);
        approvalNumber = `AUTH-2023-${String(authCount + 1).padStart(6, '0')}`;
      }
      
      const authorization = {
        _id: new ObjectId(),
        organizationId: organizationId,
        clientId: sr.clientId,
        serviceRelationshipId: sr._id.toString(),
        status: authStatus,
        startDate: startDate,
        endDate: endDate,
        units: Math.floor(Math.random() * 20) + 10, // 10-30 units
        unitType: Math.random() > 0.5 ? 'HOURS_PER_WEEK' : 'HOURS_PER_MONTH',
        ...(approvalNumber && { approvalNumber }),
        ...(submittedAt && { submittedAt }),
        ...(approvalDate && { approvalDate }),
        createdByMemberId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.collection('authorizations').insertOne(authorization);
      authCount++;
    }
    
    console.log(`   Total: ${authCount} authorizations created\n`);
    
    // ============================================
    // STEP 8: Create Actions (4 Types)
    // ============================================
    console.log('📋 STEP 8: Creating Actions (v1.1 Simplified Types)\n');
    
    const actionTypes = ['REQUEST_INTAKE', 'REQUEST_UPDATE', 'REQUEST_DOCUMENT', 'GENERAL_MESSAGE'];
    const priorities = ['NORMAL', 'HIGH', 'CRITICAL'];
    let actionCount = 0;
    
    for (const sr of createdServiceRels) {
      // Create 0-4 actions per service relationship
      const numActions = Math.floor(Math.random() * 5);
      
      for (let i = 0; i < numActions; i++) {
        const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const isCompleted = Math.random() < 0.3; // 30% completed
        
        const action = {
          _id: new ObjectId(),
          organizationId: organizationId,
          subjectType: 'SERVICE_RELATIONSHIP',
          subjectId: sr._id.toString(),
          type: actionType,
          status: isCompleted ? 'COMPLETED' : 'OPEN',
          priority: priority,
          createdByMemberId: userId,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
          ...(priority !== 'NORMAL' && !isCompleted && {
            dueAt: new Date(Date.now() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000), // Due in 1-14 days
          }),
          requestPayload: {
            notes: `${actionType.replace(/_/g, ' ').toLowerCase()} for service relationship`,
            ...(actionType === 'REQUEST_DOCUMENT' && { docType: 'ISP' }),
          },
          ...(isCompleted && {
            completedByMemberId: userId,
            completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            responsePayload: { notes: 'Completed successfully' },
          }),
        };
        
        await db.collection('actions').insertOne(action);
        actionCount++;
      }
    }
    
    console.log(`   Total: ${actionCount} actions created\n`);
    
    // ============================================
    // STEP 9: Create Documents
    // ============================================
    console.log('📁 STEP 9: Creating Documents\n');
    
    const docTypes = ['ISP', 'IAPP', 'PROGRESS_NOTE', 'AUTH', 'ROI', 'OTHER'];
    let docCount = 0;
    
    for (const sr of createdServiceRels) {
      // Create 2-6 documents per service relationship
      const numDocs = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < numDocs; i++) {
        const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
        
        const document = {
          _id: new ObjectId(),
          organizationId: organizationId,
          clientId: sr.clientId,
          serviceRelationshipId: sr._id.toString(),
          uploadedByMemberId: userId,
          docType: docType,
          storageUri: `s3://referra-documents/${organizationId}/${sr.clientId}/${docType}_${Date.now()}_${i}.pdf`,
          fileName: `${docType}_${new Date().toISOString().split('T')[0]}_${i + 1}.pdf`,
          fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
        };
        
        await db.collection('documents').insertOne(document);
        docCount++;
      }
    }
    
    console.log(`   Total: ${docCount} documents created\n`);
    
    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ COMPREHENSIVE v1.1 DATA SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`👤 Case Manager: ${caseManager.name} (${caseManager.email})`);
    console.log(`🏢 Organization: TruWell Minnesota (${organizationId})`);
    console.log(`\n📊 Data Created:`);
    console.log(`   👥 Clients: ${createdClients.length} (v1.1 nested structure)`);
    console.log(`   🔗 Service Relationships: ${createdServiceRels.length}`);
    console.log(`   📄 Authorizations: ${authCount}`);
    console.log(`   📋 Actions: ${actionCount}`);
    console.log(`   📁 Documents: ${docCount}`);
    console.log(`\n🎯 Realistic Scenarios Included:`);
    console.log(`   ✅ Multiple clients with full PHI (identity, contact, bands, clinical)`);
    console.log(`   ✅ Service relationships in all lifecycle states`);
    console.log(`   ✅ Authorizations: approved, expiring, expired, pending, draft, denied`);
    console.log(`   ✅ Actions: all 4 v1.1 types (open & completed)`);
    console.log(`   ✅ Documents: all types (ISP, IAPP, progress notes, etc.)`);
    console.log(`   ✅ Flags: needs attention, quality concerns, funding issues`);
    console.log(`   ✅ PHI released indicators for active services`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run the comprehensive seed
seedComprehensiveData().catch(console.error);

