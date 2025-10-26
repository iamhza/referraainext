/**
 * Individual invitation management API
 * Handles operations on specific invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { withOrgAuth } from '@/lib/auth/api-auth';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

// DELETE /api/org/invitations/[id] - Cancel a specific invitation
export const DELETE = withOrgAuth(async (user, request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const invitationId = params.id;

    if (!ObjectId.isValid(invitationId)) {
      return NextResponse.json(
        { error: 'Invalid invitation ID' }, 
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Delete invitation (only for this org)
    const result = await db.collection('organization_invitations').deleteOne({
      _id: new ObjectId(invitationId),
      orgId: user.orgContext.orgId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Invitation not found or already cancelled' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' }, 
      { status: 500 }
    );
  }
});

// GET /api/org/invitations/[id] - Get specific invitation details
export const GET = withOrgAuth(async (user, request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const invitationId = params.id;

    if (!ObjectId.isValid(invitationId)) {
      return NextResponse.json(
        { error: 'Invalid invitation ID' }, 
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get invitation
    const invitation = await db.collection('organization_invitations').findOne({
      _id: new ObjectId(invitationId),
      orgId: user.orgContext.orgId
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      invitation: {
        id: invitation._id.toString(),
        email: invitation.email,
        role: invitation.role,
        status: invitation.status || 'pending',
        invited_by: invitation.invitedBy,
        created_at: invitation.createdAt,
        expires_at: invitation.expiresAt,
        token: invitation.token,
        teamId: invitation.teamId
      }
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' }, 
      { status: 500 }
    );
  }
});
