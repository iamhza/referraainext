import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

/**
 * PATCH /api/issues/[id]/comments/[commentId]
 * Edit a comment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, commentId } = params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
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

    // Get the issue
    const issue = await db.collection('issues').findOne({
      _id: new ObjectId(id),
      organizationId: member.organizationId,
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Find the comment and check ownership
    const commentIndex = issue.comments.findIndex(
      (c: any) => c._id === commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const comment = issue.comments[commentIndex];

    // Check if user owns the comment
    if (comment.createdByMemberId !== member._id.toString()) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
    }

    // Update the comment
    const result = await db.collection('issues').updateOne(
      {
        _id: new ObjectId(id),
        'comments._id': commentId,
      },
      {
        $set: {
          [`comments.${commentIndex}.content`]: content.trim(),
          [`comments.${commentIndex}.updatedAt`]: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error editing comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/issues/[id]/comments/[commentId]
 * Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, commentId } = params;

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

    // Get the issue
    const issue = await db.collection('issues').findOne({
      _id: new ObjectId(id),
      organizationId: member.organizationId,
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Find the comment and check ownership
    const comment = issue.comments.find((c: any) => c._id === commentId);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user owns the comment
    if (comment.createdByMemberId !== member._id.toString()) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    // Remove the comment and all its replies
    const result = await db.collection('issues').updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          comments: {
            $or: [
              { _id: commentId }, // The comment itself
              { parentCommentId: commentId }, // Direct replies
            ],
          },
        },
      }
    );

    // Recursively remove nested replies
    let hasMoreReplies = true;
    while (hasMoreReplies) {
      const updatedIssue = await db.collection('issues').findOne({ _id: new ObjectId(id) });
      const repliesToRemove = updatedIssue?.comments
        ?.filter((c: any) => c.parentCommentId && !updatedIssue.comments.some((parent: any) => parent._id === c.parentCommentId))
        .map((c: any) => c._id);

      if (repliesToRemove && repliesToRemove.length > 0) {
        await db.collection('issues').updateOne(
          { _id: new ObjectId(id) },
          {
            $pull: {
              comments: { _id: { $in: repliesToRemove } },
            },
          }
        );
      } else {
        hasMoreReplies = false;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


