import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get all client-provider connections from our mock data
    const connections = await db.collection('service_relationships')
      .find({})
      .toArray();

    // Convert ObjectIds to strings for consistent matching
    const formattedConnections = connections.map(conn => ({
      ...conn,
      _id: conn._id.toString(),
      clientId: conn.clientId.toString(), // Ensure clientId is string
    }));

    return NextResponse.json({ 
      connections: formattedConnections,
      count: formattedConnections.length 
    });

  } catch (error) {
    console.error('Error fetching client connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client connections' },
      { status: 500 }
    );
  }
}





