/**
 * Dummy Data Seeder for Sandbox Organizations
 * 
 * Generates realistic, tier-based dummy data to populate sandbox environments.
 * Data is randomized but consistent enough to feel authentic.
 * 
 * Performance target: Seed data in <3 seconds
 */

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ============================================================================
// REALISTIC NAME POOLS
// ============================================================================

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'David', 'Sofia', 'Matthew', 'Avery',
  'Joseph', 'Ella', 'Samuel', 'Scarlett', 'Jackson', 'Grace'
];

const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson',
  'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis',
  'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott'
];

const SERVICE_TYPES = [
  '245D Residential Services',
  'ARMHS (Adult Rehabilitative Mental Health)',
  'CADI Waiver Services',
  'Brain Injury (BI) Waiver',
  'Developmental Disabilities (DD) Waiver',
  'Elderly Waiver (EW)',
  'Supported Employment',
  'Day Training & Habilitation',
  'In-Home Support Services',
  'Crisis Response',
];

const PROVIDER_NAMES = [
  'Mindful Wellness Services',
  'Independence Plus',
  'Harmony Health Partners',
  'TruCare Support Systems',
  'Compass Community Services',
  'Beacon Behavioral Health',
  'Pathways Support Network',
  'Cornerstone Care Solutions',
  'Horizons Support Services',
  'Bridge to Independence',
  'Thrive Community Partners',
  'Lighthouse Support Group',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(['gmail.com', 'yahoo.com', 'outlook.com'])}`;
}

function generatePhone(): string {
  return `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

// ============================================================================
// SEED SANDBOX DATA
// ============================================================================

export interface SeedDataParams {
  organizationId: ObjectId;
  sandboxOrgId: ObjectId;
  userId: ObjectId;
  tier: 'micro' | 'mid' | 'enterprise';
  role: 'case_manager' | 'supervisor' | 'org_admin';
}

export interface SeedDataResult {
  success: boolean;
  counts: {
    clients: number;
    providers: number;
    referrals: number;
    messages: number;
    users?: number;
  };
  error?: string;
}

/**
 * Seed complete dummy data for a sandbox organization
 * 
 * Tier-based counts:
 * - Micro: 8-12 clients, 2 providers, 1 case manager
 * - Mid: 30-40 clients, 5 providers, 3 case managers, 1 supervisor
 * - Enterprise: 80-100 clients, 12 providers, 8 case managers, 3 supervisors, 1 org admin
 */
export async function seedSandboxData(params: SeedDataParams): Promise<SeedDataResult> {
  try {
    const { organizationId, sandboxOrgId, userId, tier, role } = params;
    const client = await clientPromise;
    const db = client.db('referradb');
    
    console.log(`🌱 Seeding ${tier} sandbox data...`);
    
    const counts = {
      clients: 0,
      providers: 0,
      referrals: 0,
      messages: 0,
      users: 0,
    };
    
    // ========================================================================
    // 1. CREATE PROVIDERS
    // ========================================================================
    
    const providerCount = tier === 'micro' ? 2 : tier === 'mid' ? 5 : 12;
    const providers: any[] = [];
    
    for (let i = 0; i < providerCount; i++) {
      const providerName = PROVIDER_NAMES[i % PROVIDER_NAMES.length];
      const provider = {
        business_name: providerName,
        contact_name: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
        email: `contact@${providerName.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: generatePhone(),
        service_types: [
          randomElement(SERVICE_TYPES),
          randomElement(SERVICE_TYPES),
        ],
        capacity: randomInt(10, 50),
        current_clients: randomInt(3, 20),
        status: 'active',
        created_at: daysAgo(randomInt(30, 180)),
        updated_at: new Date(),
      };
      
      const result = await db.collection('providers').insertOne(provider);
      providers.push({ _id: result.insertedId, ...provider });
      counts.providers++;
    }
    
    // ========================================================================
    // 2. CREATE ADDITIONAL USERS (for mid/enterprise tiers)
    // ========================================================================
    
    const caseManagerIds: ObjectId[] = [userId]; // Creator is first case manager
    
    if (tier === 'mid' || tier === 'enterprise') {
      const additionalCMs = tier === 'mid' ? 2 : 7;
      
      for (let i = 0; i < additionalCMs; i++) {
        const firstName = randomElement(FIRST_NAMES);
        const lastName = randomElement(LAST_NAMES);
        const cmUser = {
          email: generateEmail(firstName, lastName),
          name: `${firstName} ${lastName}`,
          role: 'case_manager',
          org_id: organizationId.toString(),
          team_id: null,
          created_at: daysAgo(randomInt(10, 60)),
          updated_at: new Date(),
          password_hash: '$2a$10$dummyhash', // Dummy hash (not used in sandbox)
        };
        
        const result = await db.collection('users').insertOne(cmUser);
        caseManagerIds.push(result.insertedId);
        counts.users++;
      }
    }
    
    // ========================================================================
    // 3. CREATE CLIENTS
    // ========================================================================
    
    const clientCount = 
      tier === 'micro' ? randomInt(8, 12) :
      tier === 'mid' ? randomInt(30, 40) :
      randomInt(80, 100);
    
    const statuses = ['Active-Stable', 'Active-Frustrated', 'Unplaced'];
    const urgencyLevels = ['low', 'medium', 'high'];
    const clients: any[] = [];
    
    for (let i = 0; i < clientCount; i++) {
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const status = randomElement(statuses);
      
      const client = {
        firstName: firstName,
        lastName: lastName,
        email: status !== 'Unplaced' ? generateEmail(firstName, lastName) : null,
        phone: generatePhone(),
        dateOfBirth: new Date(1970 + randomInt(0, 50), randomInt(0, 11), randomInt(1, 28)),
        status,
        urgency: randomElement(urgencyLevels),
        serviceNeeds: randomElement(SERVICE_TYPES),
        additionalNotes: `${firstName} has been making ${status === 'Active-Stable' ? 'excellent' : status === 'Active-Frustrated' ? 'some' : 'initial'} progress.`,
        orgId: organizationId.toString(),
        caseManagerId: randomElement(caseManagerIds).toString(),
        createdAt: daysAgo(randomInt(5, 120)),
        updatedAt: daysAgo(randomInt(0, 30)),
        createdBy: randomElement(caseManagerIds).toString(),
        retentionDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years from now
        profileComplete: false,
      };
      
      const result = await db.collection('clients').insertOne(client);
      clients.push({ _id: result.insertedId, ...client });
      counts.clients++;
    }
    
    // ========================================================================
    // 4. CREATE REFERRALS (for Active clients)
    // ========================================================================
    
    const activeClients = clients.filter(c => c.status.startsWith('Active'));
    
    for (const client of activeClients) {
      const provider = randomElement(providers);
      const referral = {
        clientId: client._id.toString(),
        clientName: `${client.firstName} ${client.lastName}`,
        providerId: provider._id.toString(),
        providerName: provider.business_name,
        serviceType: client.serviceNeeds,
        status: client.status === 'Active-Stable' ? 'accepted' : 'pending',
        urgency: client.urgency,
        notes: `Referral for ${client.serviceNeeds}`,
        organizationId: organizationId.toString(),
        caseManagerId: client.caseManagerId,
        createdAt: daysAgo(randomInt(5, 60)),
        updatedAt: daysAgo(randomInt(0, 10)),
        createdBy: client.createdBy,
      };
      
      await db.collection('referrals').insertOne(referral);
      counts.referrals++;
    }
    
    // ========================================================================
    // 5. CREATE WORKSPACE MESSAGES (for accepted referrals)
    // ========================================================================
    
    const messageTemplates = [
      'Just checking in on progress. How is everything going?',
      'Thank you for the update. Please keep me posted on any changes.',
      'Client is doing great! Making excellent progress with the services.',
      'Quick question about the service schedule - can we adjust the timing?',
      'Appreciate your responsiveness. Looking forward to continued success.',
    ];
    
    const sampleActiveClients = activeClients.slice(0, Math.min(5, activeClients.length));
    
    for (const client of sampleActiveClients) {
      const provider = randomElement(providers);
      
      for (let i = 0; i < randomInt(1, 3); i++) {
        const message = {
          senderId: randomInt(0, 1) === 0 ? client.caseManagerId : provider._id.toString(),
          senderType: randomInt(0, 1) === 0 ? 'case_manager' : 'provider',
          recipientId: randomInt(0, 1) === 0 ? provider._id.toString() : client.caseManagerId,
          recipientType: randomInt(0, 1) === 0 ? 'provider' : 'case_manager',
          clientId: client._id.toString(),
          subject: `Re: ${client.firstName} ${client.lastName} - ${client.serviceNeeds}`,
          message: randomElement(messageTemplates),
          category: randomElement(['status_update', 'follow_up_required', 'general']),
          isRead: randomInt(0, 1) === 1,
          createdAt: daysAgo(randomInt(1, 30)),
        };
        
        await db.collection('workspace_messages').insertOne(message);
        counts.messages++;
      }
    }
    
    // ========================================================================
    // 6. LOG COMPLETION
    // ========================================================================
    
    await db.collection('sandbox_analytics_events').insertOne({
      sandboxOrgId,
      userId,
      eventType: 'session_start',
      eventData: {
        tier,
        role,
        seededData: counts,
      },
      createdAt: new Date(),
    });
    
    console.log(`✅ Seeded ${tier} sandbox:`, counts);
    
    return {
      success: true,
      counts,
    };
    
  } catch (error) {
    console.error('❌ Error seeding sandbox data:', error);
    return {
      success: false,
      counts: {
        clients: 0,
        providers: 0,
        referrals: 0,
        messages: 0,
      },
      error: error instanceof Error ? error.message : 'Seeding failed',
    };
  }
}

// ============================================================================
// CLEAN UP SANDBOX DATA (for testing/reset)
// ============================================================================

export async function cleanupSandboxData(organizationId: ObjectId): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    await Promise.all([
      db.collection('clients').deleteMany({ orgId: organizationId.toString() }),
      db.collection('referrals').deleteMany({ organizationId: organizationId.toString() }),
      db.collection('workspace_messages').deleteMany({ 
        clientId: { $in: await db.collection('clients')
          .find({ orgId: organizationId.toString() })
          .map(c => c._id.toString())
          .toArray() 
        }
      }),
    ]);
    
    console.log(`🧹 Cleaned up sandbox data for org: ${organizationId}`);
  } catch (error) {
    console.error('Error cleaning up sandbox data:', error);
  }
}

