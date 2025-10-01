// Script to assign missing caseManagerId to test clients
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function assignMissingCaseManagers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('referradb');
    
    // Get the first case manager ID from existing clients
    const existingCaseManager = await db.collection('clients').findOne({
      caseManagerId: { $exists: true, $ne: null }
    });
    
    if (!existingCaseManager) {
      console.log('❌ No existing case manager found. You need to create clients with case manager IDs first.');
      return;
    }
    
    const defaultCaseManagerId = existingCaseManager.caseManagerId;
    console.log('🎯 Using default case manager ID:', defaultCaseManagerId);
    
    // Find clients without case manager
    const clientsWithoutCM = await db.collection('clients').find({
      $or: [
        { caseManagerId: { $exists: false } },
        { caseManagerId: null },
        { caseManagerId: '' }
      ]
    }).toArray();
    
    console.log(`📊 Found ${clientsWithoutCM.length} clients without case manager`);
    
    if (clientsWithoutCM.length === 0) {
      console.log('✅ All clients already have case managers assigned!');
      return;
    }
    
    // Assign the default case manager to all clients without one
    const result = await db.collection('clients').updateMany(
      {
        $or: [
          { caseManagerId: { $exists: false } },
          { caseManagerId: null },
          { caseManagerId: '' }
        ]
      },
      {
        $set: { 
          caseManagerId: defaultCaseManagerId,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    console.log(`✅ Assigned case manager to ${result.modifiedCount} clients`);
    
    // Verify the result
    const remainingWithoutCM = await db.collection('clients').countDocuments({
      $or: [
        { caseManagerId: { $exists: false } },
        { caseManagerId: null },
        { caseManagerId: '' }
      ]
    });
    
    console.log(`📊 Clients still without case manager: ${remainingWithoutCM}`);
    
  } finally {
    await client.close();
  }
}

assignMissingCaseManagers();
