import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';


export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'provider') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const providerId = user.id;

    // Find clients linked to this provider through referrals
    const referrals = await db.collection('referrals').find({
      assignedProvider: providerId
    }).toArray();

    // Get unique client IDs from referrals
    const clientIds = [...new Set(referrals.map(r => r.clientInfo?._id).filter(Boolean))];

    // Fetch clients that are linked to this provider
    const clients = await db.collection('clients').find({
      $or: [
        { linkedProviderId: providerId },
        { _id: { $in: clientIds.map(id => typeof id === 'string' ? id : id.toString()) } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching provider clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
} 