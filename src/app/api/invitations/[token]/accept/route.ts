/**
 * Invitation acceptance API
 * Handles user account creation from invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { fullName, password } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    if (!fullName || !password) {
      return NextResponse.json(
        { error: 'Full name and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify invitation token
    const invitation = await db.collection('organization_invitations').findOne({
      token: token
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation is already used
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'Invitation has already been used' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      email: invitation.email.toLowerCase()
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Get default permissions for role
    const getDefaultPermissions = (role: string): string[] => {
      switch (role) {
        case 'org_admin':
          return ['manage_users', 'manage_teams', 'view_analytics', 'manage_organization'];
        case 'supervisor':
          return ['view_team_analytics', 'assign_cases', 'manage_team_members'];
        case 'case_manager':
          return ['manage_clients', 'create_referrals', 'view_cases'];
        case 'provider':
          return ['view_referrals', 'update_services', 'manage_profile'];
        default:
          return [];
      }
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account
    const userDoc = {
      email: invitation.email.toLowerCase(),
      name: fullName,
      full_name: fullName,
      role: invitation.role,
      org_id: invitation.orgId,
      team_id: invitation.teamId || null,
      password_hash: hashedPassword,
      permissions: getDefaultPermissions(invitation.role),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Track invitation acceptance
      invited_by: invitation.invitedBy,
      invitation_accepted_at: new Date().toISOString()
    };

    // Insert user
    const userResult = await db.collection('users').insertOne(userDoc);

    if (!userResult.insertedId) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await db.collection('organization_invitations').updateOne(
      { _id: invitation._id },
      {
        $set: {
          acceptedAt: new Date().toISOString(),
          acceptedBy: userResult.insertedId.toString(),
          status: 'accepted'
        }
      }
    );

    // Create audit log entry
    await db.collection('audit_logs').insertOne({
      org_id: invitation.orgId,
      user_id: userResult.insertedId.toString(),
      action: 'user_created_from_invitation',
      entity_type: 'user',
      entity_id: userResult.insertedId.toString(),
      old_values: {},
      new_values: {
        email: invitation.email,
        role: invitation.role,
        team_id: invitation.teamId
      },
      metadata: {
        invitation_id: invitation._id.toString(),
        invited_by: invitation.invitedBy
      },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userResult.insertedId.toString(),
        email: invitation.email,
        name: fullName,
        role: invitation.role,
        org_id: invitation.orgId
      }
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}