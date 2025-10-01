import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/clients/[id]/connections - Fetch connections for a client
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

    // Connections are represented by active referrals - no separate collection needed
    // Find active referrals that represent connections
    const activeReferrals = await db.collection('referrals')
      .find({
        $or: [
          { 'clientInfo._id': clientId },
          { 'clientInfo.clientId': clientId },
          { 'clientId': clientId },
          { 'clientInfo._id': new ObjectId(clientId) },
          { 'clientInfo.clientId': new ObjectId(clientId) },
          { 'clientId': new ObjectId(clientId) }
        ],
        status: { $in: ['active', 'accepted'] },
        assignedProvider: { $exists: true, $ne: null }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Convert active referrals to connection format
    const referralConnections = activeReferrals.map(referral => ({
      _id: referral._id,
      clientId,
      providerId: referral.assignedProvider,
      providerName: referral.assignedProviderName || 'Unknown Provider',
      serviceType: referral.serviceType || 'Service',
      status: 'active',
      createdAt: referral.createdAt,
      lastActivity: referral.updatedAt,
      sourceReferralId: referral._id
    }));

    // Return the referral-based connections
    return NextResponse.json({ connections: referralConnections });
  } catch (error) {
    console.error('Error fetching client connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
