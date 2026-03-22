'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getMonthlySnapshots(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.monthlyCostSnapshot.findMany({
    where: { projectId },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  })
}

export async function getCostExecutionMonthlySummary(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const executions = await prisma.costExecution.findMany({
    where: { projectId },
    orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
  })

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { contractAmount: true },
  })

  const contractAmount = project?.contractAmount ?? 0

  let cumMaterial = 0
  let cumLabor = 0
  let cumOutsource = 0
  let cumEquipment = 0
  let cumOther = 0
  let cumTotal = 0
  let cumIndirect = 0
  let cumSellingAdmin = 0
  let cumGrossProfit = 0
  let cumOperatingProfit = 0

  const rows = executions.map((e) => {
    cumMaterial += e.materialCost
    cumLabor += e.laborCost
    cumOutsource += e.outsourceFabrication + e.outsourceService
    cumEquipment += e.rentalForklift + e.rentalOther + e.vehicleRepair + e.vehicleFuel + e.vehicleOther
    cumOther += e.consumableOther + e.consumableSafety + e.travelExpense + e.insuranceWarranty +
      e.dormitoryCost + e.miscellaneous + e.paymentFeeOther + e.welfareBusiness + e.reserveFund
    cumTotal += e.totalExpense
    cumIndirect += e.indirectCost
    cumSellingAdmin += e.sellingAdminCost
    cumGrossProfit += e.grossProfit
    cumOperatingProfit += e.operatingProfit

    return {
      periodYear: e.periodYear,
      periodMonth: e.periodMonth,
      periodLabel: `${e.periodYear}-${String(e.periodMonth).padStart(2, '0')}`,
      materialCost: e.materialCost,
      laborCost: e.laborCost,
      outsourceCost: e.outsourceFabrication + e.outsourceService,
      equipmentCost: e.rentalForklift + e.rentalOther + e.vehicleRepair + e.vehicleFuel + e.vehicleOther,
      otherCost: e.consumableOther + e.consumableSafety + e.travelExpense + e.insuranceWarranty +
        e.dormitoryCost + e.miscellaneous + e.paymentFeeOther + e.welfareBusiness + e.reserveFund,
      indirectCost: e.indirectCost,
      totalExpense: e.totalExpense,
      sellingAdminCost: e.sellingAdminCost,
      grossProfit: e.grossProfit,
      operatingProfit: e.operatingProfit,
      cumMaterial,
      cumLabor,
      cumOutsource,
      cumEquipment,
      cumOther,
      cumTotal,
      cumIndirect,
      cumSellingAdmin,
      cumGrossProfit,
      cumOperatingProfit,
      cumBudgetUsage: contractAmount > 0 ? (cumTotal / contractAmount) * 100 : 0,
    }
  })

  return { rows, contractAmount }
}

// Pure data fetching function - safe to call during render
export async function getProjectDashboardData(projectId: string) {
  const [project, executions, cashFlows] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        contractAmount: true, 
        estimatedBudget: true,
        budgetUsageRate: true,
        costForecastRate: true,
        totalCashInflow: true,
        totalCashOutflow: true,
        currentCashBalance: true,
      },
    }),
    prisma.costExecution.findMany({ where: { projectId } }),
    prisma.cashFlow.findMany({ where: { projectId } }),
  ])

  const contractAmount = project?.contractAmount ?? 0
  const estimatedBudget = project?.estimatedBudget ?? 0

  const totalCost = executions.reduce((s, e) => s + e.totalExpense, 0)
  const totalCashInflow = cashFlows
    .filter((c) => c.type === 'INFLOW')
    .reduce((s, c) => s + c.actualAmount, 0)
  const totalCashOutflow = cashFlows
    .filter((c) => c.type === 'OUTFLOW')
    .reduce((s, c) => s + c.actualAmount, 0)

  const budgetUsageRate = contractAmount > 0 ? (totalCost / contractAmount) * 100 : 0

  const pv = contractAmount
  const ev = contractAmount * (budgetUsageRate / 100)
  const ac = totalCost
  const bac = estimatedBudget

  const cpi = ac > 0 ? ev / ac : 1
  const eac = ac > 0 ? bac / cpi : bac
  const vac = bac - eac

  const latestExecution = executions.sort((a, b) => {
    if (a.periodYear !== b.periodYear) return b.periodYear - a.periodYear
    return b.periodMonth - a.periodMonth
  })[0]

  const operatingProfit = latestExecution?.operatingProfit ?? 0
  const grossProfit = latestExecution?.grossProfit ?? 0
  const profitRate = contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0

  return {
    budgetUsageRate,
    contractAmount,
    totalCost,
    grossProfit,
    operatingProfit,
    profitRate,
    totalCashInflow,
    totalCashOutflow,
    currentCashBalance: totalCashInflow - totalCashOutflow,
    isOnBudget: budgetUsageRate <= 100,
    isOnSchedule: true,
  }
}

// Mutation + revalidation - must be called from Server Actions only
export async function refreshProjectDashboard(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const data = await getProjectDashboardData(projectId)

  await prisma.projectDashboard.upsert({
    where: { projectId },
    create: {
      projectId,
      pv: data.contractAmount,
      ev: data.contractAmount * (data.budgetUsageRate / 100),
      ac: data.totalCost,
      bac: 0,
      cpi: 1,
      spi: 1,
      eac: 0,
      vac: 0,
      progress: data.budgetUsageRate,
      budgetUsageRate: data.budgetUsageRate,
      contractAmount: data.contractAmount,
      totalCost: data.totalCost,
      grossProfit: data.grossProfit,
      operatingProfit: data.operatingProfit,
      profitRate: data.profitRate,
      totalCashInflow: data.totalCashInflow,
      totalCashOutflow: data.totalCashOutflow,
      currentCashBalance: data.currentCashBalance,
      isOnBudget: data.isOnBudget,
      isOnSchedule: true,
    },
    update: {
      budgetUsageRate: data.budgetUsageRate,
      contractAmount: data.contractAmount,
      totalCost: data.totalCost,
      grossProfit: data.grossProfit,
      operatingProfit: data.operatingProfit,
      profitRate: data.profitRate,
      totalCashInflow: data.totalCashInflow,
      totalCashOutflow: data.totalCashOutflow,
      currentCashBalance: data.currentCashBalance,
      isOnBudget: data.isOnBudget,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
  revalidatePath('/dashboard-page')
}

// Keep for backward compatibility
export async function aggregateProjectDashboard(projectId: string) {
  return refreshProjectDashboard(projectId)
}

export async function refreshAllDashboards() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    select: { id: true },
  })

  const results = await Promise.allSettled(
    projects.map((p) => refreshProjectDashboard(p.id))
  )

  return { total: projects.length, succeeded: results.filter((r) => r.status === 'fulfilled').length }
}
