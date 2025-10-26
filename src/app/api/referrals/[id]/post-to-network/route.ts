import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { ObjectId } from 'mongodb';

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    const userRole = user.role;
    if (!['case_manager', 'platform_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { open = true, expiryDays = 7 } = body || {};

    const client = await clientPromise;
    const db = client.db('referradb');
    const _id = new ObjectId(params.id);

    const update: any = {
      isOpenToNetwork: !!open,
      networkExpiry: open ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    const res = await db.collection('referrals').findOneAndUpdate(
      { _id },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!res.value) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });

    return NextResponse.json({ success: true, referral: res.value });
  } catch (e) {
    console.error('post-to-network error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


