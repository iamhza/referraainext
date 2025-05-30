import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const COLLECTION = 'providers';

async function getAdminSession() {
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
  if (!session || session.user.user_metadata?.role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
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
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userRole = session.user.user_metadata?.role;
  const userId = session.user.id;
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    if (userRole === 'admin') {
      // Admin: return all providers
      const providers = await db.collection(COLLECTION).find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ providers });
    } else if (userRole === 'provider') {
      // Provider: return only their own profile
      const provider = await db.collection(COLLECTION).findOne({ userId });
      if (!provider) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      return NextResponse.json({ provider });
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch provider profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, contact, status } = await request.json();
    if (!name || !contact) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('referradb');
    const now = new Date().toISOString();
    const result = await db.collection(COLLECTION).insertOne({
      name,
      contact,
      status: status || 'active',
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ provider: { _id: result.insertedId, name, contact, status, createdAt: now, updatedAt: now } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userRole = session.user.user_metadata?.role;
  const userId = session.user.id;
  try {
    const update = await request.json();
    const client = await clientPromise;
    const db = client.db('referradb');
    if (userRole === 'admin') {
      // Admin: update any provider by id
      const { id, ...rest } = update;
      if (!id) return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
      rest.updatedAt = new Date().toISOString();
      const result = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: rest },
        { returnDocument: 'after' }
      );
      if (!result || !result.value) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      return NextResponse.json({ provider: result.value });
    } else if (userRole === 'provider') {
      // Provider: update their own profile by userId
      update.updatedAt = new Date().toISOString();
      // Remove userId and _id from update object to avoid overwriting
      if ('userId' in update) delete update.userId;
      if ('_id' in update) delete update._id;
      console.log('PATCH /api/providers for provider', userId, update);
      const result = await db.collection(COLLECTION).findOneAndUpdate(
        { userId },
        { $set: update },
        { upsert: true, returnDocument: 'after' }
      );
      let provider = result && result.value;
      if (!provider) {
        // If upserted, fetch the document
        provider = await db.collection(COLLECTION).findOne({ userId });
      }
      if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      return NextResponse.json({ provider });
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  } catch (error) {
    console.error('PATCH /api/providers error:', error);
    return NextResponse.json({ error: 'Failed to update provider profile' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    if (!result || result.deletedCount === 0) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}

// Example provider document in MongoDB:
// {
//   userId: '...',
//   ...other fields,
//   type: 'unit' | 'capacity',
//   availability: [
//     { day: 'Monday', start: '08:00', end: '18:00', maxClients: 3 },
//     ...
//   ],
//   capacity: {
//     totalBeds: 10,
//     occupiedBeds: 8,
//     availableBeds: 2,
//     waitlist: ['clientId1', 'clientId2']
//   }
// }
//
// PATCH and GET handlers already upsert and return all fields, so no further code changes are needed for basic support.
// You may want to validate these fields in production for data integrity. 