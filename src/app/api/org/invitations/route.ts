/**
 * Organization invitations API
 * Handles invitation management for organizations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { 
  createInvitation, 
  generateInviteLink,
  getOrganizationInvitations,
  cancelInvitation,
  resendInvitation
} from '@/lib/invitations/utils';
import { sendInvitationEmail } from '@/lib/shared/email';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'supervisor', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { success, invitations, error } = await getOrganizationInvitations(user.org_id);
    
    if (!success) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      invitations,
      total: invitations?.length || 0
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'supervisor', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, role, team_id, send_email = true } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Validate role permissions
    const allowedRoles = user.role === 'platform_admin' 
      ? ['org_admin', 'supervisor', 'case_manager']
      : user.role === 'org_admin'
      ? ['supervisor', 'case_manager']
      : ['case_manager']; // supervisors can only invite case managers

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role for your permission level' },
        { status: 403 }
      );
    }

    // Create invitation
    const { success, invitation, error } = await createInvitation({
      email,
      role,
      org_id: user.org_id,
      team_id: team_id || undefined,
      inviter_id: user.id,
      inviter_name: user.name || user.email || 'Unknown'
    });

    if (!success || !invitation) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Send email if requested
    let emailResult = null;
    if (send_email) {
      const inviteLink = generateInviteLink(invitation.token);
      
      emailResult = await sendInvitationEmail({
        email: invitation.email,
        inviterName: invitation.inviter_name,
        organizationName: user.organization?.name || 'Your Organization',
        role: invitation.role,
        inviteLink
      });

      if (!emailResult.success) {
        console.warn('Failed to send invitation email:', emailResult.error);
        // Don't fail the entire operation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation._id?.toString(),
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        invite_link: generateInviteLink(invitation.token)
      },
      email_sent: emailResult?.success || false,
      email_error: emailResult?.error
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'supervisor', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { invitation_id, action } = await request.json();

    if (!invitation_id || !action) {
      return NextResponse.json(
        { error: 'Invitation ID and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'cancel': {
        const { success, error } = await cancelInvitation(invitation_id, user.id);
        
        if (!success) {
          return NextResponse.json({ error }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Invitation cancelled successfully'
        });
      }

      case 'resend': {
        const { success, newToken, error } = await resendInvitation(invitation_id);
        
        if (!success || !newToken) {
          return NextResponse.json({ error }, { status: 400 });
        }

        // Optionally send new email here
        const inviteLink = generateInviteLink(newToken);

        return NextResponse.json({
          success: true,
          message: 'Invitation resent successfully',
          new_invite_link: inviteLink
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "cancel" or "resend"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to update invitation' },
      { status: 500 }
    );
  }
}