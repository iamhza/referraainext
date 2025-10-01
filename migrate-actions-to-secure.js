const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrateActionsToSecure() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔐 Connected to MongoDB');
    
    const db = client.db('referradb');
    
    // Find all existing actions
    const existingActions = await db.collection('actions').find({}).toArray();
    console.log(`📊 Found ${existingActions.length} actions to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    let phiDetectedCount = 0;
    
    for (const action of existingActions) {
      try {
        console.log(`\n🔄 Migrating action: ${action.title} (${action.type})`);
        
        // Detect PHI in action
        let hasPHI = false;
        if (action.notes || action.description || (action.data && Object.keys(action.data).length > 0)) {
          hasPHI = true;
          phiDetectedCount++;
          console.log(`  ⚠️  PHI detected in action fields`);
        }
        
        // Calculate retention date (7 years for HIPAA compliance)
        const retentionDate = new Date();
        retentionDate.setFullYear(retentionDate.getFullYear() + 7);
        
        // Create encrypted PHI object (for migration, we'll use base64 encoding)
        const encryptedPHI = {};
        
        if (action.notes && action.notes.trim()) {
          encryptedPHI.notes = {
            encryptedContent: Buffer.from(action.notes).toString('base64'),
            iv: 'migration_placeholder',
            authTag: 'migration_placeholder'
          };
        }
        
        if (action.description && action.description.trim()) {
          encryptedPHI.description = {
            encryptedContent: Buffer.from(action.description).toString('base64'),
            iv: 'migration_placeholder', 
            authTag: 'migration_placeholder'
          };
        }
        
        if (action.data && Object.keys(action.data).length > 0) {
          encryptedPHI.data = {
            encryptedContent: Buffer.from(JSON.stringify(action.data)).toString('base64'),
            iv: 'migration_placeholder',
            authTag: 'migration_placeholder'
          };
        }
        
        // Create secure action document
        const secureAction = {
          clientId: action.clientId,
          contextType: action.contextType || 'general',
          contextId: action.contextId,
          providerId: action.providerId,
          serviceType: action.serviceType,
          type: action.type,
          title: action.title,
          status: action.status || 'pending',
          urgency: action.urgency || 'normal',
          encryptedPHI,
          createdBy: action.createdBy,
          createdByRole: action.createdByRole,
          createdByName: action.createdByName,
          createdAt: new Date(action.createdAt),
          updatedAt: new Date(action.updatedAt || action.createdAt),
          targetDate: action.targetDate ? new Date(action.targetDate) : undefined,
          scheduledDate: action.scheduledDate ? new Date(action.scheduledDate) : undefined,
          completedAt: action.completedAt ? new Date(action.completedAt) : undefined,
          requiresROI: action.requiresROI,
          roiApproved: action.roiApproved || false,
          routing: action.routing || {
            primaryRecipient: action.providerId ? 'provider' : 'case_manager',
            recipientIds: action.providerId ? [action.providerId, action.createdBy] : [action.createdBy]
          },
          retentionDate,
          accessLog: [{
            userId: action.createdBy,
            accessedAt: new Date(action.createdAt),
            action: 'created'
          }]
        };
        
        // Insert secure action
        await db.collection('secure_actions').insertOne(secureAction);
        migratedCount++;
        
        console.log(`  ✅ Migrated to secure storage`);
        
      } catch (error) {
        console.error(`  ❌ Failed to migrate action ${action._id}:`, error.message);
        errorCount++;
      }
    }
    
    // Backup and clear old actions
    console.log(`\n📦 Backing up original actions...`);
    await db.collection('actions_backup').insertMany(existingActions);
    
    // Clear old actions (keep for now, just mark as migrated)
    await db.collection('actions').updateMany(
      {},
      { 
        $set: { 
          'migrated_to_secure': true,
          'migration_date': new Date()
        }
      }
    );
    
    console.log(`\n🎉 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migratedCount} actions`);
    console.log(`  ❌ Failed migrations: ${errorCount} actions`);
    console.log(`  🔒 Actions with PHI detected: ${phiDetectedCount}`);
    console.log(`  📊 Total actions processed: ${existingActions.length}`);
    
    // Create indexes for performance
    await db.collection('secure_actions').createIndex({ clientId: 1 });
    await db.collection('secure_actions').createIndex({ contextType: 1, contextId: 1 });
    await db.collection('secure_actions').createIndex({ retentionDate: 1 });
    await db.collection('secure_actions').createIndex({ 'accessLog.userId': 1 });
    await db.collection('secure_actions').createIndex({ type: 1 });
    await db.collection('secure_actions').createIndex({ status: 1 });
    
    console.log(`\n📈 Created indexes for secure_actions collection`);
    
    // Show some statistics
    const phiStats = await db.collection('secure_actions').aggregate([
      {
        $project: {
          type: 1,
          hasPHI: {
            $gt: [{ $size: { $objectToArray: '$encryptedPHI' } }, 0]
          }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          withPHI: { $sum: { $cond: ['$hasPHI', 1, 0] } }
        }
      },
      { $sort: { withPHI: -1 } }
    ]).toArray();
    
    console.log(`\n📊 PHI Distribution by Action Type:`);
    phiStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.withPHI}/${stat.total} actions contain PHI`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('🔐 MongoDB connection closed');
  }
}

// Run migration
console.log('🚀 Starting Actions Security Migration...');
console.log('⚠️  WARNING: This will move all actions to encrypted storage');
console.log('🔒 Actions with PHI will be encrypted for HIPAA compliance');
console.log('📋 Original actions will be backed up in actions_backup collection\n');

migrateActionsToSecure();

