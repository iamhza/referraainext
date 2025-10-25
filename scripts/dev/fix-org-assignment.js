require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function fixOrgAssignment() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('referradb');
    
    // Get TruWell Minnesota organization ID
    const org = await db.collection('organizations').findOne({ name: /truwell/i });
    if (!org) {
      console.error('❌ TruWell Minnesota organization not found');
      return;
    }
    
    const orgId = org._id;
    console.log('✅ Found TruWell Minnesota org:', orgId);
    
    // Update case manager
    const userUpdate = await db.collection('users').updateOne(
      { email: 'miknabil@yahoo.com' },
      { $set: { organizationId: orgId } }
    );
    console.log('✅ Updated case manager:', userUpdate.modifiedCount, 'user(s)');
    
    // Get case manager's user ID
    const caseManager = await db.collection('users').findOne({ email: 'miknabil@yahoo.com' });
    if (!caseManager) {
      console.error('❌ Case manager not found');
      return;
    }
    
    // Update all clients assigned to this case manager that don't have org
    const clientUpdate = await db.collection('clients').updateMany(
      { 
        assignedTo: caseManager._id.toString(),
        $or: [
          { organizationId: { $exists: false } },
          { organizationId: null },
          { organizationId: undefined }
        ]
      },
      { $set: { organizationId: orgId } }
    );
    console.log('✅ Updated clients:', clientUpdate.modifiedCount, 'client(s)');
    
    // Update all actions for this case manager
    const actionUpdate = await db.collection('actions').updateMany(
      { 
        createdBy: caseManager._id.toString(),
        $or: [
          { organizationId: { $exists: false } },
          { organizationId: null },
          { organizationId: undefined }
        ]
      },
      { $set: { organizationId: orgId } }
    );
    console.log('✅ Updated actions:', actionUpdate.modifiedCount, 'action(s)');
    
    // Verify
    const clientCount = await db.collection('clients').countDocuments({ 
      assignedTo: caseManager._id.toString(),
      organizationId: orgId
    });
    console.log('\n📊 Final count:', clientCount, 'clients assigned to case manager with TruWell Minnesota org');
    
    const actionCount = await db.collection('actions').countDocuments({ 
      createdBy: caseManager._id.toString(),
      organizationId: orgId,
      status: 'pending'
    });
    console.log('📊 Final count:', actionCount, 'pending actions for case manager');
    
    console.log('\n✅ Done! Refresh your browser to see the clients on the board.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixOrgAssignment();

