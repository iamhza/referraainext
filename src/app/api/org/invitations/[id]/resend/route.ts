/**
 * Resend invitation API
 * Handles resending invitation emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { withOrgAuth } from '@/lib/api-auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createOrgAuditLog } from '@/lib/organization';

// POST /api/org/invitations/[id]/resend - Resend an invitation
export const POST = withOrgAuth(async (user, request: NextRequest, { params }: { params: { id: string } }) => {
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

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only resend pending invitations' }, 
        { status: 400 }
      );
    }

    // Generate new expiration date (7 days from now)
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Update invitation with new expiration
    await db.collection('organization_invitations').updateOne(
      { _id: new ObjectId(invitationId) },
      { 
        $set: { 
          expiresAt: newExpiresAt,
          updatedAt: new Date()
        },
        $inc: { resendCount: 1 }
      }
    );

    // TODO: Send email notification
    // await sendInvitationEmail(invitation.email, invitation.token, user.orgContext.organization.name);

    // Create audit log
    await createOrgAuditLog(
      user.orgContext.orgId,
      user.id,
      'invitation_resent',
      'invitation',
      invitationId,
      undefined,
      { email: invitation.email, role: invitation.role },
      { resendBy: user.id }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Invitation resent successfully',
      expiresAt: newExpiresAt
    });

  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation' }, 
      { status: 500 }
    );
  }
});
