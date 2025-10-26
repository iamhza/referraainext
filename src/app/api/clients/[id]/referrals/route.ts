import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

// GET /api/clients/[id]/referrals - Fetch referrals for a client
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

    // Find referrals for this client
    // Note: referrals might be linked by clientId or clientInfo fields
    const referrals = await db.collection('referrals')
      .find({
        $or: [
          { 'clientInfo._id': clientId },
          { 'clientInfo.clientId': clientId },
          { 'clientId': clientId },
          { 'clientInfo._id': new ObjectId(clientId) },
          { 'clientInfo.clientId': new ObjectId(clientId) },
          { 'clientId': new ObjectId(clientId) }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Error fetching client referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}