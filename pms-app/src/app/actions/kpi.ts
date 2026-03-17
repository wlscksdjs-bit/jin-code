'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { calculateProjectKPI } from '@/lib/kpi'

export async function getProjectKPI(projectId: string) {
  const session = await auth()
  if (!session?.user) return null

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      wbsItems: {
        select: {
          id: true,
          name: true,
          plannedCost: true,
          actualCost: true,
          progress: true,
          startDate: true,
          endDate: true,
        },
      },
      costExecutions: {
        select: { totalManufacturingCost: true },
      },
    },
  })

  if (!project) return null

  return calculateProjectKPI(
    project.wbsItems,
    project.costExecutions,
    project.startDate,
    project.endDate
  )
}
