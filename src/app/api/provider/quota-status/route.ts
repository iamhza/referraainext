import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { ensureProviderSubscription, isOverClientLimit } from '@/lib/supabase-quota';

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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();
    
    // Only allow providers to check their own quota or admin to check any
    if (user.id !== userId && user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get subscription
    const subscription = await ensureProviderSubscription(userId);

    // Check if provisional activation should trigger read-only mode
    let isReadOnly = false;
    let reason = '';

    // Count active client connections for this provider
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const activeConnections = await db.collection('referrals').countDocuments({
      $or: [{ providerId: userId }, { assignedProvider: userId }],
      status: { $in: ['confirmed', 'in_progress', 'active', 'accepted'] },
    });

    if (isOverClientLimit(subscription, activeConnections)) {
      isReadOnly = true;
      reason = `You're connected to ${activeConnections} clients but your ${subscription.plan} plan allows ${subscription.max_clients}. Upgrade to continue messaging.`;
    }

    // Grace period check for provisional connections (7 days)
    const provisionalConnections = await db.collection('referrals').find({
      $or: [{ providerId: userId }, { assignedProvider: userId }],
      provisional: true,
      provisionalExpiresAt: { $lt: new Date().toISOString() },
    }).toArray();

    if (provisionalConnections.length > 0 && !isReadOnly) {
      isReadOnly = true;
      reason = `Your grace period has expired on ${provisionalConnections.length} connection(s). Upgrade to continue messaging.`;
    }

    return NextResponse.json({
      isReadOnly,
      plan: subscription.plan,
      reason,
      activeConnections,
      maxClients: subscription.max_clients,
      submissionsUsed: subscription.submissions_used,
      submissionsQuota: subscription.submissions_quota,
    });
    
  } catch (error) {
    console.error('Quota status check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
