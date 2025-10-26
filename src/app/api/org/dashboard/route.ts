/**
 * Organization dashboard API with real statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const orgId = user.org_id;

    // Get organization users
    const totalUsers = await db.collection('users').countDocuments({ org_id: orgId });
    
    // Get active users (users who have been active in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await db.collection('users').countDocuments({
      org_id: orgId,
      $or: [
        { updated_at: { $gte: thirtyDaysAgo.toISOString() } },
        { last_sign_in_at: { $gte: thirtyDaysAgo.toISOString() } }
      ]
    });

    // Get unique teams count
    const teamsAggregation = await db.collection('users').aggregate([
      { $match: { org_id: orgId, team_id: { $exists: true, $ne: null } } },
      { $group: { _id: '$team_id' } },
      { $count: 'totalTeams' }
    ]).toArray();
    const totalTeams = teamsAggregation[0]?.totalTeams || 0;

    // Get total clients in organization
    const totalClients = await db.collection('clients').countDocuments({ org_id: orgId });

    // Get total referrals in organization
    const totalReferrals = await db.collection('referrals').countDocuments({ org_id: orgId });

    // Get this month's referrals
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyReferrals = await db.collection('referrals').countDocuments({
      org_id: orgId,
      createdAt: { $gte: startOfMonth }
    });

    // Get pending invitations (if we have an invitations collection)
    let pendingInvitations = 0;
    try {
      pendingInvitations = await db.collection('invitations').countDocuments({
        org_id: orgId,
        status: 'pending'
      });
    } catch (error) {
      // Invitations collection might not exist yet
    }

    // Calculate average completion time
    const completedReferrals = await db.collection('referrals').find({
      org_id: orgId,
      status: 'completed',
      createdAt: { $exists: true },
      updatedAt: { $exists: true }
    }).toArray();

    let averageCompletionTime = '0 days';
    if (completedReferrals.length > 0) {
      const totalTime = completedReferrals.reduce((sum, referral) => {
        const created = new Date(referral.createdAt);
        const completed = new Date(referral.updatedAt);
        const diffDays = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      
      const avgDays = Math.round(totalTime / completedReferrals.length);
      averageCompletionTime = `${avgDays} days`;
    }

    const stats = {
      totalUsers,
      totalTeams,
      totalClients,
      totalReferrals,
      pendingInvitations,
      averageCompletionTime,
      monthlyReferrals,
      activeUsers
    };

    return NextResponse.json({ 
      success: true,
      stats,
      organization: user.organization || { name: 'Your Organization' }
    });

  } catch (error) {
    console.error('Error fetching organization dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' }, 
      { status: 500 }
    );
  }
}