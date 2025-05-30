import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// GET: Fetch all comments for a client
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('referradb');
    const clientDoc = await db.collection('clients').findOne({ _id: new ObjectId(clientId) });
    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, comments: clientDoc.comments || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
  }
}

// POST: Add a new comment to a client
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { clientId, text } = await request.json();
    if (!clientId || !text || typeof text !== 'string') {
      return NextResponse.json({ error: 'clientId and comment text required' }, { status: 400 });
    }
    const comment = {
      authorId: session.user.id,
      authorRole: session.user.user_metadata?.role || 'unknown',
      text,
      createdAt: new Date().toISOString(),
    };
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId) },
      { $push: { comments: comment } } as any
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, comment });
  } catch (error) {
    return NextResponse.json({ error: 'Error adding comment' }, { status: 500 });
  }
} 