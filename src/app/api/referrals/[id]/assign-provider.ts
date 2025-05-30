import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
    const userRole = session.user.user_metadata?.role;
    if (userRole !== 'case_manager' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { providerId, status } = await request.json();
    if (!providerId || !status) {
      return NextResponse.json({ error: 'providerId and status required' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('referradb');
    const update = {
      assignedProvider: providerId,
      status,
      updatedAt: new Date().toISOString(),
    };
    const result = await db.collection('referrals').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update } as any
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error assigning provider' }, { status: 500 });
  }
} 