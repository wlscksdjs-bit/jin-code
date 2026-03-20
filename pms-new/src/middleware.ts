import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('next-auth.session-token')?.value

  if (sessionToken && pathname === '/signin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const publicPaths = ['/signin', '/api/auth', '/_next', '/favicon.ico', '/public']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!sessionToken && !isPublic) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
