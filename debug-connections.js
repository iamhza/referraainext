// Debug script to check what's in the clients collection
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugConnections() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('referradb');
    
    console.log('=== CASE MANAGER CLIENTS ===');
    const cmClients = await db.collection('clients')
      .find({ caseManagerId: { $exists: true } })
      .project({ firstName: 1, lastName: 1, dateOfBirth: 1, caseManagerId: 1, currentProvider: 1 })
      .limit(5)
      .toArray();
    
    cmClients.forEach(client => {
      console.log(`${client.firstName} ${client.lastName} | DOB: ${client.dateOfBirth} | CM: ${client.caseManagerId} | Provider: ${client.currentProvider}`);
    });
    
    console.log('\n=== PROVIDER CLIENTS ===');
    const providerClients = await db.collection('clients')
      .find({ 
        $or: [
          { currentProvider: { $exists: true, $ne: null } },
          { createdBy: { $exists: true } }
        ]
      })
      .project({ firstName: 1, lastName: 1, dateOfBirth: 1, caseManagerId: 1, currentProvider: 1, createdBy: 1, caseManagerEmail: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    providerClients.forEach(client => {
      console.log(`${client.firstName} ${client.lastName} | DOB: ${client.dateOfBirth} | CM: ${client.caseManagerId} | Provider: ${client.currentProvider} | CreatedBy: ${client.createdBy} | CMEmail: ${client.caseManagerEmail}`);
    });
    
    console.log('\n=== MATCHING KEYS ===');
    
    // Test the normalize function
    function normalizeKey(firstName, lastName, dob) {
      const f = (firstName || '').trim().toLowerCase();
      const l = (lastName || '').trim().toLowerCase();
      const d = (dob || '').trim();
      return [f, l, d].filter(Boolean).join('|');
    }
    
    // Show some normalized keys
    console.log('CM Keys:');
    cmClients.forEach(client => {
      const key = normalizeKey(client.firstName, client.lastName, client.dateOfBirth);
      console.log(`  ${key}`);
    });
    
    console.log('Provider Keys:');
    providerClients.forEach(client => {
      const key = normalizeKey(client.firstName, client.lastName, client.dateOfBirth);
      console.log(`  ${key}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugConnections();
