import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const COLLECTION = 'clients';

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
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db('referradb');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (id) {
    try {
      // Validate ObjectId format
      const objectId = new ObjectId(id);
      const clientDoc = await db.collection(COLLECTION).findOne({ _id: objectId });
      if (!clientDoc) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      return NextResponse.json({ client: clientDoc });
    } catch (error) {
      console.error('Invalid client ID format:', error);
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }
  }
  
  const clients = await db.collection(COLLECTION).find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  if (!data.firstName || !data.lastName || !data.dateOfBirth) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db('referradb');
  const now = new Date().toISOString();
  // Calculate profile completion
  const profileComplete = !!(
    data.firstName && 
    data.lastName &&
    data.phone && 
    data.email && 
    data.address && 
    data.city &&
    data.state &&
    data.county
  );

  const result = await db.collection(COLLECTION).insertOne({
    ...data,
    profileComplete,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ client: { _id: result.insertedId, ...data, createdAt: now, updatedAt: now } }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, ...update } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing client id' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db('referradb');
  update.updatedAt = new Date().toISOString();
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: 'after' }
  );
  if (!result || !result.value) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  return NextResponse.json({ client: result.value });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing client id' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db('referradb');
  const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  if (!result || result.deletedCount === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  return NextResponse.json({ success: true });
} 