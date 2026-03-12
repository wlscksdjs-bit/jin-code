'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CreateProgressSchema, UpdateProgressSchema, IdSchema } from '@/lib/schemas'

export async function createProgress(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateProgressSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.progress.create({
    data: {
      projectId: validated.data.projectId,
      wbsItemId: validated.data.wbsItemId || null,
      date: validated.data.date || new Date(),
      plannedProgress: validated.data.plannedProgress || 0,
      actualProgress: validated.data.actualProgress || 0,
      status: validated.data.status,
      description: validated.data.description || null,
      issues: validated.data.issues || null,
    },
  })

  revalidatePath('/progress')
  revalidatePath(`/projects/${validated.data.projectId}`)
  redirect('/progress')
}

export async function updateProgress(id: string, projectId: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateProgressSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.progress.update({
    where: { id },
    data: {
      wbsItemId: validated.data.wbsItemId || null,
      date: validated.data.date || new Date(),
      plannedProgress: validated.data.plannedProgress || 0,
      actualProgress: validated.data.actualProgress || 0,
      status: validated.data.status,
      description: validated.data.description || null,
      issues: validated.data.issues || null,
    },
  })

  revalidatePath('/progress')
  revalidatePath(`/projects/${projectId}`)
}

export async function deleteProgress(id: string, projectId: string) {
  await prisma.progress.delete({
    where: { id },
  })

  revalidatePath('/progress')
  revalidatePath(`/projects/${projectId}`)
}

export async function getProgress(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = IdSchema.safeParse(rawData.id)
    if (!validated.success) return { success: false, error: validated.error.errors }
    
    const data = await prisma.progress.findUnique({
      where: { id: validated.data },
      include: { project: true, wbsItem: true },
    })
    return { success: true, data }
  } catch (error) {
    console.error('getProgress error:', error)
    return { success: false, error: '진행률 조회 중 오류가 발생했습니다.' }
  }
}

export async function listProgress(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const page = parseInt(rawData.page as string) || 1
    const limit = parseInt(rawData.limit as string) || 20
    const skip = (page - 1) * limit
    
    const where: any = {}
    if (rawData.projectId) where.projectId = rawData.projectId
    if (rawData.status) where.status = rawData.status

    const [data, total] = await Promise.all([
      prisma.progress.findMany({ 
        where, 
        include: { project: true }, 
        orderBy: { date: 'desc' }, 
        skip, 
        take: limit 
      }),
      prisma.progress.count({ where }),
    ])
    return { 
      success: true, 
      data, 
      pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } 
    }
  } catch (error) {
    console.error('listProgress error:', error)
    return { success: false, error: '진행률 목록 조회 중 오류가 발생했습니다.' }
  }
}
