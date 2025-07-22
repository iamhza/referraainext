import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAdminUser } from '@/lib/supabase';

/**
 * GET handler for fetching aggregated dashboard metrics for the admin panel.
 * This is an admin-only endpoint.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const referralsCollection = db.collection('referrals');

    // Metric 1: New Referrals (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newReferralsCount = await referralsCollection.countDocuments({
      createdAt: { $gte: sevenDaysAgo.toISOString() },
    });

    // Metric 2: Pending Matches
    // This assumes a status of 'provider_selection_required' for pending referrals.
    const pendingMatchesCount = await referralsCollection.countDocuments({
      status: 'provider_selection_required',
    });

    // Metric 3: Referral Completion Rate
    // Assumes referrals are marked as 'COMPLETED' or 'IN_SERVICE'.
    const totalReferrals = await referralsCollection.countDocuments();
    const completedReferrals = await referralsCollection.countDocuments({
      status: { $in: ['COMPLETED', 'IN_SERVICE'] },
    });
    const completionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

    return NextResponse.json({
      newReferrals: newReferralsCount,
      pendingMatches: pendingMatchesCount,
      completionRate: parseFloat(completionRate.toFixed(1)), // Return as a percentage with one decimal
      // More metrics to be added here
    });

  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 