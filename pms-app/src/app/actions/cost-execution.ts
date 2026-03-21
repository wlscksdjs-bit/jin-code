'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { calculateProfit } from '@/lib/cost-calculation'
import { checkBudgetOverrun } from './alerts'
import { invalidateDashboard } from './dashboard'

export interface CreateCostExecutionInput {
  projectId: string
  costEstimateId?: string
  type: string
  periodYear: number
  periodMonth?: number
  description?: string
  items?: Array<{
    categoryType: string
    subCategory?: string
    itemName: string
    specification?: string
    unit?: string
    quantity?: number
    unitPrice?: number
    amount: number
    vendor?: string
    occurDate?: Date
  }>
  costs?: {
    materialCost?: number
    laborCost?: number
    outsourceFabrication?: number
    outsourceService?: number
    consumableOther?: number
    consumableSafety?: number
    travelExpense?: number
    insuranceWarranty?: number
    dormitoryCost?: number
    miscellaneous?: number
    paymentFeeOther?: number
    rentalForklift?: number
    rentalOther?: number
    vehicleRepair?: number
    vehicleFuel?: number
    vehicleOther?: number
    welfareBusiness?: number
    reserveFund?: number
    indirectCost?: number
  }
}

export async function createCostExecution(input: CreateCostExecutionInput) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    return { success: false, error: '권한이 없습니다.' }
  }

  try {
    const costs = input.costs || {}
    
    const totalExpense = 
      (costs.outsourceFabrication || 0) +
      (costs.outsourceService || 0) +
      (costs.consumableOther || 0) +
      (costs.consumableSafety || 0) +
      (costs.travelExpense || 0) +
      (costs.insuranceWarranty || 0) +
      (costs.dormitoryCost || 0) +
      (costs.miscellaneous || 0) +
      (costs.paymentFeeOther || 0) +
      (costs.rentalForklift || 0) +
      (costs.rentalOther || 0) +
      (costs.vehicleRepair || 0) +
      (costs.vehicleFuel || 0) +
      (costs.vehicleOther || 0) +
      (costs.welfareBusiness || 0) +
      (costs.reserveFund || 0)

    const totalDirectCost = (costs.materialCost || 0) + (costs.laborCost || 0) + totalExpense
    const totalManufacturingCost = totalDirectCost + (costs.indirectCost || 0)

    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { contractAmount: true }
    })

    const contractAmount = project?.contractAmount || 0
    const sellingAdminRate = 12
    const sellingAdminCost = contractAmount * (sellingAdminRate / 100)
    const grossProfit = contractAmount - totalManufacturingCost
    const operatingProfit = grossProfit - sellingAdminCost

    const execution = await prisma.costExecution.create({
      data: {
        projectId: input.projectId,
        costEstimateId: input.costEstimateId,
        type: input.type,
        periodYear: input.periodYear,
        periodMonth: input.periodMonth,
        status: 'DRAFT',
        contractAmount,
        sellingAdminRate,
        materialCost: costs.materialCost || 0,
        laborCost: costs.laborCost || 0,
        outsourceFabrication: costs.outsourceFabrication || 0,
        outsourceService: costs.outsourceService || 0,
        consumableOther: costs.consumableOther || 0,
        consumableSafety: costs.consumableSafety || 0,
        travelExpense: costs.travelExpense || 0,
        insuranceWarranty: costs.insuranceWarranty || 0,
        dormitoryCost: costs.dormitoryCost || 0,
        miscellaneous: costs.miscellaneous || 0,
        paymentFeeOther: costs.paymentFeeOther || 0,
        rentalForklift: costs.rentalForklift || 0,
        rentalOther: costs.rentalOther || 0,
        vehicleRepair: costs.vehicleRepair || 0,
        vehicleFuel: costs.vehicleFuel || 0,
        vehicleOther: costs.vehicleOther || 0,
        welfareBusiness: costs.welfareBusiness || 0,
        reserveFund: costs.reserveFund || 0,
        indirectCost: costs.indirectCost || 0,
        totalExpense,
        totalDirectCost,
        totalManufacturingCost,
        sellingAdminCost,
        grossProfit,
        operatingProfit,
        description: input.description,
        items: input.items ? {
          create: input.items.map((item, idx) => ({
            categoryType: item.categoryType,
            subCategory: item.subCategory,
            itemName: item.itemName,
            specification: item.specification,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            vendor: item.vendor,
            occurDate: item.occurDate,
          }))
        } : undefined
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        items: true
      }
    })

    await prisma.notification.create({
      data: {
        type: 'PROJECT_UPDATE',
        title: '월별 원가 등록',
        message: `${input.periodYear}년 ${input.periodMonth || ''}월 원가가 등록되었습니다.`,
        userId: session.user.id,
        link: `/cost/execution/${execution.id}`,
      },
    })

    await checkBudgetOverrun(input.projectId, session.user.id)
    await invalidateDashboard(input.projectId)

    revalidatePath('/cost')
    revalidatePath(`/projects/${input.projectId}`)
    revalidatePath('/')

    return { success: true, execution }
  } catch (error) {
    console.error('Error creating cost execution:', error)
    return { success: false, error: '월별 원가 생성 중 오류가 발생했습니다.' }
  }
}

export async function getCostExecutions(projectId?: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  const where = projectId ? { projectId } : {}

  return prisma.costExecution.findMany({
    where,
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    include: {
      project: { select: { id: true, name: true, code: true } },
      items: true
    }
  })
}

export async function getMonthlyCostSummary(projectId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  const executions = await prisma.costExecution.findMany({
    where: { projectId },
    orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
    select: {
      id: true,
      periodYear: true,
      periodMonth: true,
      totalManufacturingCost: true,
      operatingProfit: true,
      contractAmount: true,
      grossProfit: true,
      status: true
    }
  })

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { contractAmount: true, name: true }
  })

  let cumulativeCost = 0
  const monthlyData = executions.map(exec => {
    cumulativeCost += exec.totalManufacturingCost
    return {
      id: exec.id,
      period: `${exec.periodYear}-${String(exec.periodMonth || 1).padStart(2, '0')}`,
      year: exec.periodYear,
      month: exec.periodMonth,
      cost: exec.totalManufacturingCost,
      profit: exec.operatingProfit,
      grossProfit: exec.grossProfit,
      cumulativeCost,
      contractAmount: exec.contractAmount,
      remaining: (project?.contractAmount || 0) - cumulativeCost,
      status: exec.status
    }
  })

  return {
    project: project,
    monthlyData,
    totalCost: cumulativeCost,
    budget: project?.contractAmount || 0,
    usageRate: project?.contractAmount ? (cumulativeCost / project.contractAmount) * 100 : 0
  }
}

export async function deleteCostExecution(id: string) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'ADMIN 권한이 필요합니다.' }
  }

  try {
    const execution = await prisma.costExecution.findUnique({
      where: { id },
      select: { projectId: true }
    })

    if (!execution) {
      return { success: false, error: '원가를 찾을 수 없습니다.' }
    }

    await prisma.costExecution.delete({ where: { id } })

    revalidatePath('/cost')
    revalidatePath(`/projects/${execution.projectId}`)

    return { success: true }
  } catch (error) {
    return { success: false, error: '삭제 중 오류가 발생했습니다.' }
  }
}
