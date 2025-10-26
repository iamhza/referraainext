/**
 * POST /api/sandbox/convert
 * 
 * Converts a sandbox organization to production.
 * Called when user completes BAA signing in ConversionModal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-minimal';
import { convertSandboxToProduction } from '@/lib/sandbox/sandbox-manager';
import { z } from 'zod';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const convertSchema = z.object({
  sandboxOrgId: z.string(),
  orgDetails: z.object({
    orgName: z.string().min(1),
    orgDomain: z.string().optional(),
    adminName: z.string().min(1),
    adminTitle: z.string().min(1),
  }),
});

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
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
    // 2. VALIDATE REQUEST
    // ========================================================================
    
    const body = await request.json();
    const validation = convertSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { sandboxOrgId, orgDetails } = validation.data;
    
    console.log(`🔄 Converting sandbox ${sandboxOrgId} to production...`);
    
    // ========================================================================
    // 3. CONVERT SANDBOX TO PRODUCTION
    // ========================================================================
    
    const result = await convertSandboxToProduction(sandboxOrgId, orgDetails);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Conversion failed' },
        { status: 500 }
      );
    }
    
    // ========================================================================
    // 4. SEND WELCOME EMAIL (TODO: Implement email sending)
    // ========================================================================
    
    // TODO: Send welcome email with:
    // - Login credentials reminder
    // - Onboarding checklist
    // - Link to support/training resources
    
    console.log(`✅ Sandbox converted to production: ${result.productionOrgId}`);
    
    // ========================================================================
    // 5. RETURN SUCCESS
    // ========================================================================
    
    return NextResponse.json({
      success: true,
      productionOrgId: result.productionOrgId?.toString(),
      message: 'Your production account is ready!',
      onboarding: {
        steps: [
          { id: 'invite_team', title: 'Invite your team members', completed: false },
          { id: 'import_clients', title: 'Import your clients', completed: false },
          { id: 'create_referral', title: 'Create your first referral', completed: false },
        ],
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert sandbox to production' },
      { status: 500 }
    );
  }
}

