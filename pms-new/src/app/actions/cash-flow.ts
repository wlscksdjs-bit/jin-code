'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const cashFlowSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(['INFLOW', 'OUTFLOW']),
  category: z.string().optional(),
  plannedAmount: z.number().default(0),
  actualAmount: z.number().default(0),
  plannedDate: z.string(),
  actualDate: z.string().optional(),
  status: z.string().default('PLANNED'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  description: z.string().optional(),
})

export async function listCashFlows(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.cashFlow.findMany({
    where: { projectId },
    orderBy: { plannedDate: 'asc' },
  })
}

export async function getCashFlow(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.cashFlow.findUnique({ where: { id } })
}

export async function createCashFlow(data: z.infer<typeof cashFlowSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const parsed = cashFlowSchema.parse(data)
  const cf = await prisma.cashFlow.create({
    data: {
      projectId: parsed.projectId,
      type: parsed.type,
      category: parsed.category,
      plannedAmount: parsed.plannedAmount,
      actualAmount: parsed.actualAmount,
      plannedDate: new Date(parsed.plannedDate),
      actualDate: parsed.actualDate ? new Date(parsed.actualDate) : null,
      status: parsed.status,
      referenceType: parsed.referenceType,
      referenceId: parsed.referenceId,
      description: parsed.description,
    },
  })
  revalidatePath(`/projects/${parsed.projectId}`)
  revalidatePath(`/projects/${parsed.projectId}/cashflow`)
  return cf
}

export async function updateCashFlow(id: string, data: Partial<z.infer<typeof cashFlowSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.cashFlow.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')
  const parsed = cashFlowSchema.partial().parse(data)
  const cf = await prisma.cashFlow.update({
    where: { id },
    data: {
      ...parsed,
      plannedDate: parsed.plannedDate ? new Date(parsed.plannedDate) : undefined,
      actualDate: parsed.actualDate ? new Date(parsed.actualDate) : undefined,
    },
  })
  revalidatePath(`/projects/${existing.projectId}`)
  revalidatePath(`/projects/${existing.projectId}/cashflow`)
  return cf
}

export async function deleteCashFlow(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.cashFlow.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')
  await prisma.cashFlow.delete({ where: { id } })
  revalidatePath(`/projects/${existing.projectId}`)
  revalidatePath(`/projects/${existing.projectId}/cashflow`)
}

export async function getCashFlowSummary(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const flows = await prisma.cashFlow.findMany({
    where: { projectId },
    orderBy: { plannedDate: 'asc' },
  })

  const inflows = flows.filter((f) => f.type === 'INFLOW')
  const outflows = flows.filter((f) => f.type === 'OUTFLOW')

  const totalPlannedInflow = inflows.reduce((s, f) => s + f.plannedAmount, 0)
  const totalActualInflow = inflows.reduce((s, f) => s + f.actualAmount, 0)
  const totalPlannedOutflow = outflows.reduce((s, f) => s + f.plannedAmount, 0)
  const totalActualOutflow = outflows.reduce((s, f) => s + f.actualAmount, 0)

  const balance = totalActualInflow - totalActualOutflow
  const plannedBalance = totalPlannedInflow - totalPlannedOutflow

  const months: Record<string, { inflow: number; outflow: number; net: number; balance: number }> = {}
  for (const f of flows) {
    const key = `${f.plannedDate.getFullYear()}-${String(f.plannedDate.getMonth() + 1).padStart(2, '0')}`
    if (!months[key]) months[key] = { inflow: 0, outflow: 0, net: 0, balance: 0 }
    if (f.type === 'INFLOW') months[key].inflow += f.actualAmount
    else months[key].outflow += f.actualAmount
    months[key].net = months[key].inflow - months[key].outflow
  }

  let runningBalance = 0
  for (const key of Object.keys(months).sort()) {
    runningBalance += months[key].net
    months[key].balance = runningBalance
  }

  return {
    totalPlannedInflow,
    totalActualInflow,
    totalPlannedOutflow,
    totalActualOutflow,
    balance,
    plannedBalance,
    months,
    totalFlows: flows.length,
  }
}
