const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function resetUser() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('referradb');
    
    // 1. Find the user
    const user = await db.collection('users').findOne({
      email: 'kerriwilltest@atomicmail.io'
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('Found user:', user.email);
    console.log('Current org_id:', user.org_id);
    
    // 2. Delete the orphaned organization if it exists
    if (user.org_id) {
      const orgDeleted = await db.collection('organizations').deleteOne({
        _id: new ObjectId(user.org_id)
      });
      console.log(`Deleted ${orgDeleted.deletedCount} organization(s)`);
    }
    
    // 3. Reset user's org_id and sandbox fields
    const result = await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          org_id: null,
          sandboxOrgId: null,
          tourCompleted: false,
          lastTourStepCompleted: 0,
        }
      }
    );
    
    console.log('✅ User reset complete');
    console.log('User can now go through sandbox signup again');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

resetUser();

