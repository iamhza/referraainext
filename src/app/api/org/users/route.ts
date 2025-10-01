/**
 * Organization user management API
 * Handles creating, updating, and managing users within an organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { createInvitation, generateInviteLink } from '@/lib/invitations';
import { sendInvitationEmail, sendWelcomeEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const query = user.role === 'platform_admin' ? {} : { org_id: user.org_id };
    const users = await db.collection('users').find(query).toArray();

    const transformedUsers = users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.full_name || u.name || u.email,
      role: u.role,
      org_id: u.org_id,
      team_id: u.team_id,
      is_active: u.is_active !== false,
      created_at: u.created_at || u.createdAt,
      updated_at: u.updated_at || u.updatedAt,
      last_sign_in_at: u.last_sign_in_at
    }));

    return NextResponse.json({ 
      users: transformedUsers, 
      total: transformedUsers.length 
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, role, team_id, full_name, password, send_invitation } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' }, 
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' }, 
        { status: 409 }
      );
    }

    // Validate role permissions
    const allowedRoles = user.role === 'platform_admin' 
      ? ['org_admin', 'supervisor', 'case_manager']
      : ['supervisor', 'case_manager']; // org_admin can't create other org_admins

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role for your permission level' }, 
        { status: 403 }
      );
    }

    // Create new user
    const newUser = {
      email,
      role,
      full_name: full_name || email.split('@')[0],
      name: full_name || email.split('@')[0],
      org_id: user.org_id,
      team_id: team_id || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id,
      // Hash password if provided, otherwise user will need to set it via invitation
      ...(password && { password: await bcrypt.hash(password, 12) })
    };

    const result = await db.collection('users').insertOne(newUser);
    const userId = result.insertedId.toString();

    // Handle invitation/welcome emails
    let emailResult = null;
    if (send_invitation) {
      if (password) {
        // User has immediate access, send welcome email
        const loginLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin`;
        
        emailResult = await sendWelcomeEmail({
          email: newUser.email,
          name: newUser.full_name,
          organizationName: user.organization?.name || 'Your Organization',
          role: newUser.role,
          loginLink
        });
      } else {
        // Create invitation for password setup
        const invitationResult = await createInvitation({
          email: newUser.email,
          role: newUser.role,
          org_id: user.org_id,
          team_id: team_id || undefined,
          inviter_id: user.id,
          inviter_name: user.name || user.email || 'Admin'
        });

        if (invitationResult.success && invitationResult.invitation) {
          const inviteLink = generateInviteLink(invitationResult.invitation.token);
          
          emailResult = await sendInvitationEmail({
            email: newUser.email,
            inviterName: user.name || user.email || 'Admin',
            organizationName: user.organization?.name || 'Your Organization',
            role: newUser.role,
            inviteLink
          });
        }
      }

      if (emailResult && !emailResult.success) {
        console.warn('Failed to send email:', emailResult.error);
        // Don't fail user creation if email fails
      }
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.full_name,
        role: newUser.role,
        is_active: newUser.is_active
      },
      email_sent: emailResult?.success || false,
      email_type: password ? 'welcome' : 'invitation'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { user_id, updates } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Validate the user exists and belongs to the same org (unless platform admin)
    const targetUser = await db.collection('users').findOne({ 
      _id: new ObjectId(user_id) 
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    if (user.role !== 'platform_admin' && targetUser.org_id !== user.org_id) {
      return NextResponse.json(
        { error: 'Cannot modify users from other organizations' }, 
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };

    // Handle specific update fields
    if (updates.role !== undefined) {
      const allowedRoles = user.role === 'platform_admin' 
        ? ['org_admin', 'supervisor', 'case_manager']
        : ['supervisor', 'case_manager'];
      
      if (!allowedRoles.includes(updates.role)) {
        return NextResponse.json(
          { error: 'Invalid role for your permission level' }, 
          { status: 403 }
        );
      }
      
      // Handle client assignments when role changes
      const oldRole = targetUser.role;
      const newRole = updates.role;
      
      if (oldRole === 'case_manager' && newRole !== 'case_manager') {
        // Case manager becoming supervisor/org_admin - unassign their clients
        const unassignResult = await db.collection('clients').updateMany(
          { caseManagerId: new ObjectId(user_id) },
          { 
            $unset: { caseManagerId: "" },
            $set: { 
              updated_at: new Date().toISOString(),
              updated_by: user.id,
              assignment_notes: `Unassigned due to role change from ${oldRole} to ${newRole}`
            }
          }
        );
        console.log(`📋 Unassigned ${unassignResult.modifiedCount} clients from user ${user_id} due to role change`);
      } else if (oldRole !== 'case_manager' && newRole === 'case_manager') {
        // Supervisor/org_admin becoming case manager - no automatic client assignment
        console.log(`📋 User ${user_id} became case manager - no clients auto-assigned`);
      }
      
      updateData.role = updates.role;
    }

    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active;
    }

    if (updates.team_id !== undefined) {
      updateData.team_id = updates.team_id || null;
    }

    if (updates.full_name !== undefined) {
      updateData.full_name = updates.full_name;
      updateData.name = updates.full_name;
    }

    // Perform the update
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(user_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Validate the user exists and belongs to the same org
    const targetUser = await db.collection('users').findOne({ 
      _id: new ObjectId(userId) 
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    if (user.role !== 'platform_admin' && targetUser.org_id !== user.org_id) {
      return NextResponse.json(
        { error: 'Cannot delete users from other organizations' }, 
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' }, 
        { status: 403 }
      );
    }

    // Hard delete to allow email reuse (for development/testing)
    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' }, 
      { status: 500 }
    );
  }
}