/**
 * GET /api/sandbox/status
 * 
 * Returns current sandbox status for the authenticated user.
 * Used by useSandbox hook for real-time sandbox state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-minimal';
import { getSandboxOrg } from '@/lib/sandbox/sandbox-manager';

export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ========================================================================
    // 2. FETCH SANDBOX DATA
    // ========================================================================
    
    const sandboxOrg = await getSandboxOrg(session.user.id);
    
    if (!sandboxOrg) {
      return NextResponse.json({
        isSandbox: false,
        tier: null,
        role: null,
        expiresAt: null,
        daysRemaining: null,
        status: null,
        sandboxOrgId: null,
      });
    }
    
    // ========================================================================
    // 3. CALCULATE DAYS REMAINING
    // ========================================================================
    
    const now = Date.now();
    const expiresAt = sandboxOrg.expiresAt.getTime();
    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    // ========================================================================
    // 4. RETURN SANDBOX STATUS
    // ========================================================================
    
    return NextResponse.json({
      isSandbox: true,
      tier: sandboxOrg.tier,
      role: sandboxOrg.role,
      expiresAt: sandboxOrg.expiresAt.toISOString(),
      daysRemaining,
      status: sandboxOrg.status,
      sandboxOrgId: sandboxOrg._id.toString(),
      organizationId: sandboxOrg.organizationId.toString(),
      extensionGranted: sandboxOrg.extensionGranted || false,
      metadata: sandboxOrg.metadata,
    });
    
  } catch (error) {
    console.error('Error fetching sandbox status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sandbox status' },
      { status: 500 }
    );
  }
}

