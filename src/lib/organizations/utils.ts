/**
 * Organization-scoped utilities for multi-tenant data access
 */

import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export type OrgRole = 'admin' | 'org_admin' | 'supervisor' | 'case_manager' | 'provider';

export interface OrganizationUser {
  id: string;
  orgId: string;
  role: OrgRole;
  teamId?: string;
  fullName?: string;
  email: string;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  slug?: string;
  settings: Record<string, any>;
  status: 'active' | 'inactive' | 'suspended';
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  created_at: string;
  updated_at: string;
}



/**
 * Get current user's organization context
 */
export async function getUserOrgContext(userId: string): Promise<OrganizationUser | null> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      orgId: user.org_id,
      role: user.role as OrgRole,
      teamId: user.team_id,
      fullName: user.full_name || user.name,
      email: user.email
    };
  } catch (error) {
    console.error('Error getting user org context:', error);
    return null;
  }
}

/**
 * Get organization details
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const org = await db.collection('organizations').findOne({
      _id: new ObjectId(orgId)
    });

    if (!org) {
      return null;
    }

    return {
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      domain: org.domain,
      settings: org.settings || {},
      created_at: org.created_at,
      updated_at: org.updated_at
    } as Organization;
  } catch (error) {
    console.error('Error getting organization:', error);
    return null;
  }
}

/**
 * Check if user has permission within their organization
 */
export async function hasOrgPermission(
  userId: string, 
  permission: 'manage_users' | 'manage_teams' | 'view_analytics' | 'manage_settings'
): Promise<boolean> {
  const userContext = await getUserOrgContext(userId);
  if (!userContext) return false;

  // Platform admins have all permissions
  if (userContext.role === 'admin') return true;

  // Org admins have most permissions
  if (userContext.role === 'org_admin') {
    return ['manage_users', 'manage_teams', 'view_analytics', 'manage_settings'].includes(permission);
  }

  // Supervisors have limited permissions
  if (userContext.role === 'supervisor') {
    return ['view_analytics'].includes(permission);
  }

  return false;
}

/**
 * Get organization-scoped MongoDB filter
 */
export function getOrgFilter(orgId: string) {
  return { orgId };
}

/**
 * Get team-scoped MongoDB filter
 */
export function getTeamFilter(orgId: string, teamId?: string) {
  const filter: any = { orgId };
  if (teamId) {
    filter.teamId = teamId;
  }
  return filter;
}

/**
 * MongoDB helper: Get organization-scoped clients
 */
export async function getOrgClients(orgId: string, caseManagerId?: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const filter = getOrgFilter(orgId);
  if (caseManagerId) {
    filter.caseManagerId = caseManagerId;
  }

  return db.collection('clients').find(filter).toArray();
}

/**
 * MongoDB helper: Get organization-scoped referrals
 */
export async function getOrgReferrals(orgId: string, caseManagerId?: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const filter = getOrgFilter(orgId);
  if (caseManagerId) {
    filter.caseManagerId = caseManagerId;
  }

  return db.collection('referrals').find(filter).toArray();
}

/**
 * Create audit log entry for organizational changes
 */
export async function createOrgAuditLog(
  orgId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  metadata?: Record<string, any>
) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    await db.collection('audit_logs').insertOne({
      org_id: orgId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues || {},
      new_values: newValues || {},
      metadata: metadata || {},
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

/**
 * Invite user to organization
 */
export async function inviteUserToOrg(
  orgId: string,
  email: string,
  role: OrgRole,
  invitedBy: string,
  teamId?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Check if user is already in the organization
    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase(),
      org_id: orgId
    });

    if (existingUser) {
      return { success: false, error: 'User is already a member of this organization' };
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db.collection('organization_invitations').findOne({
      email: email.toLowerCase(),
      orgId: orgId,
      status: 'pending'
    });

    if (existingInvitation) {
      return { success: false, error: 'An invitation is already pending for this email' };
    }

    // Generate unique token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation in MongoDB
    const invitationDoc = {
      email: email.toLowerCase(),
      role,
      orgId,
      teamId: teamId || null,
      invitedBy,
      token,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      acceptedAt: null
    };

    const result = await db.collection('organization_invitations').insertOne(invitationDoc);

    if (!result.insertedId) {
      return { success: false, error: 'Failed to create invitation' };
    }

    // Create audit log
    await createOrgAuditLog(
      orgId,
      invitedBy,
      'invite_user',
      'user',
      email,
      undefined,
      { email, role, teamId }
    );

    return { success: true, token };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return { success: false, error: 'Failed to create invitation' };
  }
}

/**
 * Get users in organization
 */
export async function getOrgUsers(orgId: string): Promise<OrganizationUser[]> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const users = await db.collection('users').find({
      org_id: orgId
    }).toArray();

    return users.map(user => ({
      id: user._id.toString(),
      orgId: user.org_id,
      role: user.role as OrgRole,
      teamId: user.team_id,
      fullName: user.full_name || user.name,
      email: user.email
    }));
  } catch (error) {
    console.error('Error getting org users:', error);
    return [];
  }
}
