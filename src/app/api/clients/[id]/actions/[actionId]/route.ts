import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// PATCH /api/clients/[id]/actions/[actionId] - Update action
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { actionId } = params;

    const client = await clientPromise;
    const db = client.db('referradb');
    const actionsCollection = db.collection('actions');

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Handle status updates
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'complete') {
        updateData.completedAt = new Date().toISOString();
      }
    }

    // Handle full action updates
    if (body.type) updateData.type = body.type;
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.urgency) updateData.urgency = body.urgency;
    if (body.data !== undefined) updateData.data = body.data;
    if (body.targetDate !== undefined) updateData.targetDate = body.targetDate;
    if (body.scheduledDate !== undefined) updateData.scheduledDate = body.scheduledDate;
    if (body.contextType) updateData.contextType = body.contextType;
    if (body.contextId !== undefined) updateData.contextId = body.contextId;
    if (body.providerId !== undefined) updateData.providerId = body.providerId;
    if (body.serviceType !== undefined) updateData.serviceType = body.serviceType;
    if (body.requiresROI !== undefined) updateData.requiresROI = body.requiresROI;

    const result = await actionsCollection.updateOne(
      { _id: new ObjectId(actionId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Fetch updated action
    const updatedAction = await actionsCollection.findOne({ _id: new ObjectId(actionId) });

    return NextResponse.json({ 
      success: true,
      action: {
        ...updatedAction,
        _id: updatedAction?._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/actions/[actionId] - Delete action
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionId } = params;

    const client = await clientPromise;
    const db = client.db('referradb');
    const actionsCollection = db.collection('actions');

    // Verify the action belongs to the user
    const action = await actionsCollection.findOne({ _id: new ObjectId(actionId) });
    
    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (action.createdBy !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this action' }, { status: 403 });
    }

    // Delete the action
    const result = await actionsCollection.deleteOne({ _id: new ObjectId(actionId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Action deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

