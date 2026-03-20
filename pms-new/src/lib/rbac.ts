export type Role = 'ADMIN' | 'PM' | 'STAFF'
export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve'
export type Resource = 'project' | 'budget' | 'cost' | 'order' | 'vendor' | 'user' | 'sales' | 'wbs' | 'finance' | 'notification'

const permissionMatrix: Record<Role, Partial<Record<Resource, Action[]>>> = {
  ADMIN: {
    project: ['create', 'read', 'update', 'delete'],
    budget: ['create', 'read', 'update', 'delete', 'approve'],
    cost: ['create', 'read', 'update', 'delete'],
    order: ['create', 'read', 'update', 'delete'],
    vendor: ['create', 'read', 'update', 'delete'],
    user: ['create', 'read', 'update', 'delete'],
    sales: ['create', 'read', 'update', 'delete'],
    wbs: ['create', 'read', 'update', 'delete'],
    finance: ['create', 'read', 'update', 'delete'],
    notification: ['create', 'read', 'update', 'delete'],
  },
  PM: {
    project: ['create', 'read', 'update'],
    budget: ['create', 'read', 'update'],
    cost: ['create', 'read', 'update'],
    order: ['create', 'read', 'update'],
    vendor: ['create', 'read', 'update'],
    sales: ['create', 'read', 'update'],
    wbs: ['create', 'read', 'update'],
    finance: ['read'],
    notification: ['read', 'update'],
  },
  STAFF: {
    project: ['read'],
    budget: ['read'],
    cost: ['read'],
    order: ['read'],
    vendor: ['read'],
    sales: ['read'],
    wbs: ['read'],
    finance: ['read'],
    notification: ['read'],
  },
}

export function hasPermission(role: Role, action: Action, resource: Resource): boolean {
  const actions = permissionMatrix[role]?.[resource]
  return actions ? actions.includes(action) : false
}

export function canManage(role: Role, resource: Resource): boolean {
  return hasPermission(role, 'create', resource) || hasPermission(role, 'update', resource)
}

export function canApprove(role: Role): boolean {
  return hasPermission(role, 'approve', 'budget')
}

export function isAdmin(role: Role): boolean {
  return role === 'ADMIN'
}

export function isPM(role: Role): boolean {
  return role === 'PM'
}

export function isStaff(role: Role): boolean {
  return role === 'STAFF'
}
