import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
const COLLECTION = 'clients';



export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['platform_admin', 'case_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized - Admin or Case Manager access required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Find clients with broken CSV data
    // These have incomplete addresses starting with quote and county that looks like city names
    const brokenClientsQuery = {
      $and: [
        { address: { $regex: '^"' } }, // Address starts with quote (incomplete)
        { city: { $exists: false } }, // Missing city field
        { state: { $exists: false } }, // Missing state field
        { county: { $in: ['Somewhere', 'Anytown'] } } // County contains city names
      ]
    };
    
    // First, get the list of clients to be deleted for logging
    const clientsToDelete = await db.collection(COLLECTION).find(brokenClientsQuery).toArray();
    
    console.log(`Found ${clientsToDelete.length} clients with broken CSV data:`);
    clientsToDelete.forEach(client => {
      // HIPAA COMPLIANT: Log only non-PHI identifiers
      console.log(`- Client ID: ${client._id} (status: ${client.status})`);
    });
    
    if (clientsToDelete.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No broken clients found to delete',
        deletedCount: 0
      });
    }
    
    // Delete the broken clients
    const deleteResult = await db.collection(COLLECTION).deleteMany(brokenClientsQuery);
    
    console.log(`Successfully deleted ${deleteResult.deletedCount} broken clients`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} clients with broken CSV data`,
      deletedCount: deleteResult.deletedCount,
      deletedClients: clientsToDelete.map(c => ({
        id: c._id,
        name: `${c.firstName} ${c.lastName}`,
        address: c.address,
        county: c.county
      }))
    });
    
  } catch (error) {
    console.error('Error cleaning up broken clients:', error);
    return NextResponse.json({ error: 'Failed to cleanup broken clients' }, { status: 500 });
  }
} 