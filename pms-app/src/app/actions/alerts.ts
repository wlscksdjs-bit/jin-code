'use server'

import prisma from '@/lib/prisma'

const BUDGET_ALERT_THRESHOLDS = [80, 90, 100]

export async function checkBudgetOverrun(projectId: string, currentUserId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { 
      id: true, 
      name: true, 
      code: true, 
      contractAmount: true 
    },
  })

  if (!project || !project.contractAmount) return

  const totalExecutedCost = await prisma.costExecution.aggregate({
    where: { projectId },
    _sum: { totalManufacturingCost: true },
  })

  const cumulativeCost = totalExecutedCost._sum.totalManufacturingCost || 0
  const usageRate = (cumulativeCost / project.contractAmount) * 100

  for (const threshold of BUDGET_ALERT_THRESHOLDS) {
    if (usageRate >= threshold) {
      const existing = await prisma.notification.findFirst({
        where: {
          type: 'BUDGET_ALERT',
          message: { contains: `${threshold}%` },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })

      if (!existing) {
        await prisma.notification.create({
          data: {
            type: 'BUDGET_ALERT',
            title: `예산 초과警戒 [${project.code}]`,
            message: `"${project.name}"工程的累计原价(₩${cumulativeCost.toLocaleString()})已达到合同金额的${threshold.toFixed(1)}%。`,
            userId: currentUserId,
            link: `/cost?projectId=${projectId}`,
          },
        })
        break
      }
    }
  }
}

export async function checkMilestoneDueAlerts(currentUserId: string) {
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcomingMilestones = await prisma.wbsItem.findMany({
    where: {
      isMilestone: true,
      status: { not: 'COMPLETED' },
      endDate: {
        gte: now,
        lte: sevenDaysLater,
      },
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
    },
  })

  for (const milestone of upcomingMilestones) {
    if (!milestone.endDate) continue

    const existing = await prisma.notification.findFirst({
      where: {
        type: 'MILESTONE_DUE',
        link: `/projects/${milestone.projectId}`,
        message: { contains: milestone.name },
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
    })

    if (!existing) {
      const daysLeft = Math.ceil(
        (new Date(milestone.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      await prisma.notification.create({
        data: {
          type: 'MILESTONE_DUE',
          title: `마일스톤 임박 [${milestone.project?.code || ''}]`,
          message: `"${milestone.name}" 마일스톤이 ${daysLeft}일 남았습니다.`,
          userId: currentUserId,
          link: `/projects/${milestone.projectId}/schedule`,
        },
      })
    }
  }
}
