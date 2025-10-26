/**
 * Production-Grade Auth Middleware
 * Handles both Supabase Auth (legacy) and Custom Auth (new)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getCurrentUser, CustomUser } from '@/lib/auth/custom';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  org_id?: string | null;
  team_id?: string | null;
  authType: 'supabase' | 'custom';
}

/**
 * Get authenticated user from either auth system
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  // Try custom auth first (new system)
  const customUser = await getCurrentUser(request);
  if (customUser) {
    return {
      id: customUser.id,
      email: customUser.email,
      role: customUser.role,
      org_id: customUser.org_id,
      team_id: customUser.team_id,
      authType: 'custom'
    };
  }

  // Fall back to Supabase auth (legacy system)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {}, // Not needed for middleware
          remove() {} // Not needed for middleware
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'unknown',
      org_id: user.user_metadata?.org_id || null,
      team_id: user.user_metadata?.team_id || null,
      authType: 'supabase'
    };
  } catch (error) {
    console.error('Supabase auth error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRoles: string | string[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  // Platform admin has access to everything
  if (user.role === 'admin' || user.role === 'platform_admin') {
    return true;
  }
  
  return roles.includes(user.role);
}

/**
 * Protect route with authentication and role checks
 */
export async function protectRoute(
  request: NextRequest, 
  requiredRoles?: string | string[]
): Promise<{ user: AuthenticatedUser; response?: NextResponse } | { response: NextResponse }> {
  const user = await getAuthenticatedUser(request);

  // Check if user is authenticated
  if (!user) {
    console.log('No authenticated user found, redirecting to sign in');
    return {
      response: NextResponse.redirect(new URL('/auth/signin', request.url))
    };
  }

  // Check role requirements
  if (requiredRoles && !hasRole(user, requiredRoles)) {
    console.log(`User ${user.email} (${user.role}) does not have required role(s):`, requiredRoles);
    return {
      response: NextResponse.redirect(new URL('/', request.url))
    };
  }

  console.log(`Access granted for ${user.email} (${user.role}, ${user.authType} auth)`);
  return { user };
}

/**
 * Enhanced middleware function
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  
  console.log('Auth middleware - Path:', pathname);

  // Handle case manager routes
  if (pathname.startsWith('/case-manager')) {
    const result = await protectRoute(request, 'case_manager');
    if (result.response) return result.response;
  }

  // Handle provider routes  
  if (pathname.startsWith('/provider')) {
    const result = await protectRoute(request, 'provider');
    if (result.response) return result.response;
  }

  // Handle platform admin routes
  if (pathname.startsWith('/admin')) {
    const result = await protectRoute(request, ['admin', 'platform_admin']);
    if (result.response) return result.response;
  }

  // Handle organization admin routes
  if (pathname.startsWith('/org-admin')) {
    const result = await protectRoute(request, ['admin', 'platform_admin', 'org_admin']);
    if (result.response) return result.response;
  }

  // Redirect legacy auth routes
  if (pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}
