import clientPromise from './mongodb';

// This function ensures the required collections exist
// and creates them with appropriate indexes if they don't
export async function initializeMongoDBCollections() {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get list of existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Create conversations collection if it doesn't exist
    if (!collectionNames.includes('conversations')) {
      console.log('Creating conversations collection...');
      await db.createCollection('conversations');
      
      // Create indexes for better query performance
      await db.collection('conversations').createIndex({ 'participants.userId': 1 });
      await db.collection('conversations').createIndex({ 'type': 1 });
      await db.collection('conversations').createIndex({ 'lastActivity': -1 });
    }
    
    // Create messages collection if it doesn't exist
    if (!collectionNames.includes('messages')) {
      console.log('Creating messages collection...');
      await db.createCollection('messages');
      
      // Create indexes for better query performance
      await db.collection('messages').createIndex({ 'conversationId': 1, 'timestamp': 1 });
      await db.collection('messages').createIndex({ 'threadId': 1 });
      await db.collection('messages').createIndex({ 'senderId': 1 });
    }
    
    console.log('MongoDB collections initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing MongoDB collections:', error);
    return { success: false, error };
  }
}

export default initializeMongoDBCollections; 