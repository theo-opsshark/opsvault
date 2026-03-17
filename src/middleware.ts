import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_DOMAIN = 'opsshark.com'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public paths
  if (pathname === '/login' || pathname.startsWith('/auth/')) {
    // If already authed and hitting login, redirect to home
    if (user && pathname === '/login') {
      const email = user.email ?? ''
      const domain = email.split('@')[1]
      if (domain === ALLOWED_DOMAIN) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    return supabaseResponse
  }

  // Protected: require auth
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Domain check
  const email = user.email ?? ''
  const domain = email.split('@')[1]
  if (domain !== ALLOWED_DOMAIN) {
    // Sign them out and redirect to login with error
    return NextResponse.redirect(new URL('/login?error=unauthorized_domain', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
