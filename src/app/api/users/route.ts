import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

const COLLECTION = 'users';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Fetch users from MongoDB instead of Supabase
    const users = await db.collection(COLLECTION).find({}).toArray();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, email, role, organization, status } = await request.json();
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('referradb');
    const now = new Date().toISOString();
    const result = await db.collection(COLLECTION).insertOne({
      name,
      email,
      role,
      organization: organization || '',
      status: status || 'active',
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ user: { _id: result.insertedId, name, email, role, organization, status, createdAt: now, updatedAt: now } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id, ...update } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db('referradb');
    update.updatedAt = new Date().toISOString();
    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );
    if (!result || !result.value) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: result.value });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    if (!result || result.deletedCount === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
} 