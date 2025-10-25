/**
 * Migration 04: Create Authorizations Collection
 * 
 * Creates new authorizations collection and migrates existing authorization
 * data from actions into proper authorization records.
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

    console.log('\n📋 Migration 04: Create authorizations collection');
    console.log('='.repeat(60));

    // Find authorization-related actions
    const authActions = await db.collection('actions').find({
      type: { $in: ['authorization_submitted', 'authorization_approved'] }
    }).toArray();

    console.log(`\n✅ Found ${authActions.length} authorization actions to migrate`);

    const authorizations = [];
    const authByClient = new Map();

    for (const action of authActions) {
      const clientId = action.clientId;
      
      if (!authByClient.has(clientId)) {
        authByClient.set(clientId, []);
      }
      authByClient.get(clientId).push(action);
    }

    // Group by client and create authorization records
    for (const [clientId, actions] of authByClient) {
      const submitted = actions.find(a => a.type === 'authorization_submitted');
      const approved = actions.find(a => a.type === 'authorization_approved');

      if (!submitted && !approved) continue;

      // Find service relationship for this client
      const serviceRelationship = await db.collection('service_relationships').findOne({ clientId });

      const authorization = {
        organizationId: submitted?.organizationId || approved?.organizationId || null,
        clientId: clientId,
        serviceRelationshipId: serviceRelationship?._id.toString() || null,
        
        status: approved ? 'APPROVED' : submitted ? 'SUBMITTED' : 'DRAFT',
        
        // From approval data
        startDate: approved?.data?.start_date ? new Date(approved.data.start_date) : null,
        endDate: approved?.data?.end_date ? new Date(approved.data.end_date) : null,
        units: approved?.data?.units_or_hours || null,
        unitType: 'HOURS_PER_WEEK',  // Default
        approvalNumber: approved?.data?.auth_number || null,
        
        // Workflow tracking
        submittedAt: submitted?.createdAt || null,
        submittedBy: submitted?.createdBy || null,
        approvalDate: approved?.data?.approval_date ? new Date(approved.data.approval_date) : null,
        approvedBy: approved?.createdBy || null,
        
        // Metadata
        createdBy: submitted?.createdBy || approved?.createdBy || null,
        createdAt: submitted?.createdAt || approved?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      authorizations.push(authorization);
    }

    // Insert authorizations
    if (authorizations.length > 0) {
      const result = await db.collection('authorizations').insertMany(authorizations);
      console.log(`✅ Created ${Object.keys(result.insertedIds).length} authorization records`);
    } else {
      console.log('ℹ️  No authorization data to migrate');
    }

    // Create indexes
    await db.collection('authorizations').createIndex({ organizationId: 1, clientId: 1 });
    await db.collection('authorizations').createIndex({ serviceRelationshipId: 1 });
    await db.collection('authorizations').createIndex({ status: 1 });
    console.log('✅ Created indexes on authorizations');

    console.log('\n✨ Migration 04 complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

run();

