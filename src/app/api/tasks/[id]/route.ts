import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(
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

    const memberId = member._id.toString();

    // Build update doc
    const updateDoc: any = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { error: 'Task title cannot be empty' },
          { status: 400 }
        );
      }
      updateDoc.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateDoc.description = body.description?.trim() || null;
    }

    if (body.status !== undefined) {
      if (!['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateDoc.status = body.status;
      
      // If marking as done, record completion
      if (body.status === 'DONE') {
        updateDoc.completedAt = new Date();
        updateDoc.completedByMemberId = memberId;
      }
    }

    if (body.assigneeMemberId !== undefined) {
      updateDoc.assigneeMemberId = body.assigneeMemberId;
    }

    if (body.dueDate !== undefined) {
      updateDoc.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    // Update task (only if user is owner or assignee)
    const result = await db.collection('tasks').updateOne(
      {
        _id: new ObjectId(id),
        organizationId: member.organizationId,
        $or: [
          { ownerMemberId: memberId },
          { assigneeMemberId: memberId },
        ],
      },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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

    const memberId = member._id.toString();

    // Delete task (only if user is owner)
    const result = await db.collection('tasks').deleteOne({
      _id: new ObjectId(id),
      organizationId: member.organizationId,
      ownerMemberId: memberId, // Only owner can delete
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    // Remove task from any linked issues
    await db.collection('issues').updateMany(
      { relatedTaskIds: id },
      { $pull: { relatedTaskIds: id } }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

