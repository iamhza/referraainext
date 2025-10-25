import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/org-members/current
 * 
 * Returns the current user's org_member ID
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    const orgMember = await db.collection('org_members').findOne({
      userId: user.id,
      isActive: true,
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      memberId: orgMember._id.toString(),
      organizationId: orgMember.organizationId,
      role: orgMember.role,
    });
  } catch (error) {
    console.error('Error fetching current member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


