import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
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

    const comment = {
      _id: new ObjectId(),
      content: content.trim(),
      createdBy: user.id,
      createdByName: user.name || user.email || 'Unknown',
      createdByRole: user.role || 'case_manager',
      createdAt: new Date().toISOString(),
    };

    const result = await actionsCollection.updateOne(
      { _id: new ObjectId(params.actionId) },
      { 
        $push: { comments: comment } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      comment: {
        ...comment,
        _id: comment._id.toString()
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
