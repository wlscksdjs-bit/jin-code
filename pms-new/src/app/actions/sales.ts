'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const salesSchema = z.object({
  type: z.string().default('BIDDING'),
  status: z.string().default('WAITING'),
  progress: z.number().default(0),
  title: z.string().min(1),
  bidNumber: z.string().optional(),
  bidAmount: z.number().default(0),
  winProbability: z.number().optional(),
  bidOpenDate: z.string().optional(),
  submissionDate: z.string().optional(),
  contractDate: z.string().optional(),
  contractAmount: z.number().default(0),
  customerId: z.string().optional(),
  managerId: z.string().optional(),
  laborCost: z.number().default(0),
  materialCost: z.number().default(0),
  outsourceCost: z.number().default(0),
  equipmentCost: z.number().default(0),
  otherCost: z.number().default(0),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export async function listSales(status?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.sales.findMany({
    where: { ...(status ? { status } : {}) },
    include: { customer: true, manager: true, project: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSales(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.sales.findUnique({
    where: { id },
    include: { customer: true, manager: true, project: true },
  })
}

export async function createSales(data: z.infer<typeof salesSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const parsed = salesSchema.parse(data)
  const sales = await prisma.sales.create({
    data: {
      type: parsed.type,
      status: parsed.status,
      progress: parsed.progress ?? 0,
      title: parsed.title,
      bidNumber: parsed.bidNumber,
      bidAmount: parsed.bidAmount,
      winProbability: parsed.winProbability,
      bidOpenDate: parsed.bidOpenDate ? new Date(parsed.bidOpenDate) : null,
      submissionDate: parsed.submissionDate ? new Date(parsed.submissionDate) : null,
      contractDate: parsed.contractDate ? new Date(parsed.contractDate) : null,
      contractAmount: parsed.contractAmount,
      customerId: parsed.customerId,
      managerId: parsed.managerId,
      laborCost: parsed.laborCost ?? 0,
      materialCost: parsed.materialCost ?? 0,
      outsourceCost: parsed.outsourceCost ?? 0,
      equipmentCost: parsed.equipmentCost ?? 0,
      otherCost: parsed.otherCost ?? 0,
      description: parsed.description,
      notes: parsed.notes,
    },
    include: { customer: true },
  })
  revalidatePath('/sales')
  return sales
}

export async function updateSales(id: string, data: Partial<z.infer<typeof salesSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const parsed = salesSchema.partial().parse(data)
  const sales = await prisma.sales.update({
    where: { id },
    data: {
      ...parsed,
      bidOpenDate: parsed.bidOpenDate ? new Date(parsed.bidOpenDate) : undefined,
      submissionDate: parsed.submissionDate ? new Date(parsed.submissionDate) : undefined,
      contractDate: parsed.contractDate ? new Date(parsed.contractDate) : undefined,
    },
    include: { customer: true },
  })
  revalidatePath('/sales')
  return sales
}

export async function confirmContract(salesId: string, projectData: { code: string; name: string; contractAmount: number; startDate: string; endDate: string }) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const sales = await prisma.sales.findUnique({ where: { id: salesId } })
  if (!sales) throw new Error('Not found')

  const project = await prisma.project.create({
    data: {
      code: projectData.code,
      name: projectData.name,
      contractAmount: projectData.contractAmount,
      startDate: new Date(projectData.startDate),
      endDate: new Date(projectData.endDate),
      status: 'CONTRACT',
      customerId: sales.customerId ?? undefined,
    },
  })

  await prisma.projectWorkflow.create({
    data: {
      projectId: project.id,
      currentPhase: 'CONTRACT',
      salesId,
    },
  })

  await prisma.sales.update({
    where: { id: salesId },
    data: {
      status: 'WON',
      contractAmount: projectData.contractAmount,
      projectId: project.id,
    },
  })

  revalidatePath('/sales')
  revalidatePath('/projects')
  return { project, salesId }
}

export async function listCustomers() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
}
