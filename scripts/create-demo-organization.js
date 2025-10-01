#!/usr/bin/env node

/**
 * Create "Riverside Social Services" demo organization
 * Based on the transformation plan demo data
 */

const { MongoClient } = require('mongodb');
const { createServerClient } = require('@supabase/ssr');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'referradb';

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    cookies: {
      get() { return undefined; },
    },
  }
);

// Demo organization data from transformation plan
const DEMO_ORG_DATA = {
  name: "Riverside Social Services",
  caseManagers: 25,
  activeClients: 400,
  avgPlacementTime: "3.2 days",
  monthlyPlacements: 85,
  timesSaved: "200 hours/month"
};

const DEMO_CLIENTS = [
  { 
    firstName: "Sarah", 
    lastName: "Johnson", 
    age: 34, 
    status: "UNPLACED_NEW", 
    needs: "Mental Health",
    dateOfBirth: "1989-03-15",
    phone: "(555) 234-5678",
    email: "sarah.demo@example.com",
    address: "123 Main St, Riverside, CA 92501",
    city: "Riverside",
    state: "CA",
    zipCode: "92501",
    county: "Riverside",
    insurance: { type: "medicaid", provider: "Riverside Health Plan" },
    primaryLanguage: "English",
    notes: "Seeking counseling services for anxiety and depression"
  },
  { 
    firstName: "Mike", 
    lastName: "Rodriguez", 
    age: 28, 
    status: "ACTIVE_STABLE", 
    needs: "Substance Abuse",
    dateOfBirth: "1995-07-22",
    phone: "(555) 345-6789", 
    email: "mike.demo@example.com",
    address: "456 Oak Ave, Riverside, CA 92502",
    city: "Riverside",
    state: "CA", 
    zipCode: "92502",
    county: "Riverside",
    insurance: { type: "medicaid", provider: "California Health Plan" },
    primaryLanguage: "Spanish",
    notes: "Currently in residential treatment program"
  },
  { 
    firstName: "Lisa", 
    lastName: "Martinez", 
    age: 42, 
    status: "ACTIVE_FRUSTRATED", 
    needs: "Family Services",
    dateOfBirth: "1981-11-08",
    phone: "(555) 456-7890",
    email: "lisa.demo@example.com", 
    address: "789 Pine St, Riverside, CA 92503",
    city: "Riverside",
    state: "CA",
    zipCode: "92503", 
    county: "Riverside",
    insurance: { type: "medicare", provider: "Medicare Plan B" },
    primaryLanguage: "English",
    notes: "Needs family counseling services, provider delays"
  }
];

const DEMO_TEAMS = [
  {
    name: "Mental Health Team",
    description: "Specializes in mental health and behavioral services",
    supervisor: "Dr. Emily Chen"
  },
  {
    name: "Substance Abuse Team", 
    description: "Handles addiction recovery and substance abuse cases",
    supervisor: "Mark Thompson"
  },
  {
    name: "Family Services Team",
    description: "Provides family counseling and support services",
    supervisor: "Sarah Williams"
  }
];

const DEMO_CASE_MANAGERS = [
  { name: "Jennifer Smith", email: "jennifer.smith@riverside.org", team: "Mental Health Team" },
  { name: "Robert Johnson", email: "robert.johnson@riverside.org", team: "Mental Health Team" },
  { name: "Maria Garcia", email: "maria.garcia@riverside.org", team: "Substance Abuse Team" },
  { name: "David Wilson", email: "david.wilson@riverside.org", team: "Substance Abuse Team" },
  { name: "Lisa Brown", email: "lisa.brown@riverside.org", team: "Family Services Team" },
  { name: "Michael Davis", email: "michael.davis@riverside.org", team: "Family Services Team" },
  { name: "Jessica Miller", email: "jessica.miller@riverside.org", team: "Mental Health Team" },
  { name: "Christopher Lee", email: "christopher.lee@riverside.org", team: "Substance Abuse Team" }
];

async function createDemoOrganization() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🚀 Connected to MongoDB and Supabase');
    
    const db = client.db(DB_NAME);

    // Step 1: Create Riverside Social Services organization
    console.log('\n🏢 Step 1: Creating Riverside Social Services...');
    
    const { data: demoOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: DEMO_ORG_DATA.name,
        slug: 'riverside-social-services',
        status: 'active',
        subscription_plan: 'professional',
        settings: {
          demo: true,
          case_managers_count: DEMO_ORG_DATA.caseManagers,
          target_clients: DEMO_ORG_DATA.activeClients,
          avg_placement_time: DEMO_ORG_DATA.avgPlacementTime,
          monthly_placements: DEMO_ORG_DATA.monthlyPlacements,
          time_saved: DEMO_ORG_DATA.timesSaved
        }
      })
      .select('id')
      .single();

    if (orgError) {
      throw new Error(`Failed to create demo organization: ${orgError.message}`);
    }

    const demoOrgId = demoOrg.id;
    console.log(`   ✅ Created Riverside Social Services: ${demoOrgId}`);

    // Step 2: Create demo teams
    console.log('\n👥 Step 2: Creating demo teams...');
    
    const teamIds = {};
    
    for (const teamData of DEMO_TEAMS) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          org_id: demoOrgId,
          name: teamData.name,
          description: teamData.description
        })
        .select('id, name')
        .single();

      if (teamError) {
        console.error(`   ⚠️  Failed to create team ${teamData.name}:`, teamError.message);
      } else {
        teamIds[teamData.name] = team.id;
        console.log(`   ✅ Created team: ${teamData.name}`);
      }
    }

    // Step 3: Create demo user profiles (for invitation simulation)
    console.log('\n👤 Step 3: Creating demo user profiles...');
    
    let caseManagerCount = 0;
    for (const manager of DEMO_CASE_MANAGERS) {
      // Create invitation record (simulating invited users)
      const { error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          org_id: demoOrgId,
          email: manager.email,
          role: 'case_manager',
          team_id: teamIds[manager.team],
          invited_by: null, // System generated
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (inviteError) {
        console.error(`   ⚠️  Failed to create invitation for ${manager.email}:`, inviteError.message);
      } else {
        caseManagerCount++;
      }
    }

    console.log(`   ✅ Created ${caseManagerCount} case manager invitations`);

    // Step 4: Create demo clients
    console.log('\n👥 Step 4: Creating demo clients...');
    
    const demoClientIds = [];
    
    for (const clientData of DEMO_CLIENTS) {
      const clientDoc = {
        ...clientData,
        orgId: demoOrgId,
        caseManagerId: 'demo-case-manager-id', // Placeholder
        createdBy: 'demo-system',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'demo_data',
        profileComplete: true
      };

      const result = await db.collection('clients').insertOne(clientDoc);
      demoClientIds.push(result.insertedId);
      console.log(`   ✅ Created demo client: ${clientData.firstName} ${clientData.lastName}`);
    }

    // Step 5: Create demo referrals
    console.log('\n📋 Step 5: Creating demo referrals...');
    
    const referralStatuses = [
      'under_review',
      'in_progress', 
      'active',
      'completed'
    ];

    for (let i = 0; i < DEMO_CLIENTS.length; i++) {
      const client = DEMO_CLIENTS[i];
      const clientId = demoClientIds[i];
      
      const referralDoc = {
        orgId: demoOrgId,
        clientInfo: {
          _id: clientId.toString(),
          firstName: client.firstName,
          lastName: client.lastName,
          dateOfBirth: client.dateOfBirth,
          email: client.email,
          phone: client.phone,
          address: {
            street: client.address.split(',')[0],
            city: client.city,
            state: client.state,
            zipCode: client.zipCode
          },
          insurance: client.insurance
        },
        serviceDetails: {
          type: client.needs,
          urgency: 'Medium',
          counties: [client.county],
          additionalNotes: client.notes
        },
        caseManagerId: 'demo-case-manager-id',
        caseManager: {
          id: 'demo-case-manager-id',
          name: 'Demo Case Manager',
          email: 'demo@riverside.org'
        },
        status: referralStatuses[i % referralStatuses.length],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        updatedAt: new Date(),
        progressPercentage: Math.floor(Math.random() * 100)
      };

      const result = await db.collection('referrals').insertOne(referralDoc);
      console.log(`   ✅ Created referral for ${client.firstName} ${client.lastName} (${referralDoc.status})`);
    }

    // Step 6: Create additional bulk demo data to reach target numbers
    console.log('\n📊 Step 6: Creating bulk demo data...');
    
    const additionalClients = DEMO_ORG_DATA.activeClients - DEMO_CLIENTS.length;
    const additionalReferrals = 50; // For demo purposes
    
    console.log(`   📝 Creating ${additionalClients} additional clients...`);
    
    const bulkClients = [];
    const bulkReferrals = [];
    
    for (let i = 0; i < additionalClients; i++) {
      const clientDoc = {
        firstName: `Client${i + 1}`,
        lastName: `Demo`,
        age: 25 + (i % 50),
        dateOfBirth: `19${70 + (i % 30)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        email: `client${i + 1}@demo.example.com`,
        address: `${100 + i} Demo St, Riverside, CA 92501`,
        city: "Riverside",
        state: "CA",
        zipCode: "92501",
        county: "Riverside",
        status: ["ACTIVE_STABLE", "UNPLACED_NEW", "ACTIVE_FRUSTRATED"][i % 3],
        orgId: demoOrgId,
        caseManagerId: 'demo-case-manager-id',
        createdBy: 'demo-system',
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        source: 'demo_bulk_data',
        profileComplete: true
      };
      
      bulkClients.push(clientDoc);
    }

    if (bulkClients.length > 0) {
      const clientResults = await db.collection('clients').insertMany(bulkClients);
      console.log(`   ✅ Created ${clientResults.insertedCount} bulk demo clients`);

      // Create some referrals for bulk clients
      for (let i = 0; i < Math.min(additionalReferrals, clientResults.insertedCount); i++) {
        const clientId = clientResults.insertedIds[i];
        const client = bulkClients[i];
        
        const referralDoc = {
          orgId: demoOrgId,
          clientInfo: {
            _id: clientId.toString(),
            firstName: client.firstName,
            lastName: client.lastName,
            dateOfBirth: client.dateOfBirth,
            email: client.email,
            phone: client.phone
          },
          serviceDetails: {
            type: ["Mental Health", "Substance Abuse", "Family Services"][i % 3],
            urgency: ["Low", "Medium", "High"][i % 3],
            counties: ["Riverside"],
            additionalNotes: `Demo referral for ${client.firstName}`
          },
          caseManagerId: 'demo-case-manager-id',
          status: referralStatuses[i % referralStatuses.length],
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          progressPercentage: Math.floor(Math.random() * 100)
        };
        
        bulkReferrals.push(referralDoc);
      }

      if (bulkReferrals.length > 0) {
        const referralResults = await db.collection('referrals').insertMany(bulkReferrals);
        console.log(`   ✅ Created ${referralResults.insertedCount} bulk demo referrals`);
      }
    }

    // Step 7: Create audit log
    console.log('\n📝 Step 7: Creating demo audit log...');
    
    const { error: auditError } = await supabase
      .from('organization_audit_logs')
      .insert({
        org_id: demoOrgId,
        user_id: null,
        action: 'demo_data_creation',
        entity_type: 'organization',
        entity_id: demoOrgId,
        metadata: {
          demo_type: 'riverside_social_services',
          clients_created: DEMO_CLIENTS.length + additionalClients,
          referrals_created: DEMO_CLIENTS.length + bulkReferrals.length,
          teams_created: DEMO_TEAMS.length,
          case_managers_invited: caseManagerCount,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.warn(`   ⚠️  Failed to create audit log: ${auditError.message}`);
    } else {
      console.log(`   ✅ Created demo audit log`);
    }

    console.log('\n🎉 Demo organization created successfully!');
    console.log(`\n📊 Riverside Social Services Summary:`);
    console.log(`   • Organization ID: ${demoOrgId}`);
    console.log(`   • Teams: ${Object.keys(teamIds).length}`);
    console.log(`   • Case Managers Invited: ${caseManagerCount}`);
    console.log(`   • Total Clients: ${DEMO_CLIENTS.length + additionalClients}`);
    console.log(`   • Total Referrals: ${DEMO_CLIENTS.length + bulkReferrals.length}`);
    console.log(`   • Demo URL: /org-admin (when logged in as org admin)`);

  } catch (error) {
    console.error('❌ Demo creation failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the demo creation
if (require.main === module) {
  createDemoOrganization()
    .then(() => {
      console.log('\n🚀 Demo organization setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createDemoOrganization };
