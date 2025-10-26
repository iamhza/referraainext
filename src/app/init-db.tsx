import { initializeMongoDBCollections } from '@/lib/mongodb/init';

// This is a server component that runs only on the server
export async function InitDatabase() {
  try {
    // Only run in production - in development, we'll handle this when needed
    if (process.env.NODE_ENV === 'production') {
      await initializeMongoDBCollections();
    }
    
    // This component doesn't render anything
    return null;
  } catch (error) {
    console.error('Error initializing database:', error);
    return null;
  }
}

export default InitDatabase; 