import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { getSecureClientsForProvider } from '@/lib/secure-client';



export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providerId = params.id;
    const { firstName, lastName, dateOfBirth } = await request.json();

    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🔍 Checking if provider', providerId, 'has client:', { firstName, lastName, dateOfBirth });

    // Get all clients for this provider using the secure client access
    const providerClients = await getSecureClientsForProvider(
      providerId,
      user.id, // accessor (case manager checking)
      user.role
    );

    console.log('🔍 Provider has', providerClients.length, 'clients');

    // Check if any client matches the name and DOB
    const matchingClient = providerClients.find(client => 
      client.firstName?.toLowerCase() === firstName.toLowerCase() &&
      client.lastName?.toLowerCase() === lastName.toLowerCase() &&
      client.dateOfBirth === dateOfBirth
    );

    console.log('🎯 Matching client found:', !!matchingClient);

    if (matchingClient) {
      return NextResponse.json({ 
        hasClient: true, 
        clientId: matchingClient._id,
        message: 'Provider has this client' 
      });
    } else {
      return NextResponse.json({ 
        hasClient: false,
        message: 'Provider does not have this client' 
      });
    }

  } catch (error) {
    console.error('Error checking provider client:', error);
    return NextResponse.json({ error: 'Failed to check provider client' }, { status: 500 });
  }
}
