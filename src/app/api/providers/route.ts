import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return a simple response from MongoDB users
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get all users with provider role for admin, or just current user for provider
    let providers: any[] = [];
    if (user.role === 'platform_admin') {
      providers = await db.collection('users').find({ role: 'provider' }).toArray();
    } else if (user.role === 'provider') {
      providers = await db.collection('users').find({ _id: new ObjectId(user.id) }).toArray();
    }

    return NextResponse.json({ providers });

  } catch (error) {
    console.error('Error in GET /api/providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 