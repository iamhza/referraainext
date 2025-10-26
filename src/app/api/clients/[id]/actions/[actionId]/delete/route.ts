import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

// DELETE /api/clients/[id]/actions/[actionId]/delete - Delete a specific action
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only case managers can delete actions
    if (user.role !== 'case_manager' && user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Only case managers can delete actions' }, { status: 403 });
    }

    const { id: clientId, actionId } = params;
    if (!clientId || !actionId) {
      return NextResponse.json({ error: 'Client ID and Action ID are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify the action exists and belongs to this client
    const action = await db.collection('actions').findOne({
      _id: new ObjectId(actionId),
      clientId
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Additional permission check: case managers can only delete actions they created or for their clients
    if (user.role === 'case_manager') {
      // Check if this is the case manager's client
      const clientDoc = await db.collection('clients').findOne({
        _id: new ObjectId(clientId),
        caseManagerId: user.id
      });

      if (!clientDoc) {
        return NextResponse.json({ error: 'You can only delete actions for your assigned clients' }, { status: 403 });
      }
    }

    // Delete the action
    const deleteResult = await db.collection('actions').deleteOne({
      _id: new ObjectId(actionId)
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
    }

    // Create timeline entry for action deletion
    await db.collection('timeline_events').insertOne({
      clientId,
      contextType: action.contextType,
      contextId: action.contextId,
      providerId: action.providerId,
      type: 'action_deleted',
      description: `Action "${action.title}" was deleted`,
      createdBy: user.id,
      createdByName: user.email,
      createdByRole: user.role,
      createdAt: new Date().toISOString(),
      metadata: {
        deletedActionId: actionId,
        deletedActionType: action.type,
        deletedActionTitle: action.title,
        originalCreatedBy: action.createdBy,
        originalCreatedAt: action.createdAt
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Action deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { error: 'Failed to delete action' },
      { status: 500 }
    );
  }
}
