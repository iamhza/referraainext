import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// GET: Fetch all comments for a referral
export async function GET(request: Request, { params }: { params: { id: string } }) {
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
    const client = await clientPromise;
    const db = client.db('referradb');
    const referral = await db.collection('referrals').findOne({ _id: new ObjectId(params.id) });
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, comments: referral.comments || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
  }
}

// POST: Add a new comment to a referral
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Comment text required' }, { status: 400 });
    }
    const comment = {
      authorId: session.user.id,
      authorRole: session.user.user_metadata?.role || 'unknown',
      text,
      createdAt: new Date().toISOString(),
    };
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection('referrals').updateOne(
      { _id: new ObjectId(params.id) },
      { $push: { comments: comment } } as any
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, comment });
  } catch (error) {
    return NextResponse.json({ error: 'Error adding comment' }, { status: 500 });
  }
} 