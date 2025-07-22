import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSession() {
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
  return session;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.user.user_metadata?.role !== 'provider') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const providerId = session.user.id;

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