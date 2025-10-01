import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware } from '@/lib/auth-middleware'

export async function middleware(req: NextRequest) {
  // Use the production-grade auth middleware that handles both auth systems
  return await authMiddleware(req);
}

export const config = {
  matcher: [
    '/case-manager/:path*',
    '/provider/:path*',
    '/auth/callback',
    '/auth/signin',
    '/auth/login',
    '/api/referrals/:path*',
    '/api/phi/:path*',
    '/api/test/:path*',
    '/admin/:path*',
    '/org-admin/:path*'
  ],
} 