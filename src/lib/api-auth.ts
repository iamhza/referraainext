/**
 * API authentication and authorization utilities for multi-tenant platform
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getUserOrgContext, type OrganizationUser, type OrgRole } from './organization';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  user_metadata: Record<string, any>;
}

export interface OrgAuthenticatedUser extends AuthenticatedUser {
  orgContext: OrganizationUser;
}

/**
 * Get Supabase client for API routes
 */
export function getSupabaseClient(req?: NextRequest) {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Get service role Supabase client for admin operations
 */
export function getServiceSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Authenticate user from request
 */
export async function authenticateUser(req?: NextRequest): Promise<AuthenticatedUser | null> {
  const supabase = getSupabaseClient(req);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    role: user.user_metadata?.role || '',
    user_metadata: user.user_metadata || {}
  };
}

/**
 * Authenticate user with organization context
 */
export async function authenticateOrgUser(req?: NextRequest): Promise<OrgAuthenticatedUser | null> {
  const user = await authenticateUser(req);
  if (!user) return null;

  const orgContext = await getUserOrgContext(user.id);
  if (!orgContext) return null;

  return {
    ...user,
    orgContext
  };
}

/**
 * Require authentication for API route
 */
export async function requireAuth(req?: NextRequest): Promise<AuthenticatedUser> {
  const user = await authenticateUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require organization authentication for API route
 */
export async function requireOrgAuth(req?: NextRequest): Promise<OrgAuthenticatedUser> {
  const user = await authenticateOrgUser(req);
  if (!user) {
    throw new Error('Organization authentication required');
  }
  return user;
}

/**
 * Require specific role for API route
 */
export async function requireRole(role: OrgRole | OrgRole[], req?: NextRequest): Promise<OrgAuthenticatedUser> {
  const user = await requireOrgAuth(req);
  
  const requiredRoles = Array.isArray(role) ? role : [role];
  
  // Platform admins can access everything
  if (user.orgContext.role === 'admin') {
    return user;
  }
  
  if (!requiredRoles.includes(user.orgContext.role)) {
    throw new Error(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
  }
  
  return user;
}

/**
 * Create authentication error response
 */
export function createAuthError(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create authorization error response
 */
export function createAuthzError(message: string = 'Insufficient permissions', status = 403) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * API route wrapper for authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireAuth(req);
      return handler(user, ...args);
    } catch (error) {
      return createAuthError(error instanceof Error ? error.message : 'Authentication failed');
    }
  };
}

/**
 * API route wrapper for organization authentication
 */
export function withOrgAuth<T extends any[]>(
  handler: (user: OrgAuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireOrgAuth(req);
      return handler(user, ...args);
    } catch (error) {
      return createAuthError(error instanceof Error ? error.message : 'Organization authentication failed');
    }
  };
}

/**
 * API route wrapper for role-based authentication
 */
export function withRole<T extends any[]>(
  role: OrgRole | OrgRole[],
  handler: (user: OrgAuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireRole(role, req);
      return handler(user, ...args);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return createAuthzError(error.message);
      }
      return createAuthError(error instanceof Error ? error.message : 'Authentication failed');
    }
  };
}

/**
 * MongoDB query helpers that automatically scope by organization
 */
export function createOrgScopedQuery(orgId: string, additionalFilter: Record<string, any> = {}) {
  return {
    orgId,
    ...additionalFilter
  };
}

/**
 * Validate that a MongoDB document belongs to the user's organization
 */
export function validateOrgOwnership(document: any, userOrgId: string): boolean {
  return document?.orgId === userOrgId;
}

/**
 * Filter MongoDB results to only include organization-scoped data
 */
export function filterOrgResults<T extends { orgId?: string }>(
  results: T[], 
  userOrgId: string
): T[] {
  return results.filter(item => item.orgId === userOrgId);
}
