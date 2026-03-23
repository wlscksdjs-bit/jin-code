'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface ConfirmContractOptions {
  contractAmount: number
  estimateId: string
  startDate?: Date
  endDate?: Date
}

export async function confirmContract(projectId: string, options: ConfirmContractOptions) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const estimate = await prisma.costEstimate.findUnique({
    where: { id: options.estimateId },
    include: { project: true },
  })
  if (!estimate) throw new Error('Estimate not found')

  const BUDGET_ITEMS = [
    { name: '재료비', key: 'materialCost', category: 'DIRECT' },
    { name: '노무비', key: 'laborCost', category: 'DIRECT' },
    { name: '외주비(제작)', key: 'outsourceFabrication', category: 'DIRECT' },
    { name: '외주비(용역)', key: 'outsourceService', category: 'DIRECT' },
    { name: '소모품/기타', key: 'consumableOther', category: 'INDIRECT' },
    { name: '안전용품', key: 'consumableSafety', category: 'INDIRECT' },
    { name: '여비교통비', key: 'travelExpense', category: 'INDIRECT' },
    { name: '보험/보증', key: 'insuranceWarranty', category: 'INDIRECT' },
    { name: '숙소비', key: 'dormitoryCost', category: 'INDIRECT' },
    { name: '잡비', key: 'miscellaneous', category: 'INDIRECT' },
    { name: '지급수수료', key: 'paymentFeeOther', category: 'INDIRECT' },
    { name: '장비임대(지게차)', key: 'rentalForklift', category: 'INDIRECT' },
    { name: '장비임대(기타)', key: 'rentalOther', category: 'INDIRECT' },
    { name: '차량수리비', key: 'vehicleRepair', category: 'INDIRECT' },
    { name: '차량유류비', key: 'vehicleFuel', category: 'INDIRECT' },
    { name: '차량기타', key: 'vehicleOther', category: 'INDIRECT' },
    { name: '복리후생', key: 'welfareBusiness', category: 'INDIRECT' },
    { name: '예비비', key: 'reserveFund', category: 'INDIRECT' },
    { name: '간접비', key: 'indirectCost', category: 'INDIRECT' },
  ]

  const budget = await prisma.budget.create({
    data: {
      projectId: estimate.projectId,
      type: 'INITIAL',
      sourceType: 'ESTIMATE',
      sourceSalesId: undefined,
      totalBudget: options.contractAmount,
      materialCost: estimate.materialCost,
      laborCost: estimate.laborCost,
      outsourceCost: estimate.outsourceFabrication + estimate.outsourceService,
      equipmentCost: 0,
      otherCost: 0,
      actualCost: 0,
      sellingAdminCostRate: estimate.sellingAdminRate,
      status: 'APPROVED',
      effectiveDate: options.startDate || new Date(),
      items: {
        create: BUDGET_ITEMS.map((item, idx) => ({
          name: item.name,
          category: item.category,
          plannedAmount: (estimate as Record<string, number>)[item.key] || 0,
          actualAmount: 0,
          sortOrder: idx,
        })),
      },
    },
    include: { items: true },
  })

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'CONTRACT',
      contractAmount: options.contractAmount,
      contractDate: options.startDate || new Date(),
      startDate: options.startDate,
      endDate: options.endDate,
    },
  })

  await prisma.costEstimate.update({
    where: { id: options.estimateId },
    data: { status: 'APPROVED' },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/budget/${projectId}`)
  revalidatePath(`/cost/${projectId}/estimate`)
  revalidatePath(`/cost/${projectId}`)

  return { budget, success: true }
}

export async function initializeBudgetFromEstimate(projectId: string, estimateId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const estimate = await prisma.costEstimate.findUnique({
    where: { id: estimateId },
    include: { project: true },
  })
  if (!estimate) throw new Error('Estimate not found')

  const BUDGET_ITEMS = [
    { name: '재료비', key: 'materialCost', category: 'DIRECT' },
    { name: '노무비', key: 'laborCost', category: 'DIRECT' },
    { name: '외주비(제작)', key: 'outsourceFabrication', category: 'DIRECT' },
    { name: '외주비(용역)', key: 'outsourceService', category: 'DIRECT' },
    { name: '소모품/기타', key: 'consumableOther', category: 'INDIRECT' },
    { name: '안전용품', key: 'consumableSafety', category: 'INDIRECT' },
    { name: '여비교통비', key: 'travelExpense', category: 'INDIRECT' },
    { name: '보험/보증', key: 'insuranceWarranty', category: 'INDIRECT' },
    { name: '숙소비', key: 'dormitoryCost', category: 'INDIRECT' },
    { name: '잡비', key: 'miscellaneous', category: 'INDIRECT' },
    { name: '지급수수료', key: 'paymentFeeOther', category: 'INDIRECT' },
    { name: '장비임대(지게차)', key: 'rentalForklift', category: 'INDIRECT' },
    { name: '장비임대(기타)', key: 'rentalOther', category: 'INDIRECT' },
    { name: '차량수리비', key: 'vehicleRepair', category: 'INDIRECT' },
    { name: '차량유류비', key: 'vehicleFuel', category: 'INDIRECT' },
    { name: '차량기타', key: 'vehicleOther', category: 'INDIRECT' },
    { name: '복리후생', key: 'welfareBusiness', category: 'INDIRECT' },
    { name: '예비비', key: 'reserveFund', category: 'INDIRECT' },
    { name: '간접비', key: 'indirectCost', category: 'INDIRECT' },
  ]

  const budget = await prisma.budget.create({
    data: {
      projectId,
      type: 'INITIAL',
      sourceType: 'ESTIMATE',
      totalBudget: estimate.totalManufacturingCost,
      materialCost: estimate.materialCost,
      laborCost: estimate.laborCost,
      outsourceCost: estimate.outsourceFabrication + estimate.outsourceService,
      actualCost: 0,
      sellingAdminCostRate: estimate.sellingAdminRate,
      status: 'DRAFT',
      effectiveDate: new Date(),
      items: {
        create: BUDGET_ITEMS.map((item, idx) => ({
          name: item.name,
          category: item.category,
          plannedAmount: (estimate as Record<string, number>)[item.key] || 0,
          actualAmount: 0,
          sortOrder: idx,
        })),
      },
    },
    include: { items: true },
  })

  revalidatePath(`/budget/${projectId}`)
  revalidatePath(`/cost/${projectId}/estimate`)

  return budget
}
