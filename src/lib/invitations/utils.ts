/**
 * Invitation management utilities
 * Handles invitation token generation, validation, and database operations
 */

import crypto from 'crypto';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

interface CreateInvitationProps {
  email: string;
  role: string;
  org_id: string;
  team_id?: string;
  inviter_id: string;
  inviter_name: string;
  expires_at?: Date;
}

interface Invitation {
  _id?: ObjectId;
  email: string;
  role: string;
  org_id: string;
  team_id?: string;
  inviter_id: string;
  inviter_name: string;
  token: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  completed_at?: string;
  user_id?: string;
}

export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateInviteLink(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/invite/${token}`;
}

export async function createInvitation({
  email,
  role,
  org_id,
  team_id,
  inviter_id,
  inviter_name,
  expires_at
}: CreateInvitationProps): Promise<{ success: boolean; invitation?: Invitation; error?: string }> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    // Check if there's already a pending invitation for this email
    const existingInvitation = await db.collection('invitations').findOne({
      email,
      org_id,
      status: 'pending'
    });

    if (existingInvitation) {
      return {
        success: false,
        error: 'An invitation is already pending for this email address'
      };
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email address already exists'
      };
    }

    const token = generateInvitationToken();
    const expiresAt = expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation: Invitation = {
      email,
      role,
      org_id,
      team_id,
      inviter_id,
      inviter_name,
      token,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };

    const result = await db.collection('invitations').insertOne(invitation);
    
    return {
      success: true,
      invitation: {
        ...invitation,
        _id: result.insertedId
      }
    };

  } catch (error) {
    console.error('Error creating invitation:', error);
    return {
      success: false,
      error: 'Failed to create invitation'
    };
  }
}

export async function validateInvitationToken(token: string): Promise<{
  success: boolean;
  invitation?: Invitation;
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const invitation = await db.collection('invitations').findOne({
      token,
      status: 'pending'
    });

    if (!invitation) {
      return {
        success: false,
        error: 'Invalid or expired invitation'
      };
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expires_at)) {
      // Mark as expired
      await db.collection('invitations').updateOne(
        { _id: invitation._id },
        { $set: { status: 'expired' } }
      );

      return {
        success: false,
        error: 'This invitation has expired'
      };
    }

    return {
      success: true,
      invitation: invitation as Invitation
    };

  } catch (error) {
    console.error('Error validating invitation token:', error);
    return {
      success: false,
      error: 'Failed to validate invitation'
    };
  }
}

export async function completeInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const result = await db.collection('invitations').updateOne(
      { token, status: 'pending' },
      {
        $set: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          user_id: userId
        }
      }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        error: 'Invitation not found or already completed'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error completing invitation:', error);
    return {
      success: false,
      error: 'Failed to complete invitation'
    };
  }
}

export async function cancelInvitation(
  invitationId: string,
  cancelledBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const result = await db.collection('invitations').updateOne(
      { _id: new ObjectId(invitationId), status: 'pending' },
      {
        $set: {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy
        }
      }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        error: 'Invitation not found or already processed'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return {
      success: false,
      error: 'Failed to cancel invitation'
    };
  }
}

export async function getOrganizationInvitations(orgId: string): Promise<{
  success: boolean;
  invitations?: Invitation[];
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const invitations = await db.collection('invitations')
      .find({ org_id: orgId })
      .sort({ created_at: -1 })
      .toArray();

    return {
      success: true,
      invitations: invitations as Invitation[]
    };

  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    return {
      success: false,
      error: 'Failed to fetch invitations'
    };
  }
}

export async function resendInvitation(
  invitationId: string,
  newExpiryDate?: Date
): Promise<{ success: boolean; newToken?: string; error?: string }> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const newToken = generateInvitationToken();
    const expiresAt = newExpiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await db.collection('invitations').updateOne(
      { _id: new ObjectId(invitationId), status: 'pending' },
      {
        $set: {
          token: newToken,
          expires_at: expiresAt.toISOString(),
          resent_at: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        error: 'Invitation not found or already processed'
      };
    }

    return {
      success: true,
      newToken
    };

  } catch (error) {
    console.error('Error resending invitation:', error);
    return {
      success: false,
      error: 'Failed to resend invitation'
    };
  }
}
