'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const resourceSchema = z.object({
  name: z.string().min(1),
  employeeNumber: z.string().min(1),
  department: z.string().optional(),
  position: z.string().optional(),
  grade: z.string().optional(),
  skills: z.string().optional(),
  certifications: z.string().optional(),
  hourlyRate: z.number().default(0),
  monthlyRate: z.number().default(0),
  availability: z.number().default(100),
  phone: z.string().optional(),
  email: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function listResources(search?: string, department?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.resource.findMany({
    where: {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { employeeNumber: { contains: search } },
          { department: { contains: search } },
        ],
      }),
      ...(department && { department }),
    },
    include: {
      timeSheets: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getResource(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.resource.findUnique({
    where: { id },
    include: {
      timeSheets: {
        orderBy: { date: 'desc' },
        take: 30,
        include: {
          project: true,
        },
      },
    },
  })
}

export async function getResourceByEmployeeNumber(employeeNumber: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.resource.findUnique({
    where: { employeeNumber },
  })
}

export async function createResource(data: z.infer<typeof resourceSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = resourceSchema.parse(data)

  const resource = await prisma.resource.create({
    data: parsed,
  })

  revalidatePath('/resources')
  return resource
}

export async function updateResource(id: string, data: Partial<z.infer<typeof resourceSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const resource = await prisma.resource.update({
    where: { id },
    data,
  })

  revalidatePath('/resources')
  revalidatePath(`/resources/${id}`)
  return resource
}

export async function deleteResource(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await prisma.resource.update({
    where: { id },
    data: { isActive: false },
  })

  revalidatePath('/resources')
  return { success: true }
}

export async function getResourceUtilization(resourceId: string, startDate?: string, endDate?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const where: any = { resourceId }
  
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  }

  const timeSheets = await prisma.timeSheet.findMany({
    where,
    include: {
      project: true,
    },
    orderBy: { date: 'desc' },
  })

  const totalHours = timeSheets.reduce((sum, ts) => sum + ts.hours, 0)
  const workingDays = timeSheets.length
  const avgHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0

  const byProject = timeSheets.reduce((acc, ts) => {
    const projectName = ts.project?.name || 'Unknown'
    if (!acc[projectName]) {
      acc[projectName] = { hours: 0, cost: 0 }
    }
    acc[projectName].hours += ts.hours
    acc[projectName].cost += ts.totalCost
    return acc
  }, {} as Record<string, { hours: number; cost: number }>)

  return {
    totalHours,
    workingDays,
    avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
    byProject,
    timeSheets,
  }
}
