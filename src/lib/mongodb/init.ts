import clientPromise from './client';

// This function ensures the required collections exist
// and creates them with appropriate indexes if they don't
export async function initializeMongoDBCollections() {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get list of existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('MongoDB collections initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing MongoDB collections:', error);
    return { success: false, error };
  }
}

export default initializeMongoDBCollections; 