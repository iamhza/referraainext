const { MongoClient } = require('mongodb');

// Mock data generators
const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Kenneth', 'Michelle', 'Joshua', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah', 'Timothy', 'Dorothy'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const serviceTypes = ['Mental Health Counseling', 'Substance Abuse Treatment', 'Housing Assistance', 'Job Training', 'Medical Care', 'Dental Care', 'Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Case Management', 'Crisis Intervention', 'Peer Support', 'Transportation', 'Food Assistance', 'Legal Aid'];

const statuses = ['UNPLACED_NEW', 'ACTIVE_STABLE', 'ACTIVE_FRUSTRATED'];

function generateRandomPhone() {
  return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateRandomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function generateRandomPMI() {
  return Math.floor(Math.random() * 90000000) + 10000000;
}

function generateRandomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

async function seedMockClients() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/referra';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('clients');

    // Get a sample user ID (you might need to adjust this)
    const users = await db.collection('users').findOne({});
    const caseManagerId = users?._id?.toString() || '68b0fde1c56e4a905a00ac5f';
    const organizationId = users?.organizationId || '68b0fc5ec56e4a905a00ac58';

    console.log(`Using case manager ID: ${caseManagerId}`);
    console.log(`Using organization ID: ${organizationId}`);

    const mockClients = [];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const client = {
        firstName,
        lastName,
        email: generateRandomEmail(firstName, lastName),
        phone: generateRandomPhone(),
        dateOfBirth: generateRandomDate(365 * 30).toISOString().split('T')[0], // Random birth date within last 30 years
        serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        serviceType1: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        pmi: generateRandomPMI().toString(),
        pmiNumber: generateRandomPMI().toString(),
        status,
        caseManagerId,
        organizationId,
        createdAt: generateRandomDate(90),
        updatedAt: generateRandomDate(7),
        // Random referral counts
        activeReferrals: Math.floor(Math.random() * 5),
        pendingReferrals: Math.floor(Math.random() * 3),
        // Random flags for variety
        hasPendingConnection: Math.random() > 0.8,
        providerOnboarded: Math.random() > 0.6,
        currentProvider: Math.random() > 0.5 ? `Provider ${Math.floor(Math.random() * 10) + 1}` : null,
        // Add some variety in urgency
        urgencyLevel: status === 'ACTIVE_FRUSTRATED' ? ['High', 'Critical'][Math.floor(Math.random() * 2)] : 'Normal',
        // Mock notes
        notes: `Mock client ${i + 1} - Generated for testing board performance with high client volume.`,
      };

      mockClients.push(client);
    }

    // Insert all mock clients
    const result = await collection.insertMany(mockClients);
    console.log(`✅ Successfully inserted ${result.insertedCount} mock clients`);

    // Show distribution by status
    const distribution = mockClients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Client distribution by status:');
    Object.entries(distribution).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} clients`);
    });

    console.log('🎯 Mock clients added! Refresh your board to see them.');

  } catch (error) {
    console.error('❌ Error seeding mock clients:', error);
  } finally {
    await client.close();
  }
}

// Run the seeder
seedMockClients();
