/**
 * Add PMI Database Indexes for ServiceConnection Performance
 * 
 * This script creates MongoDB indexes for optimal PMI-based client matching
 * Run this BEFORE testing ServiceConnection functionality
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'referradb';

async function addPMIIndexes() {
  console.log('🚀 Starting PMI index creation...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const clientsCollection = db.collection('clients');
    const pendingConnectionsCollection = db.collection('pending_connections');
    
    // 1. Primary PMI index for fast exact lookups
    console.log('📝 Creating PMI index...');
    await clientsCollection.createIndex(
      { pmi: 1 },
      { 
        name: 'pmi_index',
        sparse: true, // Only index documents that have PMI
        background: true
      }
    );
    console.log('✅ PMI index created');
    
    // 2. Compound PMI + DOB index for enhanced matching
    console.log('📝 Creating PMI + DOB compound index...');
    await clientsCollection.createIndex(
      { pmi: 1, dateOfBirth: 1 },
      { 
        name: 'pmi_dob_index',
        sparse: true,
        background: true
      }
    );
    console.log('✅ PMI + DOB compound index created');
    
    // 3. Service type index for filtering
    console.log('📝 Creating service type indexes...');
    await clientsCollection.createIndex(
      { serviceType: 1 },
      { 
        name: 'serviceType_index',
        sparse: true,
        background: true
      }
    );
    
    await clientsCollection.createIndex(
      { serviceType1: 1 },
      { 
        name: 'serviceType1_index',
        sparse: true,
        background: true
      }
    );
    console.log('✅ Service type indexes created');
    
    // 4. Case manager and provider indexes for role-based access
    console.log('📝 Creating role-based access indexes...');
    await clientsCollection.createIndex(
      { caseManagerId: 1 },
      { 
        name: 'caseManagerId_index',
        sparse: true,
        background: true
      }
    );
    
    await clientsCollection.createIndex(
      { currentProvider: 1 },
      { 
        name: 'currentProvider_index',
        sparse: true,
        background: true
      }
    );
    console.log('✅ Role-based access indexes created');
    
    // 5. Pending connections indexes for connection management
    console.log('📝 Creating pending connections indexes...');
    await pendingConnectionsCollection.createIndex(
      { clientMatchKey: 1, caseManagerId: 1, providerId: 1 },
      { 
        name: 'connection_lookup_index',
        background: true
      }
    );
    
    await pendingConnectionsCollection.createIndex(
      { pmi: 1 },
      { 
        name: 'pending_pmi_index',
        sparse: true,
        background: true
      }
    );
    
    await pendingConnectionsCollection.createIndex(
      { status: 1, expiresAt: 1 },
      { 
        name: 'status_expiry_index',
        background: true
      }
    );
    console.log('✅ Pending connections indexes created');
    
    // 6. Verify all indexes were created
    console.log('📊 Verifying created indexes...');
    const clientIndexes = await clientsCollection.listIndexes().toArray();
    const pendingIndexes = await pendingConnectionsCollection.listIndexes().toArray();
    
    console.log('📋 Clients collection indexes:');
    clientIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('📋 Pending connections collection indexes:');
    pendingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // 7. Test index performance
    console.log('🧪 Testing PMI query performance...');
    const startTime = Date.now();
    await clientsCollection.findOne({ pmi: '123456789' });
    const queryTime = Date.now() - startTime;
    console.log(`✅ PMI query completed in ${queryTime}ms`);
    
    if (queryTime < 100) {
      console.log('🚀 Index performance: EXCELLENT (< 100ms)');
    } else if (queryTime < 500) {
      console.log('✅ Index performance: GOOD (< 500ms)');
    } else {
      console.log('⚠️ Index performance: SLOW (> 500ms) - consider optimizing');
    }
    
    console.log('🎉 PMI indexes setup completed successfully!');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Test ServiceConnection functionality using SERVICECONNECTION_TESTING_GUIDE.md');
    console.log('2. Monitor query performance in production');
    console.log('3. Consider additional indexes based on usage patterns');
    
  } catch (error) {
    console.error('❌ Error creating PMI indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the index creation
if (require.main === module) {
  addPMIIndexes();
}

module.exports = { addPMIIndexes };
