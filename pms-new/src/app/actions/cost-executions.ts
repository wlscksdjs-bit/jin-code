'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const COST_FIELDS = [
  'materialCost', 'laborCost', 'outsourceFabrication', 'outsourceService',
  'consumableOther', 'consumableSafety', 'travelExpense', 'insuranceWarranty',
  'dormitoryCost', 'miscellaneous', 'paymentFeeOther', 'rentalForklift',
  'rentalOther', 'vehicleRepair', 'vehicleFuel', 'vehicleOther',
  'welfareBusiness', 'reserveFund', 'indirectCost',
] as const

type CostInput = { [K in (typeof COST_FIELDS)[number]]: number }

function calcCosts(data: CostInput, contractAmount: number, sellingAdminRate: number) {
  const totalDirectCost = data.materialCost + data.laborCost + data.outsourceFabrication + data.outsourceService
  const totalManufacturingCost = totalDirectCost + data.consumableOther + data.consumableSafety +
    data.travelExpense + data.insuranceWarranty + data.dormitoryCost + data.miscellaneous +
    data.paymentFeeOther + data.rentalForklift + data.rentalOther + data.vehicleRepair +
    data.vehicleFuel + data.vehicleOther + data.welfareBusiness + data.reserveFund + data.indirectCost
  const sellingAdminCost = totalManufacturingCost * (sellingAdminRate / 100)
  const grossProfit = contractAmount - totalManufacturingCost
  const operatingProfit = grossProfit - sellingAdminCost
  const profitRate = contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0
  return { totalDirectCost, totalManufacturingCost, sellingAdminCost, grossProfit, operatingProfit, profitRate }
}

function toCostInput(data: Record<string, unknown>): CostInput {
  return {
    materialCost: (data.materialCost as number) ?? 0,
    laborCost: (data.laborCost as number) ?? 0,
    outsourceFabrication: (data.outsourceFabrication as number) ?? 0,
    outsourceService: (data.outsourceService as number) ?? 0,
    consumableOther: (data.consumableOther as number) ?? 0,
    consumableSafety: (data.consumableSafety as number) ?? 0,
    travelExpense: (data.travelExpense as number) ?? 0,
    insuranceWarranty: (data.insuranceWarranty as number) ?? 0,
    dormitoryCost: (data.dormitoryCost as number) ?? 0,
    miscellaneous: (data.miscellaneous as number) ?? 0,
    paymentFeeOther: (data.paymentFeeOther as number) ?? 0,
    rentalForklift: (data.rentalForklift as number) ?? 0,
    rentalOther: (data.rentalOther as number) ?? 0,
    vehicleRepair: (data.vehicleRepair as number) ?? 0,
    vehicleFuel: (data.vehicleFuel as number) ?? 0,
    vehicleOther: (data.vehicleOther as number) ?? 0,
    welfareBusiness: (data.welfareBusiness as number) ?? 0,
    reserveFund: (data.reserveFund as number) ?? 0,
    indirectCost: (data.indirectCost as number) ?? 0,
  }
}

const baseCostSchema = z.object({
  materialCost: z.number().default(0),
  laborCost: z.number().default(0),
  outsourceFabrication: z.number().default(0),
  outsourceService: z.number().default(0),
  consumableOther: z.number().default(0),
  consumableSafety: z.number().default(0),
  travelExpense: z.number().default(0),
  insuranceWarranty: z.number().default(0),
  dormitoryCost: z.number().default(0),
  miscellaneous: z.number().default(0),
  paymentFeeOther: z.number().default(0),
  rentalForklift: z.number().default(0),
  rentalOther: z.number().default(0),
  vehicleRepair: z.number().default(0),
  vehicleFuel: z.number().default(0),
  vehicleOther: z.number().default(0),
  welfareBusiness: z.number().default(0),
  reserveFund: z.number().default(0),
  indirectCost: z.number().default(0),
})

const executionSchema = baseCostSchema.extend({
  projectId: z.string().min(1),
  costEstimateId: z.string().optional(),
  type: z.string().optional(),
  periodYear: z.number(),
  periodMonth: z.number(),
  status: z.string().default('DRAFT'),
  contractAmount: z.number().default(0),
  sellingAdminRate: z.number().default(12),
  description: z.string().optional(),
  recordedDate: z.string().optional(),
})

export async function listCostExecutions(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.costExecution.findMany({
    where: { projectId },
    include: { project: true, costEstimate: true },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
  })
}

export async function getCostExecution(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.costExecution.findUnique({
    where: { id },
    include: { project: true, costEstimate: true, items: { include: { costCategory: true } } },
  })
}

export async function createCostExecution(data: z.infer<typeof executionSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const duplicate = await prisma.costExecution.findFirst({
    where: { projectId: data.projectId, periodYear: data.periodYear, periodMonth: data.periodMonth },
  })
  if (duplicate) throw new Error(`${data.periodYear}-${String(data.periodMonth).padStart(2, '0')} already exists`)
  const calc = calcCosts(toCostInput(data), data.contractAmount, data.sellingAdminRate)
  const execution = await prisma.costExecution.create({
    data: {
      projectId: data.projectId,
      costEstimateId: data.costEstimateId,
      type: data.type,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      status: data.status,
      contractAmount: data.contractAmount,
      sellingAdminRate: data.sellingAdminRate,
      description: data.description,
      recordedDate: data.recordedDate ? new Date(data.recordedDate) : null,
      ...toCostInput(data),
      ...calc,
    },
  })
  revalidatePath(`/projects/${data.projectId}`)
  revalidatePath(`/cost/${data.projectId}/execution`)
  return execution
}

export async function updateCostExecution(id: string, data: Partial<z.infer<typeof executionSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.costExecution.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')
  if (data.periodYear !== undefined || data.periodMonth !== undefined) {
    const duplicate = await prisma.costExecution.findFirst({
      where: {
        projectId: existing.projectId,
        periodYear: data.periodYear ?? existing.periodYear,
        periodMonth: data.periodMonth ?? existing.periodMonth,
        id: { not: id },
      },
    })
    if (duplicate) throw new Error('Duplicate period')
  }
  const merged = { ...existing, ...data }
  const calc = calcCosts(toCostInput(merged), merged.contractAmount, merged.sellingAdminRate)
  const execution = await prisma.costExecution.update({
    where: { id },
    data: {
      periodYear: data.periodYear ?? existing.periodYear,
      periodMonth: data.periodMonth ?? existing.periodMonth,
      status: data.status ?? existing.status,
      contractAmount: data.contractAmount ?? existing.contractAmount,
      sellingAdminRate: data.sellingAdminRate ?? existing.sellingAdminRate,
      description: data.description ?? existing.description,
      recordedDate: data.recordedDate ? new Date(data.recordedDate) : undefined,
      ...toCostInput(merged),
      ...calc,
    },
  })
  revalidatePath(`/projects/${execution.projectId}`)
  revalidatePath(`/cost/${execution.projectId}/execution`)
  revalidatePath(`/cost/${execution.projectId}/execution/${id}`)
  return execution
}

export async function deleteCostExecution(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const execution = await prisma.costExecution.findUnique({ where: { id } })
  if (!execution) throw new Error('Not found')
  await prisma.costExecution.delete({ where: { id } })
  revalidatePath(`/projects/${execution.projectId}`)
  revalidatePath(`/cost/${execution.projectId}/execution`)
}

const COST_KEY_MAP: Record<string, string> = {
  materialCost: '재료비',
  laborCost: '노무비',
  outsourceFabrication: '외주비(제작)',
  outsourceService: '외주비(용역)',
  consumableOther: '소모품/기타',
  consumableSafety: '안전용품',
  travelExpense: '여비교통비',
  insuranceWarranty: '보험/보증',
  dormitoryCost: '숙소비',
  miscellaneous: '잡비',
  paymentFeeOther: '지급수수료',
  rentalForklift: '장비임대(지게차)',
  rentalOther: '장비임대(기타)',
  vehicleRepair: '차량수리비',
  vehicleFuel: '차량유류비',
  vehicleOther: '차량기타',
  welfareBusiness: '복리후생',
  reserveFund: '예비비',
  indirectCost: '간접비',
}

export async function updateBudgetFromProject(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const executions = await prisma.costExecution.findMany({
    where: { projectId },
  })

  const totals: Record<string, number> = {}
  for (const key of COST_FIELDS) {
    totals[key] = 0
  }

  for (const execution of executions) {
    for (const key of COST_FIELDS) {
      totals[key] += (execution as Record<string, number>)[key] || 0
    }
  }

  const budgets = await prisma.budget.findMany({
    where: { projectId },
    include: { items: true },
  })

  for (const budget of budgets) {
    for (const item of budget.items) {
      const key = Object.entries(COST_KEY_MAP).find(([, name]) => name === item.name)?.[0]
      if (key && totals[key] !== undefined) {
        await prisma.budgetItem.update({
          where: { id: item.id },
          data: { actualAmount: totals[key] },
        })
      }
    }

    const totalActual = Object.values(totals).reduce((s, v) => s + v, 0)
    await prisma.budget.update({
      where: { id: budget.id },
      data: { actualCost: totalActual },
    })
  }

  revalidatePath(`/budget/${projectId}`)
}
