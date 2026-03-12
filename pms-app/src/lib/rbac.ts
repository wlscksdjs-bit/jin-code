/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Roles:
 * - ADMIN: 전체 접근 (사용자 관리, 전체 데이터)
 * - PM: 프로젝트 관리자 (담당 프로젝트, 영업, 예산, 진행, 자원, Finance)
 * - STAFF: 현장的人员 (진행 상황 확인만)
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Role types
export type UserRole = 'ADMIN' | 'PM' | 'STAFF'

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  PM: 2,
  STAFF: 1,
}

// Page access permissions
export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  // Dashboard & Main
  '/': ['ADMIN', 'PM', 'STAFF'],
  
  // Projects
  '/projects': ['ADMIN', 'PM'],
  '/projects/new': ['ADMIN', 'PM'],
  '/projects/[id]': ['ADMIN', 'PM'],
  '/projects/[id]/edit': ['ADMIN', 'PM'],
  
  // Sales
  '/sales': ['ADMIN', 'PM'],
  '/sales/new': ['ADMIN', 'PM'],
  '/sales/[id]': ['ADMIN', 'PM'],
  '/sales/[id]/edit': ['ADMIN', 'PM'],
  
  // Budget
  '/budget': ['ADMIN', 'PM'],
  '/budget/new': ['ADMIN', 'PM'],
  
  // Progress
  '/progress': ['ADMIN', 'PM', 'STAFF'],
  '/progress/new': ['ADMIN', 'PM'],
  
  // Finance
  '/finance': ['ADMIN', 'PM'],
  
  // Resources
  '/resources': ['ADMIN', 'PM'],
  '/resources/new': ['ADMIN', 'PM'],
  
  // Settings
  '/settings': ['ADMIN', 'PM', 'STAFF'], // 본인의 설정만
  '/settings/new-user': ['ADMIN'],
  '/settings/[id]/edit': ['ADMIN'], // 타인 정보 수정은 ADMIN만
}

// Feature permissions (for granular control)
export const FEATURE_PERMISSIONS = {
  // Projects
  createProject: ['ADMIN', 'PM'],
  editProject: ['ADMIN', 'PM'],
  deleteProject: ['ADMIN'],
  viewAllProjects: ['ADMIN'],
  
  // Users
  createUser: ['ADMIN'],
  editUser: ['ADMIN'],
  deleteUser: ['ADMIN'],
  viewAllUsers: ['ADMIN'],
  
  // Budget
  createBudget: ['ADMIN', 'PM'],
  editBudget: ['ADMIN', 'PM'],
  approveBudget: ['ADMIN'],
  
  // Finance
  createFinance: ['ADMIN', 'PM'],
  editFinance: ['ADMIN', 'PM'],
  
  // Sales
  createSales: ['ADMIN', 'PM'],
  editSales: ['ADMIN', 'PM'],
  
  // Resources
  createResource: ['ADMIN', 'PM'],
  editResource: ['ADMIN', 'PM'],
  allocateResource: ['ADMIN', 'PM'],
  
  // Progress
  createProgress: ['ADMIN', 'PM'],
  editProgress: ['ADMIN', 'PM'],
}

/**
 * Check if user has required role
 */
export function hasRole(requiredRole: UserRole, userRole?: string): boolean {
  if (!userRole) return false
  
  const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole]
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole]
  
  return (userRoleLevel ?? 0) >= requiredRoleLevel
}

/**
 * Check if user can access the page
 */
export async function checkPageAccess(pathname: string): Promise<{
  allowed: boolean
  redirectTo?: string
  userRole?: string
}> {
  const session = await auth()
  
  if (!session?.user?.role) {
    return { allowed: false, redirectTo: '/login' }
  }
  
  const userRole = session.user.role as UserRole
  
  // Check exact match first
  if (PAGE_PERMISSIONS[pathname]) {
    const allowedRoles = PAGE_PERMISSIONS[pathname]
    if (allowedRoles.includes(userRole)) {
      return { allowed: true, userRole }
    }
  }
  
  // Check pattern match
  for (const [pattern, allowedRoles] of Object.entries(PAGE_PERMISSIONS)) {
    if (matchPath(pattern, pathname)) {
      if (allowedRoles.includes(userRole)) {
        return { allowed: true, userRole }
      }
      // Access denied - redirect to home
      return { allowed: false, redirectTo: '/', userRole }
    }
  }
  
  // Default: allow for known paths, deny for unknown
  return { allowed: true, userRole }
}

/**
 * Match path pattern (simple implementation)
 */
function matchPath(pattern: string, pathname: string): boolean {
  // Handle [id] patterns
  const regexPattern = pattern
    .replace(/\[id\]/g, '[^/]+')
    .replace(/\//g, '\\/')
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(pathname)
}

/**
 * Check if user can access specific feature
 */
export function hasFeaturePermission(feature: keyof typeof FEATURE_PERMISSIONS, userRole?: string): boolean {
  if (!userRole) return false
  
  const allowedRoles = FEATURE_PERMISSIONS[feature]
  return allowedRoles.includes(userRole as UserRole)
}

/**
 * Check if user owns the resource or is admin
 */
export async function checkOwnership(
  userId: string,
  userRole: string,
  ownerId: string
): Promise<boolean> {
  // Admin can access everything
  if (userRole === 'ADMIN') return true
  
  // PM can access their own resources
  if (userRole === 'PM' && userId === ownerId) return true
  
  return false
}

/**
 * Get accessible pages for user role
 */
export function getAccessiblePages(userRole: string): string[] {
  const pages: string[] = []
  
  for (const [page, allowedRoles] of Object.entries(PAGE_PERMISSIONS)) {
    if (allowedRoles.includes(userRole as UserRole)) {
      pages.push(page)
    }
  }
  
  return pages
}

/**
 * Server-side page access check (for use in page components)
 */
export async function requireAuth(requiredRole?: UserRole) {
  const session = await auth()
  
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  
  if (requiredRole && !hasRole(requiredRole, session.user.role)) {
    throw new Error('FORBIDDEN')
  }
  
  return session
}

/**
 * API route permission check helper
 */
export async function checkApiPermission(requiredRoles: UserRole[]) {
  const session = await auth()
  
  if (!session?.user?.role) {
    return { 
      allowed: false, 
      error: new NextResponse('Unauthorized', { status: 401 }) 
    }
  }
  
  const userRole = session.user.role as UserRole
  
  if (!requiredRoles.includes(userRole)) {
    return { 
      allowed: false, 
      error: new NextResponse('Forbidden', { status: 403 }) 
    }
  }
  
  return { allowed: true, user: session.user }
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole?: string): boolean {
  return userRole === 'ADMIN'
}

/**
 * Check if user is PM or above
 */
export function isPMOrAbove(userRole?: string): boolean {
  return userRole === 'ADMIN' || userRole === 'PM'
}
