import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Kenneth', 'Michelle', 'Joshua', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah', 'Timothy', 'Dorothy'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const serviceTypes = [
  'Semi-Independent Living Skills (SILS)', 
  'Supported Living Services (SLS)', 
  'Adult Day Training (ADT)',
  'Behavioral Health Services',
  'Mental Health Counseling', 
  'Substance Abuse Treatment', 
  'Housing Assistance', 
  'Job Training', 
  'Medical Care', 
  'Physical Therapy', 
  'Occupational Therapy', 
  'Speech Therapy', 
  'Case Management'
];

const waiverTypes = [
  'DD Waiver',
  'BI Waiver', 
  'CADI Waiver',
  'CAC Waiver',
  'EW Waiver',
  'AC Waiver'
];

const providerNames = [
  'Sunrise Community Services',
  'Community Health Partners',
  'Northstar Support Services', 
  'Riverside Care Center',
  'Harmony Health Solutions',
  'Unity Support Network',
  'Beacon Healthcare',
  'Compass Community Care',
  'Pathways Support Services',
  'Cornerstone Health Group'
];

// Use new status names that match our columns
const statuses = ['UNPLACED', 'REFERRAL_SENT', 'IN_PROCESS', 'ACTIVE_STABLE', 'ACTIVE_NEEDS_ATTENTION', 'CLOSED_DISCHARGED'];

function generateRandomPhone() {
  return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateRandomEmail(firstName: string, lastName: string) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function generateRandomPMI() {
  return Math.floor(Math.random() * 90000000) + 10000000;
}

function generateRandomDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Find the user by email (miknabil@yahoo.com)
    const user = await db.collection('users').findOne({ 
      email: 'miknabil@yahoo.com' 
    });
    
    let caseManagerId: string;
    let organizationId: string;
    
    if (!user) {
      // Fallback - find any case manager user
      const anyUser = await db.collection('users').findOne({ 
        role: 'case_manager' 
      });
      if (!anyUser) {
        return NextResponse.json(
          { success: false, error: 'No case manager user found' },
          { status: 404 }
        );
      }
      caseManagerId = anyUser._id.toString();
      organizationId = anyUser.org_id || anyUser.organizationId;
    } else {
      caseManagerId = user._id.toString();
      organizationId = user.org_id || user.organizationId;
    }

    console.log(`Using case manager ID: ${caseManagerId}`);
    console.log(`Using organization ID: ${organizationId}`);

    const mockClients = [];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const waiverType = waiverTypes[Math.floor(Math.random() * waiverTypes.length)];
      const providerName = providerNames[Math.floor(Math.random() * providerNames.length)];
      
      // Generate realistic data based on status
      const hasProvider = ['ACTIVE_STABLE', 'ACTIVE_NEEDS_ATTENTION', 'IN_PROCESS'].includes(status);
      const hasReferrals = !['UNPLACED'].includes(status);
      const activeReferrals = hasReferrals ? Math.floor(Math.random() * 3) + 1 : 0;
      const pendingReferrals = ['REFERRAL_SENT', 'IN_PROCESS'].includes(status) ? Math.floor(Math.random() * 2) + 1 : 0;
      
      const client = {
        firstName,
        lastName,
        email: Math.random() > 0.3 ? generateRandomEmail(firstName, lastName) : null, // Some clients don't have email
        phone: generateRandomPhone(),
        dateOfBirth: generateRandomDate(365 * 30).toISOString().split('T')[0],
        
        // Enhanced service information
        serviceType,
        serviceType1: Math.random() > 0.7 ? serviceTypes[Math.floor(Math.random() * serviceTypes.length)] : null,
        waiverType, // Add waiver type for primary waiver computation
        
        // PMI - always present as requested (same value for both fields)
        ...(() => {
          const pmiValue = generateRandomPMI().toString();
          return {
            pmi: pmiValue,
            pmiNumber: pmiValue
          };
        })(),
        
        // Status and provider information
        status,
        currentProvider: hasProvider ? providerName : null,
        providerInfo: hasProvider ? {
          name: providerName,
          organization: providerName,
          id: `provider_${i}_${Math.floor(Math.random() * 1000)}`
        } : null,
        providerOnboarded: hasProvider ? Math.random() > 0.3 : false,
        
        // Case manager assignment
        caseManagerId,
        org_id: organizationId,
        created_by: caseManagerId,
        assignedBy: caseManagerId,
        
        // Timestamps for last activity
        createdAt: generateRandomDate(90),
        updatedAt: generateRandomDate(Math.floor(Math.random() * 14) + 1), // Updated within last 2 weeks
        
        // Referral counts for backward compatibility
        activeReferrals,
        pendingReferrals,
        
        // Connection flags
        hasPendingConnection: status === 'IN_PROCESS' ? Math.random() > 0.5 : false,
        
        // Additional realistic data
        urgencyLevel: status === 'ACTIVE_NEEDS_ATTENTION' ? ['High', 'Critical'][Math.floor(Math.random() * 2)] : 'Normal',
        notes: `Mock client ${i + 1} - ${serviceType} services. Generated for enhanced client card testing.`,
        
        // Contact preferences
        preferredContactMethod: Math.random() > 0.5 ? 'phone' : 'email',
      };

      mockClients.push(client);
    }

    // Insert all mock clients
    const result = await db.collection('clients').insertMany(mockClients);
    
    // Create mock referrals for clients that should have them
    const mockReferrals: any[] = [];
    const mockConnections: any[] = [];
    
    mockClients.forEach((client, index) => {
      const clientId = result.insertedIds[index].toString();
      
      // Create referrals based on client status
      if (client.activeReferrals > 0) {
        for (let r = 0; r < client.activeReferrals; r++) {
          mockReferrals.push({
            clientId,
            clientInfo: {
              _id: clientId,
              firstName: client.firstName,
              lastName: client.lastName
            },
            serviceDetails: {
              type: client.serviceType,
              waiverType: client.waiverType
            },
            status: 'accepted',
            assignedProviderName: client.currentProvider,
            assignedProviderOrganization: client.providerInfo?.organization,
            createdAt: generateRandomDate(60),
            updatedAt: generateRandomDate(30),
            caseManagerId
          });
        }
      }
      
      if (client.pendingReferrals > 0) {
        for (let r = 0; r < client.pendingReferrals; r++) {
          mockReferrals.push({
            clientId,
            clientInfo: {
              _id: clientId,
              firstName: client.firstName,
              lastName: client.lastName
            },
            serviceDetails: {
              type: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
              waiverType: client.waiverType
            },
            status: ['pending', 'sent', 'submitted'][Math.floor(Math.random() * 3)],
            createdAt: generateRandomDate(30),
            updatedAt: generateRandomDate(7),
            caseManagerId
          });
        }
      }
      
      // Create connections for clients with providers
      if (client.currentProvider && client.providerInfo) {
        mockConnections.push({
          clientId: clientId, // Ensure this matches the client's _id as string
          providerId: client.providerInfo.id,
          providerName: client.currentProvider,
          serviceType: client.serviceType,
          status: 'active',
          createdAt: generateRandomDate(90),
          lastActivity: generateRandomDate(14),
          waiverType: client.waiverType // Add waiver type to connections
        });
      }
    });
    
    // Insert referrals and connections if any were created
    if (mockReferrals.length > 0) {
      await db.collection('referrals').insertMany(mockReferrals);
    }
    
    if (mockConnections.length > 0) {
      await db.collection('connections').insertMany(mockConnections);
    }
    
    // Calculate distribution
    const distribution = mockClients.reduce((acc: any, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${result.insertedCount} mock clients, ${mockReferrals.length} referrals, and ${mockConnections.length} connections`,
      distribution,
      insertedCount: result.insertedCount,
      referralsCreated: mockReferrals.length,
      connectionsCreated: mockConnections.length,
      caseManagerId,
      organizationId
    });

  } catch (error) {
    console.error('Error seeding mock clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed mock clients' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Delete all clients with mock notes (to identify our test data)
    const result = await db.collection('clients').deleteMany({
      notes: { $regex: 'Mock client.*Generated for testing' }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} mock clients`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting mock clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete mock clients' },
      { status: 500 }
    );
  }
}
