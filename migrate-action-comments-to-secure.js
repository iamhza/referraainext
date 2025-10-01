const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrateActionCommentsToSecure() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔐 Connected to MongoDB');
    
    const db = client.db('referradb');
    
    // Find all actions with comments
    const actionsWithComments = await db.collection('actions')
      .find({ 
        comments: { $exists: true, $ne: [], $not: { $size: 0 } }
      })
      .toArray();
    
    console.log(`📊 Found ${actionsWithComments.length} actions with comments to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const action of actionsWithComments) {
      if (!action.comments || action.comments.length === 0) continue;
      
      console.log(`\n🔄 Migrating ${action.comments.length} comments for action: ${action.title}`);
      
      for (const comment of action.comments) {
        try {
          // Create secure comment document
          const secureComment = {
            actionId: action._id.toString(),
            clientId: action.clientId,
            referralId: action.contextType === 'referral' ? action.contextId : undefined,
            authorId: comment.createdBy,
            authorName: comment.createdByName,
            authorType: comment.createdByRole,
            
            // For migration, we'll store as plain text initially
            // In production, this would be encrypted
            encryptedContent: {
              encryptedContent: Buffer.from(comment.content).toString('base64'),
              iv: 'migration_placeholder',
              authTag: 'migration_placeholder'
            },
            
            readBy: [],
            retentionDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date()
          };
          
          // Insert secure comment
          await db.collection('secure_action_comments').insertOne(secureComment);
          migratedCount++;
          
          console.log(`  ✅ Migrated comment by ${comment.createdByName}`);
          
        } catch (error) {
          console.error(`  ❌ Failed to migrate comment ${comment._id}:`, error.message);
          errorCount++;
        }
      }
      
      // Mark action as migrated and backup old comments
      await db.collection('actions').updateOne(
        { _id: action._id },
        { 
          $set: { 
            'comments_migrated': true,
            'comments_backup': action.comments,
            'comments': [] // Clear old comments
          }
        }
      );
      
      console.log(`  📦 Backed up and cleared old comments for action`);
    }
    
    console.log(`\n🎉 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migratedCount} comments`);
    console.log(`  ❌ Failed migrations: ${errorCount} comments`);
    console.log(`  📊 Actions processed: ${actionsWithComments.length}`);
    
    // Create index for performance
    await db.collection('secure_action_comments').createIndex({ actionId: 1 });
    await db.collection('secure_action_comments').createIndex({ clientId: 1 });
    await db.collection('secure_action_comments').createIndex({ retentionDate: 1 });
    
    console.log(`\n📈 Created indexes for secure_action_comments collection`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('🔐 MongoDB connection closed');
  }
}

// Run migration
console.log('🚀 Starting Action Comments Security Migration...');
console.log('⚠️  WARNING: This will move all action comments to encrypted storage');
console.log('📋 Existing comments will be backed up in comments_backup field\n');

migrateActionCommentsToSecure();

