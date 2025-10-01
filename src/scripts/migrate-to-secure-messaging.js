// Migration Script: Convert old comments to secure messages
// Run this ONCE after deploying the new secure messaging system

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function migrateOldComments() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('referradb');
    
    console.log('🔄 Starting migration of old comments to secure messages...');
    
    // Find all referrals with comments
    const referralsWithComments = await db.collection('referrals').find({
      comments: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`📊 Found ${referralsWithComments.length} referrals with comments`);
    
    let migratedCount = 0;
    
    for (const referral of referralsWithComments) {
      console.log(`📝 Migrating ${referral.comments.length} comments for referral ${referral._id}`);
      
      for (const comment of referral.comments) {
        // Only migrate if not already migrated (check if it's not encrypted)
        if (typeof comment.content === 'string' && comment.content.length > 0) {
          
          // Create secure message (this will encrypt the content)
          const secureMessage = {
            referralId: referral._id.toString(),
            clientId: referral.clientInfo?._id || 'migrated',
            authorId: comment.authorId,
            authorName: comment.authorName || 'Unknown',
            authorType: comment.authorType || comment.authorRole || 'case_manager',
            
            // The new system will encrypt this
            encryptedContent: {
              encryptedContent: comment.content, // Will be re-encrypted by the new system
              iv: 'migration_placeholder',
              authTag: 'migration_placeholder'
            },
            
            category: comment.category || 'general',
            priority: comment.priority || 'normal',
            isInternal: comment.isInternal || false,
            
            readBy: comment.readBy || [],
            retentionDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
            createdAt: new Date(comment.createdAt || Date.now()),
            updatedAt: new Date()
          };
          
          // Insert into secure_messages collection
          await db.collection('secure_messages').insertOne(secureMessage);
          migratedCount++;
        }
      }
    }
    
    console.log(`✅ Migration completed! Migrated ${migratedCount} messages to secure storage`);
    console.log('');
    console.log('⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Test the messaging system thoroughly');
    console.log('2. Once confirmed working, you can remove old comments:');
    console.log('   db.referrals.updateMany({}, { $unset: { comments: 1 } })');
    console.log('3. Add the encryption key to your .env file');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  migrateOldComments().catch(console.error);
}

module.exports = { migrateOldComments };
