import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
export async function GET(req: Request) {
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
  if (!user || user.role !== 'provider') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'assigned'; // 'assigned' or 'open_network'

  const client = await clientPromise;
  const db = client.db('referradb');
  
  try {
    if (type === 'open_network') {
      // REPURPOSED: Open Network Referrals (per LAUNCH_SCOPE_AND_PLAN.md)
      const openReferrals = await db.collection('referrals').find({
        isOpenToNetwork: true,
        networkExpiry: { $gte: new Date().toISOString() }, // Not expired
        status: { $in: ['pending', 'matched'] } // Open for submissions
      }).project({
        _id: 1,
        'serviceDetails.type': 1,
        'serviceDetails.urgency': 1,
        'serviceDetails.description': 1,
        'serviceDetails.expectedStartDate': 1,
        'serviceDetails.location': 1,
        'serviceDetails.requirements': 1,
        createdAt: 1,
        networkExpiry: 1,
        // Client details excluded for privacy in open network
      }).sort({ createdAt: -1 }).limit(50).toArray();

      // Check if provider already submitted to each referral
      const referralIds = openReferrals.map(r => r._id);
      const existingSubmissions = await db.collection('submissions').find({
        referralId: { $in: referralIds },
        providerId: user.id
      }).project({ referralId: 1 }).toArray();

      const submittedReferralIds = new Set(existingSubmissions.map(s => s.referralId.toString()));

      const enrichedReferrals = openReferrals.map(referral => ({
        ...referral,
        hasSubmitted: submittedReferralIds.has(referral._id.toString()),
        daysLeft: Math.max(0, Math.ceil((new Date(referral.networkExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      }));

      return NextResponse.json({ 
        openReferrals: enrichedReferrals,
        total: enrichedReferrals.length,
        message: enrichedReferrals.length > 0 
          ? `${enrichedReferrals.length} referral${enrichedReferrals.length !== 1 ? 's' : ''} available for submission`
          : 'No open referrals available at the moment'
      });
    } else {
      // LEGACY: Assigned potential referrals
      const potentialReferrals = await db.collection('referrals').find({
        $and: [
          {
            $or: [
              { providerId: user.id },
              { assignedProvider: user.id }
            ]
          },
          {
            status: { 
              $in: ['matched', 'pending_confirmation', 'provider_selection_required'] 
            }
          }
        ]
      }).project({
        _id: 1,
        status: 1,
        'serviceDetails.type': 1,
        'serviceDetails.urgency': 1,
        createdAt: 1,
        // Don't include client details for privacy
      }).sort({ createdAt: -1 }).toArray();

      // Count referrals in different statuses
      const stats = {
        total: potentialReferrals.length,
        matched: potentialReferrals.filter(r => r.status === 'matched').length,
        pendingConfirmation: potentialReferrals.filter(r => r.status === 'pending_confirmation').length,
        underReview: potentialReferrals.filter(r => r.status === 'provider_selection_required').length
      };

      return NextResponse.json({ 
        potentialReferrals,
        stats,
        message: stats.total > 0 
          ? `You're being considered for ${stats.total} referral${stats.total !== 1 ? 's' : ''}`
          : 'No potential referrals at the moment'
      });
    }
  } catch (error) {
    console.error('Error fetching potential referrals:', error);
    return NextResponse.json({ error: 'Failed to fetch potential referrals' }, { status: 500 });
  }
} 