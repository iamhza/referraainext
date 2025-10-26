import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';

import { getAuthenticatedUser } from '@/lib/auth/helpers';
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

    const { referralId, userId, userName, timestamp } = await request.json();

    if (!referralId || !userId || !userName || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Update or insert heartbeat record
    await db.collection('userPresence').updateOne(
      { 
        referralId,
        userId 
      },
      {
        $set: {
          referralId,
          userId,
          userName,
          lastSeen: new Date(timestamp),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Get all active users for this referral (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await db.collection('userPresence')
      .find({
        referralId,
        lastSeen: { $gte: fiveMinutesAgo }
      })
      .toArray();

    // Format response
    const onlineUsers = activeUsers.map(user => ({
      userId: user.userId,
      userName: user.userName,
      lastSeen: user.lastSeen,
      isOnline: new Date().getTime() - user.lastSeen.getTime() < 2 * 60 * 1000 // 2 minutes
    }));

    return NextResponse.json({ 
      success: true,
      onlineUsers 
    });

  } catch (error) {
    console.error('Error in heartbeat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
