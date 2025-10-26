import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { signIn } from 'next-auth/react';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        org_id: user.org_id,
        team_id: user.team_id,
        permissions: user.permissions,
        organization: user.organization,
        team: user.team,
        authType: 'nextauth'
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ error: 'Error getting user' }, { status: 500 });
  }
}

// POST method removed - NextAuth handles login at /api/auth/[...nextauth] 