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

    const { referralId } = await request.json();
    if (!referralId) return NextResponse.json({ error: 'Missing referralId' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db('referradb');
    const _id = new ObjectId(referralId);

    await db.collection('referrals').updateOne(
      { _id },
      { $set: { archived: true, updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('connections/deactivate error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


