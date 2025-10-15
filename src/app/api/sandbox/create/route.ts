/**
 * POST /api/sandbox/create
 * 
 * Creates a new sandbox organization with tier-based dummy data.
 * Called after user signs up and selects tier/role.
 * 
 * Performance target: <5 seconds total
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-minimal';
import { createSandboxOrg } from '@/lib/sandbox/sandbox-manager';
import { seedSandboxData } from '@/lib/sandbox/dummy-data-seeder';
import { z } from 'zod';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const createSandboxSchema = z.object({
  tier: z.enum(['micro', 'mid', 'enterprise']),
  role: z.enum(['case_manager', 'supervisor', 'org_admin']),
  orgName: z.string().optional(),
  metadata: z.object({
    signupSource: z.string().optional(),
    referralCode: z.string().optional(),
    initialFeatures: z.array(z.string()).optional(),
  }).optional(),
});

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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
    
    const { id: userId, email } = session.user;
    
    // ========================================================================
    // 2. VALIDATE REQUEST BODY
    // ========================================================================
    
    const body = await request.json();
    const validation = createSandboxSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { tier, role, orgName, metadata } = validation.data;
    
    console.log(`📦 Creating sandbox for user ${userId} (tier: ${tier}, role: ${role})`);
    
    // ========================================================================
    // 3. CREATE SANDBOX ORGANIZATION
    // ========================================================================
    
    const createResult = await createSandboxOrg({
      userId,
      email: email || '',
      tier,
      role,
      orgName,
      metadata,
    });
    
    if (!createResult.success) {
      console.error('Failed to create sandbox:', createResult.error);
      return NextResponse.json(
        { error: createResult.error || 'Failed to create sandbox' },
        { status: 500 }
      );
    }
    
    const { sandboxOrg, organization } = createResult;
    
    // ========================================================================
    // 4. SEED DUMMY DATA
    // ========================================================================
    
    console.log(`🌱 Seeding ${tier} dummy data...`);
    
    const seedResult = await seedSandboxData({
      organizationId: organization._id,
      sandboxOrgId: sandboxOrg._id,
      userId: sandboxOrg.userId,
      tier,
      role,
    });
    
    if (!seedResult.success) {
      console.error('Failed to seed data:', seedResult.error);
      // Don't fail the request, sandbox is still created
      console.warn('⚠️  Sandbox created but data seeding failed');
    }
    
    // ========================================================================
    // 5. CALCULATE PERFORMANCE
    // ========================================================================
    
    const duration = Date.now() - startTime;
    console.log(`✅ Sandbox created in ${duration}ms`);
    
    if (duration > 5000) {
      console.warn(`⚠️  Sandbox creation took ${duration}ms (target: <5000ms)`);
    }
    
    // ========================================================================
    // 6. RETURN SUCCESS RESPONSE
    // ========================================================================
    
    return NextResponse.json({
      success: true,
      sandbox: {
        id: sandboxOrg._id.toString(),
        organizationId: organization._id.toString(),
        tier: sandboxOrg.tier,
        role: sandboxOrg.role,
        expiresAt: sandboxOrg.expiresAt,
        daysRemaining: Math.ceil(
          (sandboxOrg.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      },
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
      },
      seededData: seedResult.counts,
      performance: {
        duration,
        target: 5000,
        withinTarget: duration <= 5000,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Sandbox creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'An error occurred creating your sandbox',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET HANDLER (Check if user already has sandbox)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Import here to avoid circular dependency
    const { getSandboxOrg } = await import('@/lib/sandbox/sandbox-manager');
    const sandboxOrg = await getSandboxOrg(session.user.id);
    
    if (!sandboxOrg) {
      return NextResponse.json({ hasSandbox: false }, { status: 200 });
    }
    
    return NextResponse.json({
      hasSandbox: true,
      sandbox: {
        id: sandboxOrg._id.toString(),
        tier: sandboxOrg.tier,
        role: sandboxOrg.role,
        status: sandboxOrg.status,
        expiresAt: sandboxOrg.expiresAt,
        daysRemaining: Math.ceil(
          (sandboxOrg.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error checking sandbox:', error);
    return NextResponse.json(
      { error: 'Failed to check sandbox status' },
      { status: 500 }
    );
  }
}

