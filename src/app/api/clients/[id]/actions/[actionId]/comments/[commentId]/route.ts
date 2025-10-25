import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string; commentId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');
    const actionsCollection = db.collection('actions');

    // Update the specific comment in the comments array
    const result = await actionsCollection.updateOne(
      { 
        _id: new ObjectId(params.actionId),
        'comments._id': new ObjectId(params.commentId),
        'comments.createdBy': user.id // Ensure user owns the comment
      },
      { 
        $set: { 
          'comments.$.content': content.trim(),
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string; commentId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');
    const actionsCollection = db.collection('actions');

    // First check if the user owns the comment
    const action = await actionsCollection.findOne({
      _id: new ObjectId(params.actionId)
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const comment = action.comments?.find((c: any) => c._id.toString() === params.commentId);
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.createdBy !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    // Remove the comment from the comments array
    const result = await actionsCollection.updateOne(
      { _id: new ObjectId(params.actionId) },
      { 
        $pull: { comments: { _id: new ObjectId(params.commentId) } } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

