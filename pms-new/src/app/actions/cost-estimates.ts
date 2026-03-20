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

const estimateSchema = baseCostSchema.extend({
  projectId: z.string().min(1),
  title: z.string().min(1),
  version: z.string().default('1.0'),
  status: z.string().default('DRAFT'),
  contractAmount: z.number().default(0),
  sellingAdminRate: z.number().default(12),
  estimatedDate: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
})

export async function listCostEstimates(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.costEstimate.findMany({
    where: { projectId },
    include: { project: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCostEstimate(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.costEstimate.findUnique({
    where: { id },
    include: {
      project: true,
      items: { include: { costCategory: true }, orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function createCostEstimate(data: z.infer<typeof estimateSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const calc = calcCosts(toCostInput(data), data.contractAmount, data.sellingAdminRate)
  const estimate = await prisma.costEstimate.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      version: data.version,
      status: data.status,
      contractAmount: data.contractAmount,
      sellingAdminRate: data.sellingAdminRate,
      estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      notes: data.notes,
      ...toCostInput(data),
      ...calc,
    },
  })
  revalidatePath(`/projects/${data.projectId}`)
  revalidatePath(`/cost/${data.projectId}/estimate`)
  return estimate
}

export async function updateCostEstimate(id: string, data: Partial<z.infer<typeof estimateSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.costEstimate.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')
  const merged = { ...existing, ...data }
  const calc = calcCosts(toCostInput(merged), merged.contractAmount, merged.sellingAdminRate)
  const estimate = await prisma.costEstimate.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      version: data.version ?? existing.version,
      status: data.status ?? existing.status,
      contractAmount: data.contractAmount ?? existing.contractAmount,
      sellingAdminRate: data.sellingAdminRate ?? existing.sellingAdminRate,
      estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes ?? existing.notes,
      ...toCostInput(merged),
      ...calc,
    },
  })
  revalidatePath(`/projects/${estimate.projectId}`)
  revalidatePath(`/cost/${estimate.projectId}/estimate`)
  revalidatePath(`/cost/${estimate.projectId}/estimate/${id}`)
  return estimate
}

export async function deleteCostEstimate(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const estimate = await prisma.costEstimate.findUnique({ where: { id } })
  if (!estimate) throw new Error('Not found')
  await prisma.costEstimate.delete({ where: { id } })
  revalidatePath(`/projects/${estimate.projectId}`)
  revalidatePath(`/cost/${estimate.projectId}/estimate`)
}

export async function listCostCategories() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.costCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })
}
