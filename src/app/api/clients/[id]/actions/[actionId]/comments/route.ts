import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { ActionComment } from '@/types/actions';
import { createSecureActionComment, getSecureActionComments, deleteSecureActionComment } from '@/lib/secure-action-comments';

// GET /api/clients/[clientId]/actions/[actionId]/comments - Get comments for action
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: clientId, actionId } = params;
    if (!clientId || !actionId) {
      return NextResponse.json(
        { error: 'Client ID and Action ID are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify action exists and belongs to client
    const action = await db.collection('actions').findOne({
      _id: new ObjectId(actionId),
      clientId
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Get secure comments for this action
    const secureComments = await getSecureActionComments(actionId, user.id, user.role);

    return NextResponse.json({ comments: secureComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[clientId]/actions/[actionId]/comments - Add comment to action
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: clientId, actionId } = params;
    if (!clientId || !actionId) {
      return NextResponse.json(
        { error: 'Client ID and Action ID are required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify action exists and belongs to client
    const action = await db.collection('actions').findOne({
      _id: new ObjectId(actionId),
      clientId
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Create secure encrypted comment
    const result = await createSecureActionComment({
      actionId,
      clientId,
      referralId: action.contextType === 'referral' ? action.contextId : undefined,
      parentId: parentId || undefined,
      authorId: user.id,
      authorName: user.name || user.email,
      authorType: user.role as 'case_manager' | 'provider',
      content: content.trim()
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to create secure comment' }, { status: 500 });
    }

    // Create timeline entry for comment (no PHI in timeline)
    await db.collection('timeline_events').insertOne({
      clientId,
      type: 'action_comment_added',
      description: `Comment added to ${action.title}`,
      createdBy: user.id,
      createdByName: user.name || user.email,
      createdByRole: user.role,
      createdAt: new Date().toISOString(),
      metadata: {
        actionId: new ObjectId(actionId),
        actionType: action.type,
        actionTitle: action.title,
        secureCommentId: result.commentId.toString(),
        contentLength: content.trim().length // Length only, not content
      }
    });

    // Get updated action with secure comments
    const secureComments = await getSecureActionComments(actionId, user.id, user.role);
    
    // Return action with decrypted comments for this user
    const actionWithComments = {
      ...action,
      comments: secureComments,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(actionWithComments);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[clientId]/actions/[actionId]/comments - Delete comment from action
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: clientId, actionId } = params;
    if (!clientId || !actionId) {
      return NextResponse.json(
        { error: 'Client ID and Action ID are required' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const commentId = url.searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify action exists and belongs to client
    const action = await db.collection('actions').findOne({
      _id: new ObjectId(actionId),
      clientId
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Delete the secure comment
    const result = await deleteSecureActionComment(commentId, user.id, user.role);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: result.statusCode || 500 });
    }

    // Create timeline entry for comment deletion (no PHI in timeline)
    await db.collection('timeline_events').insertOne({
      clientId,
      type: 'action_comment_deleted',
      description: `Comment deleted from ${action.title}`,
      createdBy: user.id,
      createdByName: user.name || user.email,
      createdByRole: user.role,
      createdAt: new Date().toISOString(),
      metadata: {
        actionId: new ObjectId(actionId),
        actionType: action.type,
        actionTitle: action.title,
        deletedCommentId: commentId
      }
    });

    // Get updated action with remaining secure comments
    const secureComments = await getSecureActionComments(actionId, user.id, user.role);
    
    // Return action with updated comments for this user
    const actionWithComments = {
      ...action,
      comments: secureComments,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(actionWithComments);
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
