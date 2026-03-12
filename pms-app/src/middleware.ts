import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { PAGE_PERMISSIONS, ROLE_HIERARCHY, type UserRole } from '@/lib/rbac'

function matchPath(pattern: string, pathname: string): boolean {
  const regexPattern = pattern
    .replace(/\[id\]/g, '[^/]+')
    .replace(/\//g, '\\/')
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(pathname)
}

function getPagePermission(pathname: string): UserRole[] | null {
  // Check exact match first
  if (PAGE_PERMISSIONS[pathname]) {
    return PAGE_PERMISSIONS[pathname]
  }
  
  // Check pattern match
  for (const [pattern, allowedRoles] of Object.entries(PAGE_PERMISSIONS)) {
    if (matchPath(pattern, pathname)) {
      return allowedRoles
    }
  }
  
  return null
}

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')
  const pathname = req.nextUrl.pathname
  
  // Login page handling
  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  // Role-based access control
  if (isLoggedIn && req.auth?.user?.role) {
    const userRole = req.auth.user.role as UserRole
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0
    
    const allowedRoles = getPagePermission(pathname)
    
    if (allowedRoles) {
      const requiredLevel = Math.min(...allowedRoles.map(r => ROLE_HIERARCHY[r]))
      
      if (userRoleLevel < requiredLevel) {
        // Redirect to home if access denied
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
