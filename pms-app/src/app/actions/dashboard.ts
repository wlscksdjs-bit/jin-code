'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { broadcast } from '@/lib/sse-broadcast'
import { calculateProjectKPI } from '@/lib/kpi'

export async function computeAndSaveDashboard(projectId: string) {
  const [wbsItems, costExecutions, project] = await Promise.all([
    prisma.wbsItem.findMany({
      where: { projectId },
      select: {
        id: true,
        plannedCost: true,
        actualCost: true,
        progress: true,
        startDate: true,
        endDate: true,
      },
    }),
    prisma.costExecution.findMany({
      where: { projectId },
      select: {
        totalManufacturingCost: true,
        totalExpense: true,
      },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        contractAmount: true,
        totalCashInflow: true,
        totalCashOutflow: true,
        currentCashBalance: true,
      },
    }),
  ])

  if (!project) return null

  const kpi = calculateProjectKPI(
    wbsItems,
    costExecutions,
    project.contractAmount ? new Date() : null,
    project.contractAmount ? new Date() : null
  )

  const totalCost = costExecutions.reduce((sum, e) => sum + (e.totalExpense || 0), 0)
  const contractAmount = project.contractAmount || 0
  const grossProfit = contractAmount - totalCost
  const operatingProfit = grossProfit - Math.round(totalCost * 0.12)
  const profitRate = contractAmount > 0 ? (grossProfit / contractAmount) * 100 : 0
  const budgetUsageRate = kpi.bac > 0 ? (kpi.ac / kpi.bac) * 100 : 0

  const dashboard = await prisma.projectDashboard.upsert({
    where: { projectId },
    update: {
      pv: kpi.pv,
      ev: kpi.ev,
      ac: kpi.ac,
      bac: kpi.bac,
      cpi: kpi.cpi,
      spi: kpi.spi,
      eac: kpi.eac,
      vac: kpi.vac,
      progress: kpi.progress,
      budgetUsageRate,
      contractAmount,
      totalCost,
      grossProfit,
      operatingProfit,
      profitRate,
      totalCashInflow: project.totalCashInflow,
      totalCashOutflow: project.totalCashOutflow,
      currentCashBalance: project.currentCashBalance,
      isOnSchedule: kpi.isOnSchedule,
      isOnBudget: kpi.isOnBudget,
    },
    create: {
      projectId,
      pv: kpi.pv,
      ev: kpi.ev,
      ac: kpi.ac,
      bac: kpi.bac,
      cpi: kpi.cpi,
      spi: kpi.spi,
      eac: kpi.eac,
      vac: kpi.vac,
      progress: kpi.progress,
      budgetUsageRate,
      contractAmount,
      totalCost,
      grossProfit,
      operatingProfit,
      profitRate,
      totalCashInflow: project.totalCashInflow,
      totalCashOutflow: project.totalCashOutflow,
      currentCashBalance: project.currentCashBalance,
      isOnSchedule: kpi.isOnSchedule,
      isOnBudget: kpi.isOnBudget,
    },
  })

  broadcast('project', {
    type: 'DASHBOARD_UPDATED',
    projectId,
    data: dashboard,
  })

  return dashboard
}

export async function getProjectDashboard(projectId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('인증되지 않았습니다.')

  let dashboard = await prisma.projectDashboard.findUnique({
    where: { projectId },
  })

  if (!dashboard) {
    dashboard = await computeAndSaveDashboard(projectId)
  }

  return dashboard
}

export async function invalidateDashboard(projectId: string) {
  await computeAndSaveDashboard(projectId)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
}
