'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const wbsSchema = z.object({
  projectId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  plannedDays: z.number().optional(),
  plannedCost: z.number().default(0),
  progress: z.number().default(0),
  parentId: z.string().optional(),
  status: z.string().default('PENDING'),
  phaseType: z.string().optional(),
  isMilestone: z.boolean().default(false),
  milestoneType: z.string().optional(),
  isProcurement: z.boolean().default(false),
  sortOrder: z.number().default(0),
})

export async function listWbsItems(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const items = await prisma.wbsItem.findMany({
    where: { projectId },
    include: {
      parent: { select: { id: true, name: true, code: true } },
      children: { select: { id: true }, orderBy: { sortOrder: 'asc' } },
      purchaseOrders: { select: { id: true, status: true } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return items
}

export async function getWbsItem(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.wbsItem.findUnique({
    where: { id },
    include: {
      parent: true,
      children: { orderBy: { sortOrder: 'asc' } },
      purchaseOrders: { include: { vendor: true } },
      progressRecords: { orderBy: { date: 'desc' }, take: 5 },
    },
  })
}

export async function createWbsItem(data: z.infer<typeof wbsSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const parsed = wbsSchema.parse(data)
  const item = await prisma.wbsItem.create({
    data: {
      projectId: parsed.projectId,
      code: parsed.code,
      name: parsed.name,
      description: parsed.description,
      startDate: parsed.startDate ? new Date(parsed.startDate) : null,
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      plannedDays: parsed.plannedDays,
      plannedCost: parsed.plannedCost,
      progress: parsed.progress,
      parentId: parsed.parentId,
      status: parsed.status,
      phaseType: parsed.phaseType,
      isMilestone: parsed.isMilestone,
      milestoneType: parsed.milestoneType,
      isProcurement: parsed.isProcurement,
      sortOrder: parsed.sortOrder,
    },
    include: { parent: true },
  })
  revalidatePath(`/projects/${parsed.projectId}`)
  revalidatePath(`/projects/${parsed.projectId}/wbs`)
  return item
}

export async function updateWbsItem(id: string, data: Partial<z.infer<typeof wbsSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.wbsItem.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')
  const parsed = wbsSchema.partial().parse(data)
  const item = await prisma.wbsItem.update({
    where: { id },
    data: {
      ...parsed,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
    },
  })
  revalidatePath(`/projects/${existing.projectId}`)
  revalidatePath(`/projects/${existing.projectId}/wbs`)
  return item
}

export async function deleteWbsItem(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.wbsItem.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')
  await prisma.wbsItem.delete({ where: { id } })
  revalidatePath(`/projects/${existing.projectId}`)
  revalidatePath(`/projects/${existing.projectId}/wbs`)
}

export async function calculateCPM(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const items = await prisma.wbsItem.findMany({
    where: { projectId, isMilestone: false },
    orderBy: { sortOrder: 'asc' },
  })

  type WbsNode = {
    id: string
    name: string
    code: string
    plannedDays: number | null
    earlyStart: number
    earlyFinish: number
    lateStart: number
    lateFinish: number
    totalFloat: number
    isCritical: boolean
    startDate: Date | null
    endDate: Date | null
  }

  const nodes: WbsNode[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    plannedDays: item.plannedDays,
    earlyStart: 0,
    earlyFinish: 0,
    lateStart: Infinity,
    lateFinish: Infinity,
    totalFloat: 0,
    isCritical: false,
    startDate: item.startDate,
    endDate: item.endDate,
  }))

  const idToIdx = new Map(nodes.map((n, i) => [n.id, i]))

  for (let pass = 0; pass < nodes.length; pass++) {
    for (const node of nodes) {
      const idx = idToIdx.get(node.id)!
      const deps = items.find((i) => i.id === node.id)?.code.split('.').slice(0, -1) ?? []
      if (deps.length === 0) {
        node.earlyStart = 0
        node.earlyFinish = node.plannedDays ?? 0
      } else {
        const parentCode = deps.join('.')
        const parent = nodes.find((n) => n.code === parentCode)
        if (parent) {
          node.earlyStart = parent.earlyFinish
          node.earlyFinish = node.earlyStart + (node.plannedDays ?? 0)
        }
      }
    }
  }

  const projectDuration = Math.max(...nodes.map((n) => n.earlyFinish))

  for (let pass = 0; pass < nodes.length; pass++) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const children = nodes.filter((n) => n.code.startsWith(node.code + '.') && n.code.split('.').length === node.code.split('.').length + 1)
      if (children.length === 0) {
        node.lateFinish = projectDuration
      } else {
        node.lateFinish = Math.min(...children.map((c) => c.lateStart))
      }
      node.lateStart = node.lateFinish - (node.plannedDays ?? 0)
    }
  }

  for (const node of nodes) {
    node.totalFloat = node.lateStart - node.earlyStart
    node.isCritical = node.totalFloat === 0 && node.plannedDays !== 0
  }

  const criticalPath = nodes.filter((n) => n.isCritical)

  await prisma.project.update({
    where: { id: projectId },
    data: { endDate: new Date(Date.now() + projectDuration * 24 * 60 * 60 * 1000) },
  })

  return {
    projectDuration,
    nodes,
    criticalPath,
    criticalPathItems: criticalPath.map((n) => n.id),
  }
}
