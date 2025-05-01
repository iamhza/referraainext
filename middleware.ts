import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Log current path for debugging
  console.log('Current path:', req.nextUrl.pathname)
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get authenticated user data
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Log authentication status for debugging
  console.log('User authenticated:', !!user)

  // Handle protected routes
  if (req.nextUrl.pathname.startsWith('/case-manager')) {
    if (!user) {
      console.log('No user found, redirecting to sign in')
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    const userRole = user.user_metadata.role
    console.log('User role:', userRole)
    
    if (userRole !== 'case_manager') {
      console.log('Non-case manager attempting to access restricted route')
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Handle provider routes
  if (req.nextUrl.pathname.startsWith('/provider')) {
    if (!user) {
      console.log('No user found, redirecting to sign in')
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    const userRole = user.user_metadata.role
    if (userRole !== 'provider') {
      console.log('Non-provider attempting to access restricted route')
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Handle auth routes
  if (req.nextUrl.pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  return res
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
    '/api/test/:path*'
  ],
} 