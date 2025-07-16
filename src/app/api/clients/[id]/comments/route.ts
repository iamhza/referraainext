import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// GET: Fetch all comments for a client across all their referrals
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!clientId) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // First verify the client exists
    try {
      const clientDoc = await db.collection('clients').findOne({ _id: new ObjectId(clientId) });
      if (!clientDoc) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    // Get all referrals for this client
    const referrals = await db.collection('referrals').find({
      $or: [
        { 'clientInfo._id': clientId },
        { 'clientInfo.clientId': clientId },
        { 'clientId': clientId }
      ]
    }).sort({ createdAt: -1 }).toArray();

    if (referrals.length === 0) {
      return NextResponse.json({ 
        success: true, 
        groupedComments: {},
        totalComments: 0,
        totalReferrals: 0
      });
    }

    // Check permissions - case manager or admin can view
    const userRole = session.user.user_metadata?.role;
    const userId = session.user.id;
    
    const canView = 
      userRole === 'admin' || 
      (userRole === 'case_manager' && referrals.some(r => r.caseManagerId === userId));
    
    if (!canView) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Group comments by provider
    const groupedComments: Record<string, {
      providerName: string;
      providerId: string | null;
      services: Array<{
        referralId: string;
        serviceType: string;
        status: string;
        comments: any[];
        lastActivity: string;
      }>;
      totalComments: number;
      lastActivity: string;
    }> = {};

    let totalComments = 0;

    referrals.forEach(referral => {
      const providerId = referral.providerId || 'unassigned';
      const providerName = referral.providerName || 'Unassigned Provider';
      const comments = referral.comments || [];
      
      totalComments += comments.length;

      if (!groupedComments[providerId]) {
        groupedComments[providerId] = {
          providerName,
          providerId: referral.providerId || null,
          services: [],
          totalComments: 0,
          lastActivity: referral.createdAt
        };
      }

      // Add this referral as a service
      groupedComments[providerId].services.push({
        referralId: referral._id.toString(),
        serviceType: referral.serviceDetails?.type || 'Unknown Service',
        status: referral.status || 'pending',
        comments,
        lastActivity: comments.length > 0 
          ? comments[comments.length - 1].createdAt 
          : referral.createdAt
      });

      groupedComments[providerId].totalComments += comments.length;

      // Update last activity for the provider group
      const latestActivity = Math.max(
        ...groupedComments[providerId].services.map(s => 
          new Date(s.lastActivity).getTime()
        )
      );
      groupedComments[providerId].lastActivity = new Date(latestActivity).toISOString();
    });

    // Sort services within each provider by last activity
    Object.values(groupedComments).forEach(provider => {
      provider.services.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    });

    return NextResponse.json({
      success: true,
      groupedComments,
      totalComments,
      totalReferrals: referrals.length,
      clientId
    });

  } catch (error) {
    console.error('Error fetching client comments:', error);
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
  }
} 