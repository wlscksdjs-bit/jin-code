'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateWbsItemSchema, UpdateWbsItemSchema } from '@/lib/schemas'

export async function createWbsItem(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateWbsItemSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.wbsItem.create({
    data: {
      projectId: validated.data.projectId,
      code: validated.data.code,
      name: validated.data.name,
      description: validated.data.description || null,
      startDate: validated.data.startDate || null,
      endDate: validated.data.endDate || null,
      plannedDays: validated.data.plannedDays || null,
      progress: validated.data.progress || 0,
      plannedCost: validated.data.plannedCost || null,
      actualCost: validated.data.actualCost || null,
      sortOrder: validated.data.sortOrder || 0,
      parentId: validated.data.parentId || null,
      status: validated.data.status,
      phaseType: validated.data.phaseType || null,
      isMilestone: validated.data.isMilestone || false,
      milestoneType: validated.data.milestoneType || null,
    },
  })

  revalidatePath(`/projects/${validated.data.projectId}`)
}

export async function updateWbsItem(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateWbsItemSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.wbsItem.update({
    where: { id },
    data: {
      code: validated.data.code,
      name: validated.data.name,
      description: validated.data.description || null,
      startDate: validated.data.startDate || null,
      endDate: validated.data.endDate || null,
      plannedDays: validated.data.plannedDays || null,
      progress: validated.data.progress || 0,
      plannedCost: validated.data.plannedCost || null,
      actualCost: validated.data.actualCost || null,
      sortOrder: validated.data.sortOrder || 0,
      parentId: validated.data.parentId || null,
      status: validated.data.status,
      phaseType: validated.data.phaseType || null,
      isMilestone: validated.data.isMilestone || false,
      milestoneType: validated.data.milestoneType || null,
    },
  })

  const projectId = formData.get('projectId') as string
  if (projectId) {
    revalidatePath(`/projects/${projectId}`)
  }
}

export async function deleteWbsItem(projectId: string, id: string) {
  await prisma.wbsItem.delete({
    where: { id },
  })

  revalidatePath(`/projects/${projectId}`)
}
