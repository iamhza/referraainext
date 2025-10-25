/**
 * Migration 02: Migrate Client Structure to Nested PHI
 * 
 * Restructures clients collection to use nested objects:
 * - identity, contact, bands, clinical, insurance
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';
  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    console.log('\n📋 Migration 02: Migrate client structure to nested PHI');
    console.log('='.repeat(60));

    // Get all clients
    const clients = await db.collection('clients').find({}).toArray();
    console.log(`\n✅ Found ${clients.length} clients to migrate`);

    for (const oldClient of clients) {
      // Build nested structure
      const newClient = {
        // Keep ID and org
        _id: oldClient._id,
        organizationId: oldClient.organizationId || oldClient.org_id,
        caseManagerId: oldClient.caseManagerId,
        
        // Status
        status: (oldClient.status === 'active' || !oldClient.status) ? 'ACTIVE' : 'INACTIVE',
        
        // Identity (nested)
        identity: {
          firstName: oldClient.firstName || '',
          lastName: oldClient.lastName || '',
          dob: oldClient.dateOfBirth ? new Date(oldClient.dateOfBirth) : new Date(),
          externalId: oldClient.pmiNumber || oldClient.pmi || null,
        },
        
        // Contact (nested)
        contact: {
          address: {
            line1: typeof oldClient.address === 'string' ? oldClient.address : (oldClient.address?.street || ''),
            city: oldClient.city || '',
            state: oldClient.state || '',
            zip: oldClient.zipCode || '',
            county: oldClient.county || null,
          },
          phone: oldClient.phone || null,
          email: oldClient.email || null,
        },
        
        // Bands (nested)
        bands: {
          language: oldClient.primaryLanguage || null,
          accessibility: oldClient.mobilityStatus ? [oldClient.mobilityStatus] : [],
        },
        
        // Clinical (nested)
        clinical: {
          primaryDiagnosis: oldClient.primaryDiagnosis || null,
          mentalHealthNeeds: null,
          physicalLimitations: null,
        },
        
        // Insurance (nested)
        insurance: oldClient.insurance ? oldClient.insurance : {
          type: oldClient.insuranceProvider ? 'private' : 'none',
          provider: oldClient.insuranceProvider || null,
          number: oldClient.insuranceNumber || null,
        },
        
        // Metadata
        createdAt: oldClient.createdAt || oldClient.created_at || new Date(),
        updatedAt: new Date(),
      };

      // Update the client
      await db.collection('clients').replaceOne(
        { _id: oldClient._id },
        newClient
      );
    }

    console.log(`✅ Migrated ${clients.length} clients to nested structure`);

    // Create indexes
    await db.collection('clients').createIndex({ organizationId: 1, 'identity.lastName': 1, 'identity.firstName': 1 });
    await db.collection('clients').createIndex({ caseManagerId: 1 });
    await db.collection('clients').createIndex({ status: 1 });
    console.log('✅ Created indexes on clients');

    console.log('\n✨ Migration 02 complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

run();

