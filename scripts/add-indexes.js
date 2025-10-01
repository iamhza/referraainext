// Script to add MongoDB indexes for performance optimization
// Run with: node scripts/add-indexes.js

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function addIndexes() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable not found');
    console.log('Please set MONGODB_URI in your .env file');
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('referradb');
    
    console.log('Adding MongoDB indexes for performance...');
    
    // Submissions collection indexes (for Referral Network)
    console.log('📄 Creating submissions indexes...');
    await db.collection('submissions').createIndex({ referralId: 1 });
    await db.collection('submissions').createIndex({ providerId: 1 });
    await db.collection('submissions').createIndex({ createdAt: -1 });
    await db.collection('submissions').createIndex({ score: -1 });
    await db.collection('submissions').createIndex({ referralId: 1, score: -1 }); // Compound for ranked lists
    
    // Comments collection indexes (for workspace performance)
    console.log('💬 Creating comments indexes...');
    await db.collection('comments').createIndex({ parentId: 1 });
    await db.collection('comments').createIndex({ createdAt: -1 });
    await db.collection('comments').createIndex({ referralId: 1, createdAt: -1 }); // Compound for conversations
    await db.collection('comments').createIndex({ authorId: 1, createdAt: -1 }); // For last activity
    
    // Referrals collection indexes (for connections and network)
    console.log('📋 Creating referrals indexes...');
    await db.collection('referrals').createIndex({ status: 1 });
    await db.collection('referrals').createIndex({ isOpenToNetwork: 1, networkExpiry: 1 }); // Network filtering
    await db.collection('referrals').createIndex({ caseManagerId: 1 });
    await db.collection('referrals').createIndex({ providerId: 1 });
    await db.collection('referrals').createIndex({ assignedProvider: 1 });
    await db.collection('referrals').createIndex({ 'clientInfo.clientMatchKey': 1 }); // Connections matching
    
    // Clients collection indexes (for connections discovery)
    console.log('👥 Creating clients indexes...');
    await db.collection('clients').createIndex({ caseManagerId: 1 });
    await db.collection('clients').createIndex({ currentProvider: 1 });
    await db.collection('clients').createIndex({ firstName: 1, lastName: 1, dateOfBirth: 1 }); // Matching key
    
    console.log('✅ All indexes created successfully!');
    console.log('📊 Performance optimization complete');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

if (require.main === module) {
  addIndexes();
}

module.exports = { addIndexes };
