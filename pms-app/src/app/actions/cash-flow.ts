'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProjectCashFlow(projectId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다. 다시 로그인해주세요.')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    throw new Error('자금 흐름 조회 권한이 없습니다. ADMIN 또는 PM 역할이 필요합니다.')
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { contractAmount: true }
  })

  if (!project) {
    throw new Error('해당 프로젝트를 찾을 수 없습니다.')
  }

  const cashFlows = await prisma.cashFlow.findMany({
    where: { 
      projectId,
      status: { not: 'CANCELLED' }
    },
    orderBy: { plannedDate: 'asc' }
  })

  let totalPlannedInflow = 0
  let totalPlannedOutflow = 0
  let totalActualInflow = 0
  let totalActualOutflow = 0
  let runningBalance = 0

  const flows = cashFlows.map((flow) => {
    if (flow.type === 'INFLOW') {
      totalPlannedInflow += flow.plannedAmount
      totalActualInflow += flow.actualAmount
      runningBalance += flow.actualAmount
    } else {
      totalPlannedOutflow += flow.plannedAmount
      totalActualOutflow += flow.actualAmount
      runningBalance -= flow.actualAmount
    }

    return {
      ...flow,
      cumulativeBalance: runningBalance
    }
  })

  return {
    summary: {
      contractAmount: project.contractAmount || 0,
      totalPlannedInflow,
      totalPlannedOutflow,
      totalActualInflow,
      totalActualOutflow,
      currentBalance: runningBalance
    },
    flows
  }
}

export async function generateCashFlowForecast(projectId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다. 다시 로그인해주세요.')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    throw new Error('예측 데이터 생성 권한이 없습니다. ADMIN 또는 PM 역할이 필요합니다.')
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      purchaseOrders: {
        where: { status: { not: 'CANCELLED' } }
      },
      wbsItems: {
        where: { isMilestone: true }
      }
    }
  })

  if (!project) {
    throw new Error('해당 프로젝트를 찾을 수 없습니다.')
  }

  const forecastRecords: any[] = []

  const poByMonth: Record<string, { planned: number; actual: number; date: Date }> = {}

  project.purchaseOrders.forEach((po) => {
    const date = po.requiredDate || po.orderDate || po.createdAt
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${month}`

    if (!poByMonth[key]) {
      poByMonth[key] = { 
        planned: 0, 
        actual: 0, 
        date: new Date(year, month - 1, 1) 
      }
    }
    poByMonth[key].planned += po.totalAmount
    poByMonth[key].actual += po.paidAmount
  })

  for (const [key, data] of Object.entries(poByMonth)) {
    const [year, month] = key.split('-')
    forecastRecords.push({
      id: `cf-forecast-${projectId}-OUTFLOW-${year}-${month}`,
      projectId,
      type: 'OUTFLOW',
      category: 'MATERIAL',
      plannedAmount: data.planned,
      actualAmount: data.actual,
      plannedDate: data.date,
      status: data.actual > 0 ? 'ACTUAL' : 'PLANNED',
      description: `${year}년 ${month}월 발주 지출 예측 (자동생성)`
    })
  }

  const contractMilestone = project.wbsItems.find(m => m.milestoneType === 'CONTRACT') || 
                            project.wbsItems.find(m => m.code === 'M1') ||
                            project.wbsItems[0]
  
  if (project.contractAmount && project.contractAmount > 0) {
    const date = contractMilestone?.startDate || project.contractDate || new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    
    forecastRecords.push({
      id: `cf-forecast-${projectId}-INFLOW-${year}-${month}`,
      projectId,
      type: 'INFLOW',
      category: 'CONTRACT',
      plannedAmount: project.contractAmount,
      actualAmount: 0,
      plannedDate: new Date(year, month - 1, 1),
      status: 'PLANNED',
      description: `계약 금액 수입 예측 (자동생성)`
    })
  }

  for (const record of forecastRecords) {
    await prisma.cashFlow.upsert({
      where: { id: record.id },
      create: record,
      update: {
        plannedAmount: record.plannedAmount,
        actualAmount: record.actualAmount,
        plannedDate: record.plannedDate,
        status: record.status,
        description: record.description,
        updatedAt: new Date()
      }
    })
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/finance')

  return { 
    success: true, 
    count: forecastRecords.length 
  }
}
