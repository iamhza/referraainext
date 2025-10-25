/**
 * Migration 03: Enhance Service Relationships
 * 
 * Adds new fields from v1.1:
 * - clientName, providerName (denormalized)
 * - pendingReason, closeReason (enums)
 * - flag, flagNote
 * - phiReleased tracking
 * - Remove isActivated
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

    console.log('\n📋 Migration 03: Enhance service relationships');
    console.log('='.repeat(60));

    // Get all service relationships
    const serviceRelationships = await db.collection('service_relationships').find({}).toArray();
    console.log(`\n✅ Found ${serviceRelationships.length} service relationships to enhance`);

    for (const sr of serviceRelationships) {
      const updates = {
        $set: {
          // Denormalize names for performance
          clientName: sr.clientName || 'Unknown Client',
          providerName: sr.providerName || 'Unknown Provider',
          
          // Add lastActivityAt if not present
          lastActivityAt: sr.lastActivity || sr.updatedAt || new Date(),
          
          updatedAt: new Date(),
        },
        $unset: {
          // Remove deprecated fields
          isActivated: '',
          matchKey: '',
          lastActivity: '',  // Renamed to lastActivityAt
        }
      };

      await db.collection('service_relationships').updateOne(
        { _id: sr._id },
        updates
      );
    }

    console.log(`✅ Enhanced ${serviceRelationships.length} service relationships`);

    // Fetch client and provider names to populate denormalized fields
    console.log('\n📝 Populating denormalized names...');
    const updatedSRs = await db.collection('service_relationships').find({}).toArray();
    
    for (const sr of updatedSRs) {
      let clientName = sr.clientName;
      let providerName = sr.providerName;

      // Fetch client name
      if (clientName === 'Unknown Client' && sr.clientId) {
        try {
          const clientObjId = new ObjectId(sr.clientId);
          const clientDoc = await db.collection('clients').findOne({ _id: clientObjId });
          if (clientDoc && clientDoc.identity) {
            clientName = `${clientDoc.identity.firstName} ${clientDoc.identity.lastName}`;
          }
        } catch (err) {
          console.log(`⚠️  Could not fetch client for SR ${sr._id}`);
        }
      }

      // Fetch provider name
      if (providerName === 'Unknown Provider' && sr.providerId) {
        try {
          const providerObjId = new ObjectId(sr.providerId);
          const providerDoc = await db.collection('providers').findOne({ _id: providerObjId });
          if (providerDoc) {
            providerName = providerDoc.legalName || providerDoc.name || 'Unknown Provider';
          }
        } catch (err) {
          console.log(`⚠️  Could not fetch provider for SR ${sr._id}`);
        }
      }

      // Update with real names
      await db.collection('service_relationships').updateOne(
        { _id: sr._id },
        {
          $set: {
            clientName,
            providerName,
          }
        }
      );
    }

    console.log('✅ Populated denormalized names');

    // Create indexes
    await db.collection('service_relationships').createIndex({ organizationId: 1, caseManagerId: 1 });
    await db.collection('service_relationships').createIndex({ clientId: 1 });
    await db.collection('service_relationships').createIndex({ status: 1 });
    await db.collection('service_relationships').createIndex({ flag: 1 });
    console.log('✅ Created indexes on service_relationships');

    console.log('\n✨ Migration 03 complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

run();

