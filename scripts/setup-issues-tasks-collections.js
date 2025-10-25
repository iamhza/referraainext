/**
 * Setup Script: Issues & Tasks Collections
 * 
 * Creates the issues and tasks collections with proper indexes
 * for optimal performance and data integrity.
 * 
 * Run: node scripts/setup-issues-tasks-collections.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'referradb';

async function setupCollections() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found in environment variables');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // ============================================
    // 1. CREATE ISSUES COLLECTION
    // ============================================
    
    console.log('\n📋 Setting up ISSUES collection...');
    
    const issuesExists = await db.listCollections({ name: 'issues' }).hasNext();
    
    if (!issuesExists) {
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
                  required: ['content', 'createdByMemberId', 'createdAt'],
                  properties: {
                    _id: { bsonType: 'objectId' },
                    content: { bsonType: 'string' },
                    createdByMemberId: { bsonType: 'string' },
                    createdAt: { bsonType: 'date' }
                  }
                }
              },
              relatedTaskIds: {
                bsonType: 'array',
                items: { bsonType: 'string' }
              },
              createdByMemberId: { bsonType: 'string' },
              createdAt: { bsonType: 'date' },
              resolvedByMemberId: { bsonType: 'string' },
              resolvedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('  ✅ Created issues collection with validation schema');
    } else {
      console.log('  ℹ️  Issues collection already exists');
    }

    // Create indexes for issues (per spec: organizationId, serviceRelationshipId, clientId)
    console.log('  📊 Creating indexes for issues...');
    
    const issuesIndexes = [
      {
        name: 'idx_issues_org_service_client',
        keys: { organizationId: 1, serviceRelationshipId: 1, clientId: 1 },
        options: { background: true }
      },
      {
        name: 'idx_issues_service_relationship',
        keys: { serviceRelationshipId: 1 },
        options: { background: true }
      },
      {
        name: 'idx_issues_client',
        keys: { clientId: 1 },
        options: { background: true }
      },
    ];

    for (const index of issuesIndexes) {
      try {
        await db.collection('issues').createIndex(index.keys, { 
          ...index.options, 
          name: index.name 
        });
        console.log(`    ✅ Created index: ${index.name}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
          console.log(`    ℹ️  Index already exists: ${index.name}`);
        } else {
          throw err;
        }
      }
    }

    // ============================================
    // 2. CREATE TASKS COLLECTION
    // ============================================
    
    console.log('\n✅ Setting up TASKS collection...');
    
    const tasksExists = await db.listCollections({ name: 'tasks' }).hasNext();
    
    if (!tasksExists) {
      await db.createCollection('tasks', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['organizationId', 'ownerMemberId', 'assigneeMemberId', 'title', 'status', 'createdAt'],
            properties: {
              organizationId: { bsonType: 'string' },
              ownerMemberId: { bsonType: 'string' },
              assigneeMemberId: { bsonType: 'string' },
              title: { bsonType: 'string' },
              description: { bsonType: ['string', 'null'] },
              status: {
                enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']
              },
              dueDate: { bsonType: ['date', 'null'] },
              clientId: { bsonType: ['string', 'null'] },
              serviceRelationshipId: { bsonType: ['string', 'null'] },
              issueId: { bsonType: ['string', 'null'] },
              createdAt: { bsonType: 'date' },
              completedAt: { bsonType: ['date', 'null'] },
              completedByMemberId: { bsonType: ['string', 'null'] }
            }
          }
        }
      });
      console.log('  ✅ Created tasks collection with validation schema');
    } else {
      console.log('  ℹ️  Tasks collection already exists');
    }

    // Create indexes for tasks (per spec: organizationId, ownerMemberId, assigneeMemberId)
    console.log('  📊 Creating indexes for tasks...');
    
    const tasksIndexes = [
      {
        name: 'idx_tasks_org_owner_assignee',
        keys: { organizationId: 1, ownerMemberId: 1, assigneeMemberId: 1 },
        options: { background: true }
      },
      {
        name: 'idx_tasks_owner',
        keys: { ownerMemberId: 1 },
        options: { background: true }
      },
      {
        name: 'idx_tasks_assignee',
        keys: { assigneeMemberId: 1 },
        options: { background: true }
      },
    ];

    for (const index of tasksIndexes) {
      try {
        await db.collection('tasks').createIndex(index.keys, { 
          ...index.options, 
          name: index.name 
        });
        console.log(`    ✅ Created index: ${index.name}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
          console.log(`    ℹ️  Index already exists: ${index.name}`);
        } else {
          throw err;
        }
      }
    }

    // ============================================
    // 3. VERIFY COLLECTIONS
    // ============================================
    
    console.log('\n🔍 Verifying collections...');
    
    const issuesCount = await db.collection('issues').countDocuments();
    const tasksCount = await db.collection('tasks').countDocuments();
    
    console.log(`  📋 Issues collection: ${issuesCount} documents`);
    console.log(`  ✅ Tasks collection: ${tasksCount} documents`);

    // ============================================
    // 4. SUMMARY
    // ============================================
    
    console.log('\n✨ Setup Complete!\n');
    console.log('Collections created:');
    console.log('  ✅ issues (3 indexes per spec)');
    console.log('  ✅ tasks (3 indexes per spec)');
    console.log('\nIndexes match Workspace Page & Issues Module Specification.');
    console.log('You can now use the workspace and issues system.');
    console.log('Navigate to: /case-manager/workspace\n');

  } catch (error) {
    console.error('❌ Error setting up collections:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupCollections()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

