/**
 * Cleanup and Seed Service Relationships
 * 
 * This script:
 * 1. Removes all mock data for case manager miknabil@yahoo.com
 * 2. Seeds realistic service relationships with the new 5-state model
 * 
 * Run: node scripts/cleanup-and-seed-service-relationships.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const CASE_MANAGER_EMAIL = 'miknabil@yahoo.com';

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';

  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    // ========================================
    // STEP 1: Get case manager info
    // ========================================
    console.log('\n📋 Step 1: Getting case manager info...');
    const caseManager = await db.collection('users').findOne({ email: CASE_MANAGER_EMAIL });
    
    if (!caseManager) {
      console.error(`❌ Case manager ${CASE_MANAGER_EMAIL} not found`);
      process.exit(1);
    }

    const caseManagerId = caseManager._id.toString();
    const organizationId = caseManager.organizationId?.toString() || caseManager.org_id?.toString();
    
    console.log(`✅ Found case manager: ${caseManager.name || caseManager.email}`);
    console.log(`   ID: ${caseManagerId}`);
    console.log(`   Organization ID: ${organizationId}`);

    // ========================================
    // STEP 2: Clean up old mock data
    // ========================================
    console.log('\n🧹 Step 2: Cleaning up old mock data...');
    
    // Delete old service relationships for this case manager
    const srDeleteResult = await db.collection('service_relationships').deleteMany({
      caseManagerId: caseManagerId
    });
    console.log(`   Deleted ${srDeleteResult.deletedCount} service relationships`);

    // Delete old actions for this case manager's clients
    const clientsToCleanup = await db.collection('clients')
      .find({ caseManagerId: caseManagerId })
      .project({ _id: 1 })
      .toArray();
    
    const clientIds = clientsToCleanup.map(c => c._id.toString());
    
    if (clientIds.length > 0) {
      const actionsDeleteResult = await db.collection('actions').deleteMany({
        clientId: { $in: clientIds }
      });
      console.log(`   Deleted ${actionsDeleteResult.deletedCount} actions`);
    }

    // Delete old clients
    const clientsDeleteResult = await db.collection('clients').deleteMany({
      caseManagerId: caseManagerId
    });
    console.log(`   Deleted ${clientsDeleteResult.deletedCount} clients`);

    // Clean up old/mock providers for this organization
    const providersDeleteResult = await db.collection('providers').deleteMany({
      organizationId: organizationId
    });
    console.log(`   Deleted ${providersDeleteResult.deletedCount} providers`);

    console.log('✅ Cleanup complete!');

    // ========================================
    // STEP 3: Seed realistic providers
    // ========================================
    console.log('\n🏢 Step 3: Seeding providers...');
    
    const mockProviders = [
      {
        name: 'TruWell Minnesota',
        type: 'behavioral_health',
        description: 'Comprehensive behavioral health and independent living services',
        address: '123 Wellness Ave, Minneapolis, MN 55401',
        phone: '612-555-0100',
        email: 'contact@truwellmn.org',
        website: 'https://truwellmn.org',
        services: ['Independent Living Skills (ILS)', 'Mental Health Services', 'Case Management'],
        isActive: true,
      },
      {
        name: 'Harmony House',
        type: 'residential',
        description: 'Residential services and 24/7 support for adults with disabilities',
        address: '456 Care Street, St. Paul, MN 55102',
        phone: '651-555-0200',
        email: 'info@harmonyhouse.org',
        website: 'https://harmonyhouse.org',
        services: ['Night Supervision', 'Residential Support', 'Community Integration'],
        isActive: true,
      },
      {
        name: 'Career Pathways Inc',
        type: 'employment',
        description: 'Employment support and job coaching for individuals with disabilities',
        address: '789 Employment Blvd, Bloomington, MN 55420',
        phone: '952-555-0300',
        email: 'jobs@careerpathways.org',
        website: 'https://careerpathways.org',
        services: ['Supported Employment', 'Job Coaching', 'Skills Training'],
        isActive: true,
      },
      {
        name: 'Community Care Network',
        type: 'community_services',
        description: 'Community-based support and integration services',
        address: '321 Community Dr, Edina, MN 55424',
        phone: '952-555-0400',
        email: 'support@ccnetwork.org',
        website: 'https://ccnetwork.org',
        services: ['Transportation Services', 'Housing Stabilization', 'Community Activities'],
        isActive: true,
      },
      {
        name: 'Hope & Healing Center',
        type: 'mental_health',
        description: 'Mental health counseling and crisis intervention services',
        address: '555 Healing Way, Minneapolis, MN 55403',
        phone: '612-555-0500',
        email: 'help@hopehealing.org',
        website: 'https://hopehealing.org',
        services: ['Mental Health Services', 'Crisis Intervention', 'Therapy & Counseling'],
        isActive: true,
      },
    ];

    const providersToInsert = mockProviders.map(p => ({
      ...p,
      organizationId: organizationId,
      org_id: organizationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const providersInsertResult = await db.collection('providers').insertMany(providersToInsert);
    const providers = Object.values(providersInsertResult.insertedIds).map((id, idx) => ({
      _id: id,
      ...providersToInsert[idx],
    }));

    console.log(`✅ Inserted ${providers.length} providers`);
    providers.forEach(p => console.log(`   - ${p.name} (${p.type})`));

    // ========================================
    // STEP 4: Seed realistic clients
    // ========================================
    console.log('\n👥 Step 4: Seeding clients...');
    
    const mockClients = [
      {
        firstName: 'Emma',
        lastName: 'Johnson',
        email: 'emma.johnson@example.com',
        phone: '555-0101',
        dateOfBirth: '1995-03-15',
      },
      {
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'michael.williams@example.com',
        phone: '555-0102',
        dateOfBirth: '1988-07-22',
      },
      {
        firstName: 'Sophia',
        lastName: 'Brown',
        email: 'sophia.brown@example.com',
        phone: '555-0103',
        dateOfBirth: '1992-11-08',
      },
      {
        firstName: 'James',
        lastName: 'Davis',
        email: 'james.davis@example.com',
        phone: '555-0104',
        dateOfBirth: '1985-05-30',
      },
      {
        firstName: 'Isabella',
        lastName: 'Martinez',
        email: 'isabella.martinez@example.com',
        phone: '555-0105',
        dateOfBirth: '1998-09-12',
      },
      {
        firstName: 'William',
        lastName: 'Garcia',
        email: 'william.garcia@example.com',
        phone: '555-0106',
        dateOfBirth: '1990-02-18',
      },
    ];

    const clientsToInsert = mockClients.map(c => ({
      ...c,
      caseManagerId: caseManagerId,
      organizationId: organizationId,
      org_id: organizationId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const clientsInsertResult = await db.collection('clients').insertMany(clientsToInsert);
    const insertedClients = Object.values(clientsInsertResult.insertedIds).map((id, idx) => ({
      _id: id,
      ...clientsToInsert[idx],
    }));

    console.log(`✅ Inserted ${insertedClients.length} clients`);

    // ========================================
    // STEP 5: Seed service relationships
    // ========================================
    console.log('\n🔗 Step 5: Seeding service relationships...');
    
    const serviceTypes = [
      'Independent Living Skills (ILS)',
      'Night Supervision',
      'Supported Employment',
      'Mental Health Services',
      'Housing Stabilization',
      'Transportation Services',
    ];

    const serviceRelationships = [];

    // Client 1: Emma Johnson - 2 services (1 Active, 1 Pending)
    serviceRelationships.push(
      {
        clientId: insertedClients[0]._id.toString(),
        providerId: providers[0]._id.toString(),
        providerName: providers[0].name,
        serviceType: serviceTypes[0], // ILS
        status: 'ACTIVE',
        isActivated: true,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        organizationId: organizationId,
        caseManagerId: caseManagerId,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        clientId: insertedClients[0]._id.toString(),
        providerId: providers[1]._id.toString(),
        providerName: providers[1].name,
        serviceType: serviceTypes[1], // Night Supervision
        status: 'PENDING_START',
        isActivated: false,
        lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        organizationId: organizationId,
        caseManagerId: caseManagerId,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    );

    // Client 2: Michael Williams - 1 service (Referral Sent)
    serviceRelationships.push({
      clientId: insertedClients[1]._id.toString(),
      providerId: providers[2]._id.toString(),
      providerName: providers[2].name,
      serviceType: serviceTypes[2], // Supported Employment
      status: 'REFERRAL_SENT',
      isActivated: false,
      lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      organizationId: organizationId,
      caseManagerId: caseManagerId,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Client 3: Sophia Brown - 3 services (2 Active, 1 Paused)
    serviceRelationships.push(
      {
        clientId: insertedClients[2]._id.toString(),
        providerId: providers[0]._id.toString(),
        providerName: providers[0].name,
        serviceType: serviceTypes[3], // Mental Health
        status: 'ACTIVE',
        isActivated: true,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        organizationId: organizationId,
        caseManagerId: caseManagerId,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        clientId: insertedClients[2]._id.toString(),
        providerId: providers[1]._id.toString(),
        providerName: providers[1].name,
        serviceType: serviceTypes[4], // Housing Stabilization
        status: 'ACTIVE',
        isActivated: true,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        organizationId: organizationId,
        caseManagerId: caseManagerId,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        clientId: insertedClients[2]._id.toString(),
        providerId: providers[3 % providers.length]._id.toString(),
        providerName: providers[3 % providers.length].name,
        serviceType: serviceTypes[5], // Transportation
        status: 'PAUSED',
        isActivated: true,
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        pausedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        pauseReason: 'Client hospitalized',
        lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        organizationId: organizationId,
        caseManagerId: caseManagerId,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      }
    );

    // Client 4: James Davis - 1 service (Active)
    serviceRelationships.push({
      clientId: insertedClients[3]._id.toString(),
      providerId: providers[1]._id.toString(),
      providerName: providers[1].name,
      serviceType: serviceTypes[0], // ILS
      status: 'ACTIVE',
      isActivated: true,
      startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      organizationId: organizationId,
      caseManagerId: caseManagerId,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Client 5: Isabella Martinez - 2 services (1 Referral, 1 Pending)
    serviceRelationships.push(
      {
        clientId: insertedClients[4]._id.toString(),
        providerId: providers[2]._id.toString(),
        providerName: providers[2].name,
        serviceType: serviceTypes[2], // Supported Employment
        status: 'REFERRAL_SENT',
        isActivated: false,
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        organizationId: organizationId,
        caseManagerId: caseManagerId,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        clientId: insertedClients[4]._id.toString(),
        providerId: providers[0]._id.toString(),
        providerName: providers[0].name,
        serviceType: serviceTypes[3], // Mental Health
        status: 'PENDING_START',
        isActivated: false,
        lastActivity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        organizationId: organizationId,
        caseManagerId: caseManagerId,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      }
    );

    // Client 6: William Garcia - 1 service (Closed)
    serviceRelationships.push({
      clientId: insertedClients[5]._id.toString(),
      providerId: providers[1]._id.toString(),
      providerName: providers[1].name,
      serviceType: serviceTypes[4], // Housing Stabilization
      status: 'CLOSED',
      isActivated: false,
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      organizationId: organizationId,
      caseManagerId: caseManagerId,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const srInsertResult = await db.collection('service_relationships').insertMany(serviceRelationships);
    console.log(`✅ Inserted ${Object.keys(srInsertResult.insertedIds).length} service relationships`);

    // ========================================
    // STEP 6: Summary
    // ========================================
    console.log('\n📊 Summary:');
    console.log(`   Clients: ${insertedClients.length}`);
    console.log(`   Service Relationships: ${serviceRelationships.length}`);
    console.log('\n   Status Breakdown:');
    const statusCounts = {
      REFERRAL_SENT: 0,
      PENDING_START: 0,
      ACTIVE: 0,
      PAUSED: 0,
      CLOSED: 0,
    };
    serviceRelationships.forEach(sr => {
      statusCounts[sr.status]++;
    });
    console.log(`     🔵 Referral Sent: ${statusCounts.REFERRAL_SENT}`);
    console.log(`     🟡 Pending Start: ${statusCounts.PENDING_START}`);
    console.log(`     🟢 Active: ${statusCounts.ACTIVE}`);
    console.log(`     🟠 Paused: ${statusCounts.PAUSED}`);
    console.log(`     ⚫ Closed: ${statusCounts.CLOSED}`);

    console.log('\n✨ Seed complete! Your case manager dashboard is ready to test.');
    console.log(`   Login as: ${CASE_MANAGER_EMAIL}`);
    console.log(`   You should see ${insertedClients.length} clients with ${serviceRelationships.length} total services`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
run();

