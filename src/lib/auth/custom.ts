/**
 * Production-Grade Custom Authentication System
 * HIPAA-compliant, multi-tenant, secure session management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Types
export interface CustomUser {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'org_admin' | 'supervisor' | 'case_manager' | 'provider';
  org_id: string | null;
  team_id: string | null;
  is_active: boolean;
  authType: 'custom';
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  orgId: string | null;
  teamId: string | null;
  iat: number;
  exp: number;
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SESSION_COOKIE_NAME = 'referra-session';

// Supabase client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Hash password securely
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(user: CustomUser): string {
  const payload: SessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    orgId: user.org_id,
    teamId: user.team_id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): SessionData | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionData;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Authenticate user with email/password
 */
export async function authenticateUser(email: string, password: string): Promise<{ user: CustomUser; token: string } | null> {
  try {
    // Get user from app_users table
    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.log('User not found or inactive:', email);
      return null;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return null;
    }

    // Create user object
    const authenticatedUser: CustomUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      org_id: user.org_id,
      team_id: user.team_id,
      is_active: user.is_active,
      authType: 'custom'
    };

    // Generate token
    const token = generateToken(authenticatedUser);

    // Store session in database
    await storeSession(user.id, token);

    return { user: authenticatedUser, token };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Store session in database
 */
export async function storeSession(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString()
    });
}

/**
 * Remove session from database
 */
export async function removeSession(token: string): Promise<void> {
  await supabase
    .from('user_sessions')
    .delete()
    .eq('token', token);
}

/**
 * Get user from session token
 */
export async function getUserFromToken(token: string): Promise<CustomUser | null> {
  try {
    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Check if session exists in database
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      console.log('Session not found in database');
      return null;
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      console.log('Session expired');
      await removeSession(token);
      return null;
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', payload.userId)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      console.log('User not found or inactive');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      org_id: user.org_id,
      team_id: user.team_id,
      is_active: user.is_active,
      authType: 'custom'
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

/**
 * Get current user from request
 */
export async function getCurrentUser(request?: NextRequest): Promise<CustomUser | null> {
  try {
    let token: string | undefined;

    if (request) {
      // From request headers (API routes)
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      } else {
        // From cookies
        token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      }
    } else {
      // From server-side cookies (pages)
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }

    if (!token) {
      return null;
    }

    return await getUserFromToken(token);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Set session cookie
 */
export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await supabase
    .from('user_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
}

/**
 * Check if user has permission
 */
export function hasPermission(user: CustomUser, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  // Platform admin has access to everything
  if (user.role === 'admin') {
    return true;
  }
  
  return roles.includes(user.role);
}

/**
 * Check if user can access organization data
 */
export function canAccessOrg(user: CustomUser, orgId: string): boolean {
  // Platform admin can access all orgs
  if (user.role === 'admin') {
    return true;
  }
  
  // User must belong to the org
  return user.org_id === orgId;
}
