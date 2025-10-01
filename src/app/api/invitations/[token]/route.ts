/**
 * Invitation token validation API
 * Handles invitation verification and details
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Fetch invitation from MongoDB
    const invitation = await db.collection('organization_invitations').findOne({
      token: token
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    const isExpired = now > expiresAt;

    // Check if invitation is already accepted
    const isUsed = invitation.acceptedAt !== null;

    // Fetch organization details
    let organization = null;
    if (invitation.orgId) {
      organization = await db.collection('organizations').findOne({
        _id: new ObjectId(invitation.orgId)
      });
    }

    // Fetch team details if team_id exists
    let team = null;
    if (invitation.teamId) {
      team = await db.collection('teams').findOne({
        _id: new ObjectId(invitation.teamId)
      });
    }

    // Fetch inviter details
    let invitedBy = {
      name: 'System Administrator',
      email: 'admin@referra.com'
    };
    
    if (invitation.invitedBy) {
      const inviter = await db.collection('users').findOne({
        _id: new ObjectId(invitation.invitedBy)
      });
      if (inviter) {
        invitedBy = {
          name: inviter.name || inviter.full_name || 'Unknown User',
          email: inviter.email
        };
      }
    }

    const invitationData = {
      id: invitation._id.toString(),
      email: invitation.email,
      role: invitation.role,
      organization: organization ? {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug || organization.name.toLowerCase().replace(/\s+/g, '')
      } : null,
      team: team ? {
        id: team._id.toString(),
        name: team.name
      } : null,
      invitedBy: invitedBy,
      expiresAt: invitation.expiresAt,
      isExpired,
      isUsed
    };

    return NextResponse.json({ invitation: invitationData });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}