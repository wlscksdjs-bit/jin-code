import { describe, it, expect, beforeEach, vi } from 'vitest'
import { listProjects } from '@/app/actions/projects'
import { listBudgets } from '@/app/actions/budgets'
import { listSales } from '@/app/actions/sales'

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
    },
  })),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    project: {
      findMany: vi.fn(() => Promise.resolve([
        { id: '1', code: 'PJT001', name: 'Test Project', status: 'REGISTERED' },
        { id: '2', code: 'PJT002', name: 'Another Project', status: 'CONTRACT' },
      ])),
      findUnique: vi.fn(),
    },
    budget: {
      findMany: vi.fn(() => Promise.resolve([
        { id: '1', projectId: '1', totalBudget: 1000000, status: 'DRAFT' },
      ])),
    },
    sales: {
      findMany: vi.fn(() => Promise.resolve([
        { id: '1', title: 'Test Sale', status: 'SUBMITTED' },
      ])),
    },
  },
}))

describe('Server Actions', () => {
  describe('Projects', () => {
    it('should list all projects', async () => {
      const projects = await listProjects()
      expect(Array.isArray(projects)).toBe(true)
      expect(projects.length).toBeGreaterThan(0)
    })
  })

  describe('Budgets', () => {
    it('should list budgets for a project', async () => {
      const budgets = await listBudgets('1')
      expect(Array.isArray(budgets)).toBe(true)
    })
  })

  describe('Sales', () => {
    it('should list all sales', async () => {
      const sales = await listSales()
      expect(Array.isArray(sales)).toBe(true)
    })
  })
})
