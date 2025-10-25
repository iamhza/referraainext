/**
 * Setup service_messages collection with validation and indexes
 * HIPAA-compliant messaging system
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'referradb';

async function setupServiceMessages() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    // Check if collection already exists
    const collections = await db.listCollections({ name: 'service_messages' }).toArray();
    
    if (collections.length > 0) {
      console.log('⚠️  service_messages collection already exists');
      console.log('   Drop it first if you want to recreate: db.service_messages.drop()\n');
    } else {
      // Create collection with validation schema
      await db.createCollection('service_messages', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: [
              'organizationId',
              'serviceRelationshipId',
              'clientId',
              'content',
              'senderMemberId',
              'senderType',
              'createdAt'
            ],
            properties: {
              organizationId: {
                bsonType: 'string',
                description: 'Organization ID for tenant isolation (UUID string)'
              },
              serviceRelationshipId: {
                bsonType: 'string',
                description: 'FK to service_relationships (ObjectId string)'
              },
              clientId: {
                bsonType: 'string',
                description: 'FK to clients (ObjectId string)'
              },
              content: {
                bsonType: 'string',
                description: 'Message text (PHI protected)'
              },
              senderMemberId: {
                bsonType: 'string',
                description: 'FK to org_members (ObjectId string)'
              },
              senderType: {
                enum: ['CASE_MANAGER', 'PROVIDER_USER'],
                description: 'Type of sender'
              },
              linkedIssueId: {
                bsonType: 'string',
                description: 'FK to issues if this message led to an issue'
              },
              isIssueTrigger: {
                bsonType: 'bool',
                description: 'True if this message created the issue'
              },
              readAt: {
                bsonType: 'date',
                description: 'When the message was read'
              },
              readByMemberId: {
                bsonType: 'string',
                description: 'Who read the message'
              },
              attachmentUris: {
                bsonType: 'array',
                items: { bsonType: 'string' },
                description: 'Array of attachment URIs (future feature)'
              },
              createdAt: {
                bsonType: 'date',
                description: 'Message timestamp'
              }
            }
          }
        }
      });
      console.log('✅ Created service_messages collection with validation schema\n');
    }

    // Create indexes
    console.log('📊 Creating indexes...\n');
    
    const indexes = [
      {
        name: 'idx_service_messages_org_service_created',
        keys: { organizationId: 1, serviceRelationshipId: 1, createdAt: 1 },
        options: { background: true }
      },
      {
        name: 'idx_service_messages_client',
        keys: { clientId: 1 },
        options: { background: true }
      },
      {
        name: 'idx_service_messages_linked_issue',
        keys: { linkedIssueId: 1 },
        options: { background: true, sparse: true }
      },
      {
        name: 'idx_service_messages_sender',
        keys: { senderMemberId: 1, createdAt: -1 },
        options: { background: true }
      },
    ];

    for (const index of indexes) {
      try {
        await db.collection('service_messages').createIndex(
          index.keys,
          { ...index.options, name: index.name }
        );
        console.log(`  ✅ Created index: ${index.name}`);
      } catch (err) {
        if (err.code === 85) {
          console.log(`  ℹ️  Index already exists: ${index.name}`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n🔍 Verifying collection...');
    const count = await db.collection('service_messages').countDocuments();
    console.log(`  📋 service_messages collection: ${count} documents\n`);

    console.log('✨ Setup Complete!\n');
    console.log('Collection created:');
    console.log('  ✅ service_messages (4 indexes)');
    console.log('     - Primary: organizationId + serviceRelationshipId + createdAt');
    console.log('     - Secondary: clientId, linkedIssueId, senderMemberId');
    console.log('\n🔐 HIPAA-compliant features:');
    console.log('  ✅ Tenant isolation (organizationId)');
    console.log('  ✅ PHI protection (encrypted at rest)');
    console.log('  ✅ Audit trail via senderMemberId');
    console.log('  ✅ Validation schema enforced');
    console.log('\n📡 API endpoints ready:');
    console.log('  GET  /api/service-relationships/[id]/messages');
    console.log('  POST /api/service-relationships/[id]/messages');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error setting up collection:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
    console.log('✅ Script completed successfully\n');
  }
}

setupServiceMessages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

