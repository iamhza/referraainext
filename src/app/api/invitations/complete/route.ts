/**
 * Invitation completion API
 * Completes user registration from invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationToken, completeInvitation } from '@/lib/invitations/utils';
import { sendWelcomeEmail } from '@/lib/shared/email';
import clientPromise from '@/lib/mongodb/client';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, full_name, password } = await request.json();

    if (!token || !full_name || !password) {
      return NextResponse.json(
        { error: 'Token, full name, and password are required' },
        { status: 400 }
      );
    }

    // Validate the invitation token
    const { success, invitation, error } = await validateInvitationToken(token);

    if (!success || !invitation) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    try {
      const client = await clientPromise;
      const db = client.db('referradb');

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ 
        email: invitation.email 
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create the user
      const newUser = {
        email: invitation.email,
        full_name: full_name.trim(),
        name: full_name.trim(),
        role: invitation.role,
        org_id: invitation.org_id,
        team_id: invitation.team_id || null,
        password: hashedPassword,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_via: 'invitation',
        invited_by: invitation.inviter_id
      };

      const result = await db.collection('users').insertOne(newUser);
      const userId = result.insertedId.toString();

      // Mark invitation as completed
      await completeInvitation(token, userId);

      // Send welcome email
      const loginLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin`;
      
      const emailResult = await sendWelcomeEmail({
        email: newUser.email,
        name: newUser.full_name,
        organizationName: 'Your Organization', // TODO: Fetch from org data
        role: newUser.role,
        loginLink
      });

      if (!emailResult.success) {
        console.warn('Failed to send welcome email:', emailResult.error);
        // Don't fail registration if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: userId,
          email: newUser.email,
          name: newUser.full_name,
          role: newUser.role
        },
        email_sent: emailResult.success
      });

    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error completing invitation:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
