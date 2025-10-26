/**
 * V1.1 Single Action API
 * 
 * PATCH /api/v1.1/actions/[id] - Update action (complete, add response, etc.)
 * DELETE /api/v1.1/actions/[id] - Delete action
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import type { ActionStatusV1_1 } from '@/types/actions-v1.1';

// PATCH /api/v1.1/actions/[id] - Update action
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    const client = await clientPromise;
    const db = client.db('referradb');

    // Fetch existing action
    const existing = await db.collection('actions').findOne({
      _id: new ObjectId(params.id)
    });

    if (!existing) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Security: Check organization access
    if (existing.organizationId !== user.organizationId && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get org_member ID
    const orgMember = await db.collection('org_members').findOne({
      userId: user.id,
      organizationId: user.organizationId
    });

    // Build update object
    const updateObj: any = {
      updatedAt: new Date()
    };

    // Update status
    if (updates.status) {
      updateObj.status = updates.status as ActionStatusV1_1;
      
      // If completing, record completed timestamp and user
      if (updates.status === 'COMPLETED') {
        updateObj.completedAt = new Date();
        updateObj.completedByMemberId = orgMember?._id.toString();
      }
    }

    // Update response payload (provider's response)
    if (updates.responsePayload) {
      updateObj.responsePayload = updates.responsePayload;
    }

    // Update priority
    if (updates.priority) {
      updateObj.priority = updates.priority;
    }

    // Update due date
    if (updates.dueAt) {
      updateObj.dueAt = new Date(updates.dueAt);
    }

    // Apply update
    await db.collection('actions').updateOne(
      { _id: existing._id },
      { $set: updateObj }
    );

    console.log('✅ Updated v1.1 action:', existing._id);

    // Fetch updated action
    const updated = await db.collection('actions').findOne({ _id: existing._id });

    return NextResponse.json({
      success: true,
      action: {
        ...updated,
        _id: updated._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/v1.1/actions/[id] - Delete action
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Fetch existing action
    const existing = await db.collection('actions').findOne({
      _id: new ObjectId(params.id)
    });

    if (!existing) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Security: Check organization access
    if (existing.organizationId !== user.organizationId && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Security: Only creator can delete (or admin)
    const orgMember = await db.collection('org_members').findOne({
      userId: user.id,
      organizationId: user.organizationId
    });

    if (existing.createdByMemberId !== orgMember?._id.toString() && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - only creator can delete' }, { status: 403 });
    }

    // Soft delete: Set status to CANCELLED
    await db.collection('actions').updateOne(
      { _id: existing._id },
      {
        $set: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Cancelled v1.1 action:', existing._id);

    return NextResponse.json({
      success: true,
      message: 'Action cancelled'
    });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

