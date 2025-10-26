import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Find user by ID - try multiple ID formats for compatibility
    let targetUser;
    try {
      // Try ObjectId first
      targetUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    } catch (error) {
      // If ObjectId fails, try string ID
      targetUser = await db.collection('users').findOne({ 
        $or: [
          { user_id: id },
          { id: id },
          { auth_id: id }
        ]
      });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return safe user information (no sensitive data)
    const safeUser = {
      _id: targetUser._id,
      id: targetUser.id || targetUser.user_id || targetUser.auth_id,
      email: targetUser.email,
      name: targetUser.name,
      full_name: targetUser.full_name,
      role: targetUser.role,
      organization: targetUser.organization,
      avatar_url: targetUser.avatar_url,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt
    };

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
