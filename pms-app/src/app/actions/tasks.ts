'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateTaskSchema, UpdateTaskSchema, IdSchema } from '@/lib/schemas'

export async function createTask(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateTaskSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.task.create({
    data: {
      projectId: validated.data.projectId,
      title: validated.data.title,
      description: validated.data.description || null,
      status: validated.data.status,
      priority: validated.data.priority,
      dueDate: validated.data.dueDate || null,
      assigneeId: validated.data.assigneeId || null,
      wbsItemId: validated.data.wbsItemId || null,
      sortOrder: validated.data.sortOrder || 0,
    },
  })

  revalidatePath(`/projects/${validated.data.projectId}`)
}

export async function updateTask(id: string, projectId: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateTaskSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.task.update({
    where: { id },
    data: {
      title: validated.data.title,
      description: validated.data.description || null,
      status: validated.data.status,
      priority: validated.data.priority,
      dueDate: validated.data.dueDate || null,
      assigneeId: validated.data.assigneeId || null,
      wbsItemId: validated.data.wbsItemId || null,
      sortOrder: validated.data.sortOrder || 0,
      completedAt: validated.data.completedAt || null,
    },
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function deleteTask(id: string, projectId: string) {
  await prisma.task.delete({
    where: { id },
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function getTask(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = IdSchema.safeParse(rawData.id)
    if (!validated.success) return { success: false, error: validated.error.errors }
    
    const data = await prisma.task.findUnique({
      where: { id: validated.data },
      include: { project: true, assignee: true, wbsItem: true },
    })
    return { success: true, data }
  } catch (error) {
    console.error('getTask error:', error)
    return { success: false, error: '작업 조회 중 오류가 발생했습니다.' }
  }
}

export async function listTasks(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const page = parseInt(rawData.page as string) || 1
    const limit = parseInt(rawData.limit as string) || 20
    const skip = (page - 1) * limit
    
    const where: any = {}
    if (rawData.projectId) where.projectId = rawData.projectId
    if (rawData.status) where.status = rawData.status
    if (rawData.assigneeId) where.assigneeId = rawData.assigneeId

    const [data, total] = await Promise.all([
      prisma.task.findMany({ 
        where, 
        include: { project: true, assignee: true }, 
        orderBy: { createdAt: 'desc' }, 
        skip, 
        take: limit 
      }),
      prisma.task.count({ where }),
    ])
    return { 
      success: true, 
      data, 
      pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } 
    }
  } catch (error) {
    console.error('listTasks error:', error)
    return { success: false, error: '작업 목록 조회 중 오류가 발생했습니다.' }
  }
}
