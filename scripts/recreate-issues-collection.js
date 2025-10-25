/**
 * Recreate Issues Collection with Correct Schema
 * 
 * ⚠️  WARNING: This will DELETE all existing issues data!
 * 
 * Run: node scripts/recreate-issues-collection.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'referradb';

async function recreateCollection() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found in environment variables');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Check how many issues exist
    const issuesCount = await db.collection('issues').countDocuments();
    console.log(`\n📊 Current issues count: ${issuesCount}`);
    
    if (issuesCount > 0) {
      console.log('\n⚠️  WARNING: This will delete all existing issues!');
      console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🗑️  Dropping issues collection...');
    try {
      await db.collection('issues').drop();
      console.log('  ✅ Dropped old issues collection');
    } catch (err) {
      if (err.codeName === 'NamespaceNotFound') {
        console.log('  ℹ️  Collection does not exist, creating new one...');
      } else {
        throw err;
      }
    }

    console.log('\n📋 Creating issues collection with correct schema...');
    
    await db.createCollection('issues', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['organizationId', 'serviceRelationshipId', 'clientId', 'type', 'status', 'createdByMemberId', 'createdAt'],
          properties: {
            organizationId: { bsonType: 'string' },
            serviceRelationshipId: { bsonType: 'string' },
            clientId: { bsonType: 'string' },
            type: {
              enum: ['QUALITY_CONCERN', 'INCIDENT_REVIEW', 'FUNDING_ISSUE', 'OTHER']
            },
            status: {
              enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']
            },
            comments: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['_id', 'content', 'createdByMemberId', 'createdAt'],
                properties: {
                  _id: { bsonType: 'string' },  // ✅ String, not ObjectId
                  content: { bsonType: 'string' },
                  createdByMemberId: { bsonType: 'string' },
                  createdAt: { bsonType: 'date' },
                  updatedAt: { bsonType: ['date', 'null'] },  // ✅ For editing
                  parentCommentId: { bsonType: ['string', 'null'] }  // ✅ For threading
                }
              }
            },
            relatedTaskIds: {
              bsonType: 'array',
              items: { bsonType: 'string' }
            },
            createdByMemberId: { bsonType: 'string' },
            createdAt: { bsonType: 'date' },
            resolvedByMemberId: { bsonType: ['string', 'null'] },
            resolvedAt: { bsonType: ['date', 'null'] }
          }
        }
      }
    });
    console.log('  ✅ Created issues collection with updated schema');

    // Create indexes
    console.log('\n📊 Creating indexes...');
    
    const issuesIndexes = [
      {
        name: 'idx_issues_org_service_client',
        keys: { organizationId: 1, serviceRelationshipId: 1, clientId: 1 }
      },
      {
        name: 'idx_issues_service_relationship',
        keys: { serviceRelationshipId: 1 }
      },
      {
        name: 'idx_issues_client',
        keys: { clientId: 1 }
      },
    ];

    for (const index of issuesIndexes) {
      await db.collection('issues').createIndex(index.keys, { 
        background: true, 
        name: index.name 
      });
      console.log(`  ✅ Created index: ${index.name}`);
    }

    console.log('\n✨ Recreation Complete!\n');
    console.log('Schema now supports:');
    console.log('  ✅ String IDs for comments');
    console.log('  ✅ Threading (parentCommentId)');
    console.log('  ✅ Editing (updatedAt)');
    console.log('\nYou can now add threaded comments to issues! 🎉\n');

  } catch (error) {
    console.error('❌ Error recreating collection:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the recreation
recreateCollection()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


