import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getProjects, POST as postProject } from '@/app/api/projects/route'
import { GET as getDashboard } from '@/app/api/dashboard/route'
import { GET as getEstimates, POST as postEstimate } from '@/app/api/cost-estimates/route'
import { NextResponse } from 'next/server'

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
        { id: '1', code: 'PJT001', name: 'Test Project', status: 'REGISTERED', isActive: true },
      ])),
      create: vi.fn((args) => Promise.resolve({ id: 'new-pjt-id', ...args.data })),
      count: vi.fn(() => Promise.resolve(10)),
      groupBy: vi.fn(() => Promise.resolve([{ status: 'CONTRACT', _count: 5 }])),
    },
    costEstimate: {
      findMany: vi.fn(() => Promise.resolve([
        { id: '1', title: 'Test Estimate', projectId: '1' },
      ])),
      create: vi.fn((args) => Promise.resolve({ id: 'new-est-id', ...args.data })),
    },
    sales: {
      count: vi.fn(() => Promise.resolve(5)),
    },
    purchaseOrder: {
      count: vi.fn(() => Promise.resolve(3)),
    },
    notification: {
      findMany: vi.fn(() => Promise.resolve([])),
    },
  },
}))

describe('API Unit Tests', () => {
  describe('Projects API', () => {
    it('GET /api/projects returns project list', async () => {
      const response = await getProjects()
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data[0].code).toBe('PJT001')
    })

    it('POST /api/projects creates a new project', async () => {
      const mockRequest = {
        json: vi.fn(() => Promise.resolve({
          code: 'PJT-NEW',
          name: 'New Project',
          type: 'CONSTRUCTION',
          customerId: 'cust-1',
        })),
      } as unknown as Request

      const response = await postProject(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.code).toBe('PJT-NEW')
    })
  })

  describe('Dashboard API', () => {
    it('GET /api/dashboard returns dashboard stats', async () => {
      const response = await getDashboard()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stats).toBeDefined()
      expect(data.stats.totalProjects).toBe(10)
      expect(data.projectStats).toBeDefined()
    })
  })

  describe('Cost Estimates API', () => {
    it('GET /api/cost-estimates returns estimates', async () => {
      const response = await getEstimates()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('POST /api/cost-estimates creates a new estimate', async () => {
      const mockRequest = {
        json: vi.fn(() => Promise.resolve({
          projectId: '1',
          title: 'New Estimate',
          version: '1.0',
        })),
      } as unknown as Request

      const response = await postEstimate(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe('New Estimate')
    })
  })
})
