import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

// GET /api/clients/[id]/pending-connections - Fetch pending connections for a client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: clientId } = params;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get client info to build match key
    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(clientId)
    });

    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Build client match key (firstName|lastName|dateOfBirth)
    const clientMatchKey = `${clientDoc.firstName}|${clientDoc.lastName}|${clientDoc.dateOfBirth}`;

    // Find pending connections for this client
    const pendingConnections = await db.collection('pending_connections')
      .find({
        clientMatchKey,
        status: 'pending'
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform to connection format with provider info
    const connections = await Promise.all(
      pendingConnections.map(async (conn) => {
        // Get provider info from Supabase if needed
        // For now, return basic connection info
        return {
          _id: conn._id,
          clientId,
          providerId: conn.providerId,
          providerName: conn.providerName || 'Unknown Provider',
          serviceType: conn.serviceType || 'Service',
          status: 'pending',
          createdAt: conn.createdAt,
          pmi: conn.pmi,
          connectionType: conn.connectionType,
          expiresAt: conn.expiresAt
        };
      })
    );

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching pending connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending connections' },
      { status: 500 }
    );
  }
}
