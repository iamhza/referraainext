/**
 * Invitation validation API
 * Validates invitation tokens for user signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationToken } from '@/lib/invitations';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const { success, invitation, error } = await validateInvitationToken(token);

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Return invitation details without sensitive information
    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation?.email,
        role: invitation?.role,
        inviter_name: invitation?.inviter_name,
        organization_name: 'Your Organization', // TODO: Fetch from org data
        expires_at: invitation?.expires_at
      }
    });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}
