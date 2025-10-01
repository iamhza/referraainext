import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/clients/[clientId]/actions/[actionId]/complete - Mark action as complete
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

    if (action.status === 'complete') {
      return NextResponse.json({ error: 'Action is already complete' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update action status
    const updateResult = await db.collection('actions').updateOne(
      { _id: new ObjectId(actionId) },
      {
        $set: {
          status: 'complete',
          completedAt: now,
          updatedAt: now
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
    }

    // Create timeline entry
    await db.collection('timeline_events').insertOne({
      clientId,
      type: 'action_completed',
      description: `${action.title} completed`,
      createdBy: user.id,
      createdByName: user.name || user.email,
      createdByRole: user.role,
      createdAt: now,
      metadata: {
        actionId: new ObjectId(actionId),
        actionType: action.type,
        actionTitle: action.title,
        completedBy: user.id,
        completedByName: user.name || user.email
      }
    });

    // Return updated action
    const updatedAction = await db.collection('actions').findOne({
      _id: new ObjectId(actionId)
    });

    return NextResponse.json(updatedAction);
  } catch (error) {
    console.error('Error completing action:', error);
    return NextResponse.json(
      { error: 'Failed to complete action' },
      { status: 500 }
    );
  }
}
