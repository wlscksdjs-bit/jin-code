'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const timeSheetSchema = z.object({
  date: z.string(),
  hours: z.number().min(0).max(24),
  workType: z.string().optional(),
  description: z.string().optional(),
  status: z.string().default('DRAFT'),
  hourlyRate: z.number().default(0),
  totalCost: z.number().default(0),
  projectId: z.string(),
  resourceId: z.string().optional(),
  userId: z.string(),
})

export async function listTimeSheets(
  resourceId?: string,
  projectId?: string,
  status?: string,
  startDate?: string,
  endDate?: string
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const where: any = {}

  if (resourceId) where.resourceId = resourceId
  if (projectId) where.projectId = projectId
  if (status) where.status = status

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  }

  return prisma.timeSheet.findMany({
    where,
    include: {
      project: true,
      resource: true,
      user: true,
    },
    orderBy: { date: 'desc' },
  })
}

export async function getTimeSheet(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.timeSheet.findUnique({
    where: { id },
    include: {
      project: true,
      resource: true,
      user: true,
    },
  })
}

export async function createTimeSheet(data: z.infer<typeof timeSheetSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = timeSheetSchema.parse(data)
  const totalCost = parsed.hours * parsed.hourlyRate

  const timeSheet = await prisma.timeSheet.create({
    data: {
      ...parsed,
      date: new Date(parsed.date),
      totalCost,
    },
  })

  revalidatePath('/timesheets')
  revalidatePath(`/resources/${parsed.resourceId}`)
  return timeSheet
}

export async function updateTimeSheet(
  id: string,
  data: Partial<z.infer<typeof timeSheetSchema>>
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const { hours, hourlyRate, ...rest } = data
  const updateData: any = { ...rest }

  if (hours !== undefined && hourlyRate !== undefined) {
    updateData.totalCost = hours * hourlyRate
  } else if (hours !== undefined || hourlyRate !== undefined) {
    const existing = await prisma.timeSheet.findUnique({ where: { id } })
    if (existing) {
      const h = hours ?? existing.hours
      const r = hourlyRate ?? existing.hourlyRate
      updateData.totalCost = h * r
    }
  }

  if (data.date) {
    updateData.date = new Date(data.date)
  }

  const timeSheet = await prisma.timeSheet.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/timesheets')
  revalidatePath(`/resources/${timeSheet.resourceId}`)
  return timeSheet
}

export async function deleteTimeSheet(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const timeSheet = await prisma.timeSheet.findUnique({ where: { id } })

  await prisma.timeSheet.delete({
    where: { id },
  })

  revalidatePath('/timesheets')
  if (timeSheet?.resourceId) {
    revalidatePath(`/resources/${timeSheet.resourceId}`)
  }
  return { success: true }
}

export async function submitTimeSheet(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const timeSheet = await prisma.timeSheet.update({
    where: { id },
    data: { status: 'SUBMITTED' },
  })

  revalidatePath('/timesheets')
  return timeSheet
}

export async function approveTimeSheet(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const timeSheet = await prisma.timeSheet.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: session.user?.email || 'system',
      approvedAt: new Date(),
    },
  })

  revalidatePath('/timesheets')
  return timeSheet
}

export async function rejectTimeSheet(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const timeSheet = await prisma.timeSheet.update({
    where: { id },
    data: { status: 'REJECTED' },
  })

  revalidatePath('/timesheets')
  return timeSheet
}

export async function getMyTimeSheets(month?: number, year?: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const now = new Date()
  const targetYear = year || now.getFullYear()
  const targetMonth = month || now.getMonth()

  const startDate = new Date(targetYear, targetMonth, 1)
  const endDate = new Date(targetYear, targetMonth + 1, 0)

  const resource = await prisma.resource.findFirst({
    where: { email: session.user.email || undefined },
  })

  const where: any = {
    userId: session.user.id,
    date: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (resource) {
    where.resourceId = resource.id
  }

  return prisma.timeSheet.findMany({
    where,
    include: {
      project: true,
    },
    orderBy: { date: 'desc' },
  })
}

export async function getTimeSheetSummary(resourceId?: string, month?: number, year?: number) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const now = new Date()
  const targetYear = year || now.getFullYear()
  const targetMonth = month || now.getMonth()

  const startDate = new Date(targetYear, targetMonth, 1)
  const endDate = new Date(targetYear, targetMonth + 1, 0)

  const where: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (resourceId) {
    where.resourceId = resourceId
  }

  const timeSheets = await prisma.timeSheet.findMany({
    where,
    include: {
      project: true,
      resource: true,
    },
  })

  const summary = {
    totalHours: timeSheets.reduce((sum, ts) => sum + ts.hours, 0),
    totalCost: timeSheets.reduce((sum, ts) => sum + ts.totalCost, 0),
    approvedHours: timeSheets
      .filter((ts) => ts.status === 'APPROVED')
      .reduce((sum, ts) => sum + ts.hours, 0),
    pendingHours: timeSheets
      .filter((ts) => ts.status === 'SUBMITTED')
      .reduce((sum, ts) => sum + ts.hours, 0),
    draftHours: timeSheets
      .filter((ts) => ts.status === 'DRAFT')
      .reduce((sum, ts) => sum + ts.hours, 0),
    count: timeSheets.length,
  }

  return { summary, timeSheets }
}
