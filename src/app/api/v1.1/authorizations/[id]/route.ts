/**
 * V1.1 Single Authorization API
 * 
 * PATCH /api/v1.1/authorizations/[id] - Update authorization (submit, approve, etc.)
 * DELETE /api/v1.1/authorizations/[id] - Delete authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

type AuthorizationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED';

// PATCH /api/v1.1/authorizations/[id] - Update authorization
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

    // Fetch existing authorization
    const existing = await db.collection('authorizations').findOne({
      _id: new ObjectId(params.id)
    });

    if (!existing) {
      return NextResponse.json({ error: 'Authorization not found' }, { status: 404 });
    }

    // Security: Check organization access
    if (existing.organizationId !== user.organizationId && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get org_member
    const orgMember = await db.collection('org_members').findOne({
      userId: user.id,
      organizationId: user.organizationId
    });

    // Build update object
    const updateObj: any = {
      updatedAt: new Date()
    };

    // Update basic fields
    if (updates.startDate) updateObj.startDate = new Date(updates.startDate);
    if (updates.endDate) updateObj.endDate = new Date(updates.endDate);
    if (updates.units !== undefined) updateObj.units = updates.units;
    if (updates.unitType) updateObj.unitType = updates.unitType;
    if (updates.approvalNumber) updateObj.approvalNumber = updates.approvalNumber;

    // Handle status transitions
    if (updates.status) {
      const newStatus = updates.status as AuthorizationStatus;
      updateObj.status = newStatus;

      // DRAFT → SUBMITTED
      if (newStatus === 'SUBMITTED' && existing.status === 'DRAFT') {
        updateObj.submittedAt = new Date();
        updateObj.submittedBy = orgMember?._id.toString();
      }

      // SUBMITTED → APPROVED
      if (newStatus === 'APPROVED' && existing.status === 'SUBMITTED') {
        updateObj.approvalDate = new Date();
        updateObj.approvedBy = orgMember?._id.toString();
      }

      // SUBMITTED → DENIED
      if (newStatus === 'DENIED' && existing.status === 'SUBMITTED') {
        updateObj.denialDate = new Date();
        updateObj.deniedBy = orgMember?._id.toString();
        updateObj.denialReason = updates.denialReason || null;
      }
    }

    // Apply update
    await db.collection('authorizations').updateOne(
      { _id: existing._id },
      { $set: updateObj }
    );

    console.log('✅ Updated authorization:', existing._id);

    // Fetch updated authorization
    const updated = await db.collection('authorizations').findOne({ _id: existing._id });

    return NextResponse.json({
      success: true,
      authorization: {
        ...updated,
        _id: updated._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating authorization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/v1.1/authorizations/[id] - Delete authorization
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

    // Fetch existing authorization
    const existing = await db.collection('authorizations').findOne({
      _id: new ObjectId(params.id)
    });

    if (!existing) {
      return NextResponse.json({ error: 'Authorization not found' }, { status: 404 });
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

    if (existing.createdBy !== orgMember?._id.toString() && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - only creator can delete' }, { status: 403 });
    }

    // Hard delete (only allowed for DRAFT)
    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Cannot delete submitted authorization' }, { status: 403 });
    }

    await db.collection('authorizations').deleteOne({ _id: existing._id });

    console.log('✅ Deleted authorization:', existing._id);

    return NextResponse.json({
      success: true,
      message: 'Authorization deleted'
    });
  } catch (error) {
    console.error('Error deleting authorization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

