import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths
  if (pathname === '/login' || pathname.startsWith('/api/auth/') || pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Check auth cookie
  const auth = request.cookies.get('vault_auth')
  if (!auth || auth.value !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
