import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * POST /api/issues/[id]/comments
 * Add a new comment to an issue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { content, parentCommentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get user's member record
    const member = await db.collection('org_members').findOne({
      userId: user.id,
      isActive: true,
    });

    if (!member) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    // Generate a unique ID for the comment
    const commentId = new ObjectId().toString();

    // Create new comment
    const newComment: any = {
      _id: commentId,
      content: content.trim(),
      createdByMemberId: member._id.toString(),
      createdAt: new Date(),
    };

    // Add parentCommentId if this is a reply
    if (parentCommentId) {
      newComment.parentCommentId = parentCommentId;
    }

    // Add comment to issue
    const result = await db.collection('issues').updateOne(
      {
        _id: new ObjectId(id),
        organizationId: member.organizationId,
      },
      {
        $push: { comments: newComment }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

