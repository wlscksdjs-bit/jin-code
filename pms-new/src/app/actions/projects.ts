'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const projectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  status: z.string().default('REGISTERED'),
  contractType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  contractDate: z.string().optional(),
  contractAmount: z.number().default(0),
  estimatedBudget: z.number().default(0),
  location: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  customerId: z.string().optional(),
})

export async function listProjects(search?: string, status?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.project.findMany({
    where: {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
        ],
      }),
      ...(status && { status }),
    },
    include: {
      customer: true,
      members: { include: { user: true } },
      _count: { select: { budgets: true, costEstimates: true, costExecutions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProject(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      members: { include: { user: true } },
      budgets: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      costEstimates: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      costExecutions: { include: { items: true }, orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }] },
      cashFlows: { orderBy: { plannedDate: 'asc' } },
      purchaseOrders: { include: { vendor: true }, orderBy: { createdAt: 'desc' } },
      wbsItems: { orderBy: { sortOrder: 'asc' } },
      workflow: true,
      dashboard: true,
    },
  })
}

export async function createProject(data: z.infer<typeof projectSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = projectSchema.parse(data)

  const project = await prisma.project.create({
    data: {
      ...parsed,
      startDate: parsed.startDate ? new Date(parsed.startDate) : null,
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      contractDate: parsed.contractDate ? new Date(parsed.contractDate) : null,
    },
    include: { customer: true },
  })

  await prisma.projectWorkflow.create({
    data: {
      projectId: project.id,
      currentPhase: 'BIDDING',
    },
  })

  revalidatePath('/projects')
  revalidatePath('/')
  return project
}

export async function updateProject(id: string, data: Partial<z.infer<typeof projectSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = projectSchema.partial().parse(data)

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...parsed,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      contractDate: parsed.contractDate ? new Date(parsed.contractDate) : undefined,
    },
    include: { customer: true },
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath('/')
  return project
}

export async function deleteProject(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await prisma.project.update({
    where: { id },
    data: { isActive: false },
  })

  revalidatePath('/projects')
  revalidatePath('/')
}

export async function listCustomers() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

// ... 기존 코드(listCustomers 함수) 아래에 추가 ...

// 빌드 에러 방지용 임시 함수: 견적 원가 불러오기
export async function getCostEstimate(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // 아직 실제 로직이 없다면 임시로 빈 배열이나 null을 반환합니다.
  return null;
}

// 빌드 에러 방지용 임시 함수: 실행 원가 불러오기
export async function getCostExecution(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // 아직 실제 로직이 없다면 임시로 빈 배열을 반환합니다.
  return [];
}