import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getAuthenticatedUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { clientMatchKey, caseManagerId, providerId } = await request.json();
    
    if (!clientMatchKey || !caseManagerId || !providerId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Find the pending connection to get ServiceConnection data
    const pendingConnection = await db.collection('pending_connections').findOne({
      clientMatchKey,
      caseManagerId,
      providerId,
      status: 'pending'
    });

    if (!pendingConnection) {
      return NextResponse.json({ 
        error: 'No pending connection found. Connection may have expired or already been activated.' 
      }, { status: 404 });
    }

    console.log('🔄 Activating ServiceConnection with data:', {
      pmi: pendingConnection.pmi,
      serviceType: pendingConnection.serviceType,
      connectionType: pendingConnection.connectionType
    });

    // Find or create referral linking these parties
    let referral = await db.collection('referrals').findOne({
      'clientInfo.clientMatchKey': clientMatchKey,
      caseManagerId,
      $or: [{ providerId }, { assignedProvider: providerId }],
    });

    if (!referral) {
      // Parse the match key to get client details
      const [firstName, lastName, dateOfBirth] = clientMatchKey.split('|');
      
      // Try to find the actual client record
      const clientFilter = {
        $or: [
          { caseManagerId, currentProvider: providerId },
          { caseManagerId, firstName, lastName, dateOfBirth }
        ]
      };
      
      const [c1] = await db
        .collection('clients')
        .find(clientFilter)
        .limit(1)
        .toArray();

      const nowDate = new Date();
      const now = nowDate.toISOString();
      const provisionalExpiresAt = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Ensure we have proper client info for matching
      const clientInfo = c1 ? {
        ...c1,
        clientMatchKey
      } : {
        firstName,
        lastName, 
        dateOfBirth,
        clientMatchKey
      };

      const doc = {
        clientInfo,
        caseManagerId,
        providerId,
        status: 'existing_service',
        createdAt: now,
        updatedAt: now,
        progressPercentage: 100, // Existing service is already active
        provisional: false, // This is a real connection, not provisional
        provisionalExpiresAt,
        
        // ServiceConnection metadata from pending connection
        serviceConnection: {
          pmi: pendingConnection.pmi,
          serviceType: pendingConnection.serviceType,
          connectionType: pendingConnection.connectionType || 'existing_service',
          establishedDate: now,
          establishedBy: user.id,
          matchConfidence: 'high', // PMI-based matching is high confidence
          dataSource: 'manual_connection',
          verified: true
        }
      } as any;

      const res = await db.collection('referrals').insertOne(doc);
      referral = { _id: res.insertedId, ...doc };
    }

    // Reuse assign-provider semantics by setting assignedProvider if missing
    if (!referral.assignedProvider) {
      await db.collection('referrals').updateOne(
        { _id: new ObjectId(referral._id) },
        { $set: { assignedProvider: providerId, updatedAt: new Date().toISOString() } }
      );
    }

    // Mark the pending connection as activated
    await db.collection('pending_connections').updateOne(
      { _id: pendingConnection._id },
      { 
        $set: { 
          status: 'activated',
          activatedAt: new Date().toISOString(),
          referralId: referral._id
        } 
      }
    );

    console.log('✅ ServiceConnection activated successfully:', {
      referralId: referral._id,
      pmi: pendingConnection.pmi,
      serviceType: pendingConnection.serviceType
    });

    return NextResponse.json({ 
      success: true, 
      referralId: referral._id,
      serviceConnection: {
        pmi: pendingConnection.pmi,
        serviceType: pendingConnection.serviceType,
        establishedDate: new Date().toISOString()
      }
    });
  } catch (e) {
    console.error('connections/activate error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


