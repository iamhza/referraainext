import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * PATCH /api/authorizations/[id]
 * Update an authorization
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

    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get user's organization
    const orgMember = await db.collection('org_members').findOne({ userId: user.id });
    if (!orgMember || !orgMember.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }
    
    const organizationId = orgMember.organizationId.toString();
    
    // Parse request body
    const body = await request.json();
    const { status, approvalNumber, startDate, endDate, units, unitType, fundingSource, notes } = body;
    
    // Get existing authorization
    const existingAuth = await db.collection('authorizations').findOne({
      _id: new ObjectId(params.id),
      organizationId: organizationId,
    });
    
    if (!existingAuth) {
      return NextResponse.json(
        { error: 'Authorization not found' },
        { status: 404 }
      );
    }
    
    // Build update object
    const updateFields: any = {
      updatedAt: new Date(),
    };
    
    if (status !== undefined) {
      updateFields.status = status;
      if (status === 'SUBMITTED' && !existingAuth.submittedAt) {
        updateFields.submittedAt = new Date();
      }
      if (status === 'APPROVED' && !existingAuth.approvalDate) {
        updateFields.approvalDate = new Date();
      }
    }
    
    if (approvalNumber !== undefined) updateFields.approvalNumber = approvalNumber;
    if (startDate !== undefined) updateFields.startDate = new Date(startDate);
    if (endDate !== undefined) updateFields.endDate = endDate ? new Date(endDate) : null;
    if (units !== undefined) updateFields.units = parseInt(units);
    if (unitType !== undefined) updateFields.unitType = unitType;
    if (fundingSource !== undefined) updateFields.fundingSource = fundingSource;
    if (notes !== undefined) updateFields.notes = notes;
    
    // Update authorization
    await db.collection('authorizations').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateFields }
    );
    
    // Return updated authorization
    const updatedAuth = await db.collection('authorizations').findOne({
      _id: new ObjectId(params.id),
    });
    
    return NextResponse.json({
      authorization: {
        ...updatedAuth,
        _id: updatedAuth!._id.toString(),
      },
    });
    
  } catch (error) {
    console.error('Error updating authorization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/authorizations/[id]
 * Delete an authorization (case managers can delete any status)
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

    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get user's organization and role
    const orgMember = await db.collection('org_members').findOne({ 
      userId: user.id,
      isActive: true,
    });
    
    if (!orgMember || !orgMember.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }
    
    // Check if user is case manager, supervisor, or org admin
    const allowedRoles = ['CASE_MANAGER', 'SUPERVISOR', 'ORG_ADMIN'];
    if (!allowedRoles.includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const organizationId = orgMember.organizationId.toString();
    
    // Get existing authorization
    const existingAuth = await db.collection('authorizations').findOne({
      _id: new ObjectId(params.id),
      organizationId: organizationId,
    });
    
    if (!existingAuth) {
      return NextResponse.json(
        { error: 'Authorization not found' },
        { status: 404 }
      );
    }
    
    // Case managers can delete authorizations regardless of status
    // (Per user request: "regardless of status they are in")
    
    // Delete authorization
    const result = await db.collection('authorizations').deleteOne({
      _id: new ObjectId(params.id),
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete authorization' },
        { status: 500 }
      );
    }
    
    // TODO: Log deletion for audit trail
    // await db.collection('audit_log').insertOne({
    //   action: 'AUTHORIZATION_DELETED',
    //   userId: user.id,
    //   organizationId,
    //   resourceId: params.id,
    //   timestamp: new Date(),
    // });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting authorization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

