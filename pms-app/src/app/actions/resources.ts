'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateResourceSchema, UpdateResourceSchema, IdSchema } from '@/lib/schemas'

export async function createResource(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateResourceSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.resource.create({
    data: {
      name: validated.data.name,
      employeeNumber: validated.data.employeeNumber,
      department: validated.data.department || null,
      position: validated.data.position || null,
      grade: validated.data.grade || null,
      hourlyRate: validated.data.hourlyRate || null,
      monthlyRate: validated.data.monthlyRate || null,
      availability: validated.data.availability,
      phone: validated.data.phone || null,
      email: validated.data.email || null,
    },
  })

  revalidatePath('/resources')
}

export async function updateResource(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateResourceSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.resource.update({
    where: { id },
    data: {
      name: validated.data.name,
      department: validated.data.department || null,
      position: validated.data.position || null,
      grade: validated.data.grade || null,
      hourlyRate: validated.data.hourlyRate || null,
      monthlyRate: validated.data.monthlyRate || null,
      availability: validated.data.availability || 'AVAILABLE',
      phone: validated.data.phone || null,
      email: validated.data.email || null,
    },
  })

  revalidatePath('/resources')
}

export async function deleteResource(id: string) {
  await prisma.resource.delete({
    where: { id },
  })

  revalidatePath('/resources')
}

export async function getResource(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = IdSchema.safeParse(rawData.id)
    if (!validated.success) return { success: false, error: validated.error.issues }
    
    const data = await prisma.resource.findUnique({
      where: { id: validated.data },
    })
    return { success: true, data }
  } catch (error) {
    console.error('getResource error:', error)
    return { success: false, error: '리소스 조회 중 오류가 발생했습니다.' }
  }
}

export async function listResources(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const page = parseInt(rawData.page as string) || 1
    const limit = parseInt(rawData.limit as string) || 20
    const skip = (page - 1) * limit
    
    const where: any = {}
    if (rawData.availability) where.availability = rawData.availability
    if (rawData.department) where.department = rawData.department

    const [data, total] = await Promise.all([
      prisma.resource.findMany({ 
        where, 
        orderBy: { name: 'asc' }, 
        skip, 
        take: limit 
      }),
      prisma.resource.count({ where }),
    ])
    return { 
      success: true, 
      data, 
      pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } 
    }
  } catch (error) {
    console.error('listResources error:', error)
    return { success: false, error: '리소스 목록 조회 중 오류가 발생했습니다.' }
  }
}
