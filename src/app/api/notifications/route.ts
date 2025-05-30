import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const COLLECTION = 'notifications';

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

// GET: List notifications for the authenticated user
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const userId = session.user.id;
    const notifications = await db.collection(COLLECTION)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ notifications });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST: Create a notification
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { userId, type, content } = await request.json();
    if (!userId || !type || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db('referradb');
    const notification = {
      userId,
      type,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const result = await db.collection(COLLECTION).insertOne(notification);
    return NextResponse.json({ notification: { ...notification, _id: result.insertedId } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PATCH: Mark notification as read
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: { read: true } },
      { returnDocument: 'after' }
    );
    if (!result || !result.value) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    return NextResponse.json({ notification: result.value });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE: Delete a notification
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id), userId: session.user.id });
    if (!result || result.deletedCount === 0) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
} 