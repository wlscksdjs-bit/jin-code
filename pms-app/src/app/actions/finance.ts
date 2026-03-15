'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateFinanceSchema, UpdateFinanceSchema, IdSchema } from '@/lib/schemas'

export async function createFinance(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateFinanceSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.finance.create({
    data: {
      projectId: validated.data.projectId,
      type: validated.data.type,
      category: validated.data.category,
      amount: validated.data.amount,
      occurDate: validated.data.occurDate,
      billingDate: validated.data.billingDate || null,
      paymentDate: validated.data.paymentDate || null,
      status: validated.data.status,
      description: validated.data.description || null,
    },
  })

  revalidatePath('/finance')
}

export async function updateFinance(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateFinanceSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.finance.update({
    where: { id },
    data: {
      type: validated.data.type,
      category: validated.data.category,
      amount: validated.data.amount,
      occurDate: validated.data.occurDate,
      billingDate: validated.data.billingDate || null,
      paymentDate: validated.data.paymentDate || null,
      status: validated.data.status,
      description: validated.data.description || null,
    },
  })

  revalidatePath('/finance')
}

export async function deleteFinance(id: string) {
  await prisma.finance.delete({ where: { id } })
  revalidatePath('/finance')
}

export async function getFinance(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = IdSchema.safeParse(rawData.id)
    if (!validated.success) return { success: false, error: validated.error.issues }
    
    const data = await prisma.finance.findUnique({
      where: { id: validated.data },
      include: { project: true },
    })
    return { success: true, data }
  } catch (error) {
    console.error('getFinance error:', error)
    return { success: false, error: '재무사항 조회 중 오류가 발생했습니다.' }
  }
}

export async function listFinance(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const page = parseInt(rawData.page as string) || 1
    const limit = parseInt(rawData.limit as string) || 20
    const skip = (page - 1) * limit
    
    const where: any = {}
    if (rawData.projectId) where.projectId = rawData.projectId
    if (rawData.type) where.type = rawData.type
    if (rawData.category) where.category = rawData.category

    const [data, total] = await Promise.all([
      prisma.finance.findMany({ 
        where, 
        include: { project: true }, 
        orderBy: { occurDate: 'desc' }, 
        skip, 
        take: limit 
      }),
      prisma.finance.count({ where }),
    ])
    return { 
      success: true, 
      data, 
      pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } 
    }
  } catch (error) {
    console.error('listFinance error:', error)
    return { success: false, error: '재무사항 목록 조회 중 오류가 발생했습니다.' }
  }
}
