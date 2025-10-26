/**
 * Sandbox Manager - Core Business Logic
 * 
 * Handles creation, retrieval, expiration, and conversion of sandbox organizations.
 * This is the central module for all sandbox operations.
 */

import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import { 
  SandboxOrganization, 
  calculateExpirationDate,
  isValidStatusTransition 
} from './schemas';

// ============================================================================
// CREATE SANDBOX ORGANIZATION
// ============================================================================

export interface CreateSandboxParams {
  userId: string;
  email: string;
  tier: 'micro' | 'mid' | 'enterprise';
  role: 'case_manager' | 'supervisor' | 'org_admin';
  orgName?: string;
  metadata?: {
    signupSource?: string;
    referralCode?: string;
    initialFeatures?: string[];
  };
}

export interface CreateSandboxResult {
  sandboxOrg: SandboxOrganization;
  organization: any;  // The actual org document created
  success: boolean;
  error?: string;
}

/**
 * Creates a new sandbox organization with all required infrastructure
 * 
 * Strategy:
 * 1. Create the organization document (with isSandbox: true)
 * 2. Create sandbox tracking document
 * 3. Initialize tour progress
 * 4. Return complete sandbox context
 * 
 * Performance target: <5 seconds total (including data seeding)
 */
export async function createSandboxOrg(
  params: CreateSandboxParams
): Promise<CreateSandboxResult> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const { userId, email, tier, role, orgName: customOrgName, metadata } = params;
    const now = new Date();
    const expiresAt = calculateExpirationDate(tier);
    
    // ========================================================================
    // 1. CREATE ORGANIZATION DOCUMENT
    // ========================================================================
    
    const orgName = customOrgName || `${email.split('@')[0]}'s ${tier === 'micro' ? 'Micro' : tier === 'mid' ? 'Mid-Tier' : 'Enterprise'} Demo`;
    
    const organization = {
      name: orgName,
      slug: `demo-${new ObjectId().toString().slice(-8)}`,
      domain: null,
      isSandbox: true,
      sandboxTier: tier,
      sandboxCreatedFrom: new ObjectId(userId),
      plan: 'demo',
      settings: {
        allowPublicSignup: false,
        requireEmailVerification: false,
        maxCaseManagers: tier === 'micro' ? 3 : tier === 'mid' ? 10 : 25,
        maxClients: tier === 'micro' ? 50 : tier === 'mid' ? 200 : 1000,
      },
      created_at: now,
      updated_at: now,
    };
    
    const orgResult = await db.collection('organizations').insertOne(organization);
    const organizationId = orgResult.insertedId;
    
    // ========================================================================
    // 2. CREATE SANDBOX TRACKING DOCUMENT
    // ========================================================================
    
    const sandboxOrg: Omit<SandboxOrganization, '_id'> = {
      organizationId,
      userId: new ObjectId(userId),
      tier,
      role,
      createdAt: now,
      expiresAt,
      status: 'active',
      metadata,
    };
    
    const sandboxResult = await db.collection('sandbox_organizations').insertOne(sandboxOrg);
    
    // ========================================================================
    // 3. UPDATE USER DOCUMENT
    // ========================================================================
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: {
          sandboxOrgId: sandboxResult.insertedId,
          org_id: organizationId.toString(),
          tourCompleted: false,
          lastTourStepCompleted: 0,
          updated_at: now,
        }
      }
    );
    
    // ========================================================================
    // 4. INITIALIZE TOUR PROGRESS
    // ========================================================================
    
    const tourSteps = role === 'case_manager' ? 10 : role === 'supervisor' ? 6 : 8;
    
    await db.collection('sandbox_tour_progress').insertOne({
      sandboxOrgId: sandboxResult.insertedId,
      userId: new ObjectId(userId),
      role,
      currentStep: 0,
      totalSteps: tourSteps,
      completedSteps: [],
      restartCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    
    // ========================================================================
    // 5. LOG ANALYTICS EVENT
    // ========================================================================
    
    await db.collection('sandbox_analytics_events').insertOne({
      sandboxOrgId: sandboxResult.insertedId,
      userId: new ObjectId(userId),
      eventType: 'session_start',
      eventData: {
        tier,
        role,
        metadata,
      },
      createdAt: now,
    });
    
    console.log(`✅ Sandbox org created: ${organizationId} (tier: ${tier}, role: ${role})`);
    
    return {
      success: true,
      sandboxOrg: {
        _id: sandboxResult.insertedId,
        ...sandboxOrg,
      } as SandboxOrganization,
      organization: {
        _id: organizationId,
        ...organization,
      },
    };
    
  } catch (error) {
    console.error('❌ Error creating sandbox org:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sandbox',
      sandboxOrg: null as any,
      organization: null as any,
    };
  }
}

// ============================================================================
// GET SANDBOX ORGANIZATION
// ============================================================================

export async function getSandboxOrg(userId: string): Promise<SandboxOrganization | null> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const sandboxOrg = await db.collection('sandbox_organizations').findOne({
      userId: new ObjectId(userId),
      status: { $in: ['active', 'expired'] }, // Don't return converted or archived
    }) as SandboxOrganization | null;
    
    return sandboxOrg;
  } catch (error) {
    console.error('Error fetching sandbox org:', error);
    return null;
  }
}

export async function getSandboxOrgById(sandboxOrgId: string): Promise<SandboxOrganization | null> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const sandboxOrg = await db.collection('sandbox_organizations').findOne({
      _id: new ObjectId(sandboxOrgId),
    }) as SandboxOrganization | null;
    
    return sandboxOrg;
  } catch (error) {
    console.error('Error fetching sandbox org by ID:', error);
    return null;
  }
}

// ============================================================================
// CHECK IF USER HAS ACTIVE SANDBOX
// ============================================================================

export async function hasActiveSandbox(userId: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const count = await db.collection('sandbox_organizations').countDocuments({
      userId: new ObjectId(userId),
      status: 'active',
    });
    
    return count > 0;
  } catch (error) {
    console.error('Error checking active sandbox:', error);
    return false;
  }
}

// ============================================================================
// EXPIRE SANDBOX ORGANIZATION
// ============================================================================

export async function expireSandbox(sandboxOrgId: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const result = await db.collection('sandbox_organizations').updateOne(
      { 
        _id: new ObjectId(sandboxOrgId),
        status: 'active' // Only expire active sandboxes
      },
      { 
        $set: { 
          status: 'expired',
          updatedAt: new Date(),
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Sandbox expired: ${sandboxOrgId}`);
      
      // Log analytics event
      const sandboxOrg = await getSandboxOrgById(sandboxOrgId);
      if (sandboxOrg) {
        await db.collection('sandbox_analytics_events').insertOne({
          sandboxOrgId: new ObjectId(sandboxOrgId),
          userId: sandboxOrg.userId,
          eventType: 'session_end',
          eventData: {
            reason: 'expired',
            tier: sandboxOrg.tier,
            role: sandboxOrg.role,
          },
          createdAt: new Date(),
        });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error expiring sandbox:', error);
    return false;
  }
}

// ============================================================================
// GRANT EXTENSION
// ============================================================================

export async function grantExtension(sandboxOrgId: string, days: number = 7): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const sandboxOrg = await getSandboxOrgById(sandboxOrgId);
    if (!sandboxOrg) return false;
    
    // Can only extend expired sandboxes that haven't been extended yet
    if (sandboxOrg.status !== 'expired' || sandboxOrg.extensionGranted) {
      return false;
    }
    
    const newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    const result = await db.collection('sandbox_organizations').updateOne(
      { _id: new ObjectId(sandboxOrgId) },
      { 
        $set: { 
          status: 'active',
          expiresAt: newExpiresAt,
          extensionGranted: true,
          updatedAt: new Date(),
        } 
      }
    );
    
    console.log(`✅ Sandbox extended: ${sandboxOrgId} (${days} days)`);
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error granting extension:', error);
    return false;
  }
}

// ============================================================================
// CONVERT SANDBOX TO PRODUCTION
// ============================================================================

export interface ConversionResult {
  success: boolean;
  productionOrgId?: ObjectId;
  error?: string;
}

/**
 * Converts a sandbox organization to a production organization
 * 
 * Strategy:
 * 1. Create new production organization (isSandbox: false)
 * 2. Copy user data (NOT clients/referrals - fresh start)
 * 3. Update sandbox status to 'converted'
 * 4. Update user's org_id to production org
 * 5. Keep sandbox accessible for 7 days (training period)
 */
export async function convertSandboxToProduction(
  sandboxOrgId: string,
  orgDetails: {
    orgName: string;
    orgDomain?: string;
    adminName: string;
    adminTitle: string;
  }
): Promise<ConversionResult> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get sandbox org
    const sandboxOrg = await getSandboxOrgById(sandboxOrgId);
    if (!sandboxOrg) {
      return { success: false, error: 'Sandbox not found' };
    }
    
    if (sandboxOrg.status === 'converted') {
      return { success: false, error: 'Already converted' };
    }
    
    const now = new Date();
    
    // ========================================================================
    // 1. CREATE PRODUCTION ORGANIZATION
    // ========================================================================
    
    const productionOrg = {
      name: orgDetails.orgName,
      slug: orgDetails.orgDomain || `${orgDetails.orgName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      domain: orgDetails.orgDomain || null,
      isSandbox: false, // PRODUCTION ORG
      plan: 'free', // Organizations are free (providers pay)
      settings: {
        allowPublicSignup: false,
        requireEmailVerification: true,
        maxCaseManagers: 100, // Generous limits for production
        maxClients: 10000,
      },
      created_at: now,
      updated_at: now,
      admin_name: orgDetails.adminName,
      admin_title: orgDetails.adminTitle,
    };
    
    const prodOrgResult = await db.collection('organizations').insertOne(productionOrg);
    const productionOrgId = prodOrgResult.insertedId;
    
    // ========================================================================
    // 2. UPDATE USER TO PRODUCTION ORG
    // ========================================================================
    
    await db.collection('users').updateOne(
      { _id: sandboxOrg.userId },
      { 
        $set: {
          org_id: productionOrgId.toString(),
          sandboxOrgId: null, // No longer in sandbox
          updated_at: now,
        }
      }
    );
    
    // ========================================================================
    // 3. UPDATE SANDBOX STATUS
    // ========================================================================
    
    await db.collection('sandbox_organizations').updateOne(
      { _id: new ObjectId(sandboxOrgId) },
      { 
        $set: { 
          status: 'converted',
          convertedToOrgId: productionOrgId,
          convertedAt: now,
          // Sandbox remains accessible for 7 days (training)
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        } 
      }
    );
    
    // ========================================================================
    // 4. LOG CONVERSION EVENT
    // ========================================================================
    
    await db.collection('sandbox_analytics_events').insertOne({
      sandboxOrgId: new ObjectId(sandboxOrgId),
      userId: sandboxOrg.userId,
      eventType: 'conversion_completed',
      eventData: {
        productionOrgId: productionOrgId.toString(),
        tier: sandboxOrg.tier,
        role: sandboxOrg.role,
        daysInSandbox: Math.floor((now.getTime() - sandboxOrg.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      },
      createdAt: now,
    });
    
    console.log(`✅ Sandbox converted to production: ${sandboxOrgId} → ${productionOrgId}`);
    
    return {
      success: true,
      productionOrgId,
    };
    
  } catch (error) {
    console.error('❌ Error converting sandbox:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

// ============================================================================
// ARCHIVE SANDBOX (CLEANUP)
// ============================================================================

export async function archiveSandbox(sandboxOrgId: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const result = await db.collection('sandbox_organizations').updateOne(
      { _id: new ObjectId(sandboxOrgId) },
      { 
        $set: { 
          status: 'archived',
          updatedAt: new Date(),
        } 
      }
    );
    
    console.log(`✅ Sandbox archived: ${sandboxOrgId}`);
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error archiving sandbox:', error);
    return false;
  }
}

// ============================================================================
// GET SANDBOX STATS (for analytics dashboard)
// ============================================================================

export interface SandboxStats {
  totalActive: number;
  totalExpired: number;
  totalConverted: number;
  byTier: {
    micro: number;
    mid: number;
    enterprise: number;
  };
  byRole: {
    case_manager: number;
    supervisor: number;
    org_admin: number;
  };
  conversionRate: number;
}

export async function getSandboxStats(): Promise<SandboxStats> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const [active, expired, converted, all] = await Promise.all([
      db.collection('sandbox_organizations').countDocuments({ status: 'active' }),
      db.collection('sandbox_organizations').countDocuments({ status: 'expired' }),
      db.collection('sandbox_organizations').countDocuments({ status: 'converted' }),
      db.collection('sandbox_organizations').find({}).toArray(),
    ]);
    
    const byTier = {
      micro: all.filter(s => s.tier === 'micro').length,
      mid: all.filter(s => s.tier === 'mid').length,
      enterprise: all.filter(s => s.tier === 'enterprise').length,
    };
    
    const byRole = {
      case_manager: all.filter(s => s.role === 'case_manager').length,
      supervisor: all.filter(s => s.role === 'supervisor').length,
      org_admin: all.filter(s => s.role === 'org_admin').length,
    };
    
    const total = all.length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;
    
    return {
      totalActive: active,
      totalExpired: expired,
      totalConverted: converted,
      byTier,
      byRole,
      conversionRate,
    };
  } catch (error) {
    console.error('Error fetching sandbox stats:', error);
    throw error;
  }
}

