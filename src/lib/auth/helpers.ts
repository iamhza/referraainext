/**
 * NextAuth.js helpers that integrate with existing HIPAA and security infrastructure
 * Preserves existing API patterns while adding multi-tenant support
 */

import { getServerSession } from "next-auth";
import authOptions from "./auth-minimal";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "../audit/hipaa";

// v1.1 Data Model - Updated for org_members junction table
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: 'PLATFORM_ADMIN' | 'ORG_ADMIN' | 'SUPERVISOR' | 'CASE_MANAGER' | 'PROVIDER_USER';
  organizationId?: string | null;
  teamId?: string | null;
  providerId?: string | null;
  permissions: string[];
  organization?: {
    id: string;
    name: string;
    plan: string;
    settings: any;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Get authenticated user from NextAuth session
 * Replaces your existing auth patterns while maintaining compatibility
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }

    // v1.1: Return user with org_members data
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name,
      role: session.user.role,
      organizationId: session.user.organizationId,
      teamId: session.user.teamId,
      providerId: session.user.providerId,
      permissions: session.user.permissions || [],
      organization: session.user.organization,
      team: session.user.team
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * API wrapper for authentication - maintains your existing pattern
 * Usage: const user = await requireAuth(req); if (!user) return unauthorized();
 */
export async function requireAuth(): Promise<AuthenticatedUser | null> {
  return await getAuthenticatedUser();
}

/**
 * API wrapper for role-based authorization
 * Usage: const user = await requireRole(['case_manager', 'admin']);
 */
export async function requireRole(
  allowedRoles: string | string[]
): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return null;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  // Platform admin has access to everything
  if (user.role === 'PLATFORM_ADMIN') {
    return user;
  }
  
  if (!roles.includes(user.role)) {
    // Create audit log for unauthorized access attempt
    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'unauthorized_access_attempt',
      resourceType: 'api',
      resourceId: 'role_check',
      success: false,
      details: { 
        required_roles: roles,
        user_role: user.role
      }
    });
    return null;
  }

  return user;
}

/**
 * Organization-scoped authorization
 * Ensures user can only access their organization's data
 */
export async function requireOrgAccess(orgId: string): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return null;
  }

  // Platform admin can access all orgs
  if (user.role === 'PLATFORM_ADMIN') {
    return user;
  }

  // v1.1: User must belong to the organization
  if (user.organizationId !== orgId) {
    // Create audit log for cross-org access attempt
    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'cross_org_access_attempt',
      resourceType: 'organization',
      resourceId: orgId,
      success: false,
      details: { 
        user_organizationId: user.organizationId,
        requested_org_id: orgId
      }
    });
    return null;
  }

  return user;
}

/**
 * Permission-based authorization
 * Checks if user has specific permission
 */
export async function requirePermission(permission: string): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return null;
  }

  // Platform admin has all permissions
  if (user.role === 'PLATFORM_ADMIN') {
    return user;
  }

  if (!user.permissions.includes(permission)) {
    // Create audit log for permission denied
    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'permission_denied',
      resourceType: 'permission',
      resourceId: permission,
      success: false,
      details: { 
        required_permission: permission,
        user_permissions: user.permissions
      }
    });
    return null;
  }

  return user;
}

/**
 * Helper to create standardized API responses
 * Maintains your existing API response patterns
 */
export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createForbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Enhanced middleware wrapper for API routes
 * Preserves your existing patterns while adding NextAuth integration
 */
export function withAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return createUnauthorizedResponse();
    }

    try {
      return await handler(user, ...args);
    } catch (error) {
      console.error('API error:', error);
      
      // Create audit log for API errors
      await createAuditLog({
        userId: user.id,
        userRole: user.role,
        action: 'api_error',
        resourceType: 'api',
        resourceId: 'unknown',
        success: false,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      return createErrorResponse('Internal server error');
    }
  };
}

/**
 * Role-based middleware wrapper
 */
export function withRole<T extends any[]>(
  allowedRoles: string | string[],
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const user = await requireRole(allowedRoles);
    
    if (!user) {
      return createForbiddenResponse();
    }

    try {
      return await handler(user, ...args);
    } catch (error) {
      console.error('API error:', error);
      return createErrorResponse('Internal server error');
    }
  };
}

/**
 * Organization-scoped middleware wrapper
 */
export function withOrgAccess<T extends any[]>(
  orgIdExtractor: (...args: T) => string,
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const orgId = orgIdExtractor(...args);
    const user = await requireOrgAccess(orgId);
    
    if (!user) {
      return createForbiddenResponse();
    }

    try {
      return await handler(user, ...args);
    } catch (error) {
      console.error('API error:', error);
      return createErrorResponse('Internal server error');
    }
  };
}
