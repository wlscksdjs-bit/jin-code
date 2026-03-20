'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const budgetSchema = z.object({
  projectId: z.string().min(1),
  type: z.string().default('INITIAL'),
  sourceType: z.string().optional(),
  sourceSalesId: z.string().optional(),
  totalBudget: z.number().default(0),
  laborCost: z.number().default(0),
  materialCost: z.number().default(0),
  outsourceCost: z.number().default(0),
  equipmentCost: z.number().default(0),
  otherCost: z.number().default(0),
  indirectCostRate: z.number().default(0),
  sellingAdminCostRate: z.number().default(12),
  profitMargin: z.number().default(0),
  status: z.string().default('DRAFT'),
  effectiveDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    wbsCode: z.string().optional(),
    name: z.string(),
    category: z.string().optional(),
    plannedAmount: z.number(),
    previousAmount: z.number().default(0),
    currentAmount: z.number().default(0),
    actualAmount: z.number().default(0),
    sortOrder: z.number().default(0),
    description: z.string().optional(),
  })).optional(),
})

export async function listBudgets(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.budget.findMany({
    where: { projectId },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      sales: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getBudget(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.budget.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      sales: true,
      project: true,
    },
  })
}

export async function createBudget(data: z.infer<typeof budgetSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = budgetSchema.parse(data)
  const actualCost = parsed.laborCost + parsed.materialCost + parsed.outsourceCost + parsed.equipmentCost + parsed.otherCost
  const estimatedProfit = parsed.totalBudget - actualCost
  const profitMargin = parsed.totalBudget > 0 ? (estimatedProfit / parsed.totalBudget) * 100 : 0

  const { items, ...budgetData } = parsed

  const budget = await prisma.budget.create({
    data: {
      ...budgetData,
      actualCost,
      profitMargin,
      effectiveDate: parsed.effectiveDate ? new Date(parsed.effectiveDate) : null,
      items: items ? {
        create: items.map((item, idx) => ({
          ...item,
          sortOrder: item.sortOrder || idx,
        })),
      } : undefined,
    },
    include: { items: true },
  })

  revalidatePath(`/projects/${parsed.projectId}`)
  revalidatePath(`/budget`)
  revalidatePath(`/budget/${parsed.projectId}`)
  return budget
}

export async function updateBudget(id: string, data: Partial<z.infer<typeof budgetSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = budgetSchema.partial().parse(data)
  const actualCost = (parsed.laborCost ?? 0) + (parsed.materialCost ?? 0) + (parsed.outsourceCost ?? 0) +
    (parsed.equipmentCost ?? 0) + (parsed.otherCost ?? 0)
  const totalBudget = parsed.totalBudget ?? 0
  const estimatedProfit = totalBudget - actualCost
  const profitMargin = totalBudget > 0 ? (estimatedProfit / totalBudget) * 100 : 0

  const { items, ...budgetData } = parsed

  const budget = await prisma.budget.update({
    where: { id },
    data: {
      ...budgetData,
      actualCost,
      profitMargin,
      effectiveDate: parsed.effectiveDate ? new Date(parsed.effectiveDate) : undefined,
      items: items ? {
        deleteMany: { budgetId: id },
        create: items.map((item, idx) => ({
          ...item,
          sortOrder: item.sortOrder || idx,
        })),
      } : undefined,
    },
    include: { items: true },
  })

  revalidatePath(`/projects/${budget.projectId}`)
  revalidatePath(`/budget`)
  revalidatePath(`/budget/${budget.projectId}`)
  return budget
}

export async function deleteBudget(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const budget = await prisma.budget.findUnique({ where: { id } })
  if (!budget) throw new Error('Not found')

  await prisma.budget.delete({ where: { id } })

  revalidatePath(`/projects/${budget.projectId}`)
  revalidatePath(`/budget`)
  revalidatePath(`/budget/${budget.projectId}`)
}
