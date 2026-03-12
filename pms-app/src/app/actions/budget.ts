'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CreateBudgetSchema, UpdateBudgetSchema, IdSchema } from '@/lib/schemas'

export async function createBudget(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateBudgetSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  const totalCost = 
    (validated.data.laborCost || 0) +
    (validated.data.materialCost || 0) +
    (validated.data.outsourceCost || 0) +
    (validated.data.equipmentCost || 0) +
    (validated.data.otherCost || 0)
  
  await prisma.budget.create({
    data: {
      projectId: validated.data.projectId,
      type: validated.data.type,
      sourceType: validated.data.sourceType || null,
      sourceSalesId: validated.data.sourceSalesId || null,
      totalBudget: validated.data.totalBudget,
      laborCost: validated.data.laborCost || null,
      materialCost: validated.data.materialCost || null,
      outsourceCost: validated.data.outsourceCost || null,
      equipmentCost: validated.data.equipmentCost || null,
      otherCost: validated.data.otherCost || null,
      indirectCostRate: validated.data.indirectCostRate || 0,
      sellingAdminCostRate: validated.data.sellingAdminCostRate || 0,
      profitMargin: validated.data.profitMargin || null,
      targetProfit: validated.data.targetProfit || null,
      estimatedProfit: validated.data.estimatedProfit || null,
      currentProfit: validated.data.currentProfit || null,
      status: validated.data.status,
      effectiveDate: validated.data.effectiveDate || null,
    },
  })

  revalidatePath('/budget')
  revalidatePath(`/projects/${validated.data.projectId}`)
  redirect('/budget')
}

export async function updateBudget(id: string, projectId: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateBudgetSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.budget.update({
    where: { id },
    data: {
      type: validated.data.type,
      sourceType: validated.data.sourceType || null,
      sourceSalesId: validated.data.sourceSalesId || null,
      totalBudget: validated.data.totalBudget,
      laborCost: validated.data.laborCost || null,
      materialCost: validated.data.materialCost || null,
      outsourceCost: validated.data.outsourceCost || null,
      equipmentCost: validated.data.equipmentCost || null,
      otherCost: validated.data.otherCost || null,
      indirectCostRate: validated.data.indirectCostRate || 0,
      sellingAdminCostRate: validated.data.sellingAdminCostRate || 0,
      profitMargin: validated.data.profitMargin || null,
      targetProfit: validated.data.targetProfit || null,
      estimatedProfit: validated.data.estimatedProfit || null,
      currentProfit: validated.data.currentProfit || null,
      actualCost: validated.data.totalBudget || 0,
      status: validated.data.status,
      effectiveDate: validated.data.effectiveDate || null,
    },
  })

  revalidatePath('/budget')
  revalidatePath(`/projects/${projectId}`)
}

export async function deleteBudget(id: string, projectId: string) {
  await prisma.budget.delete({
    where: { id },
  })

  revalidatePath('/budget')
  revalidatePath(`/projects/${projectId}`)
}

export async function getBudget(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = IdSchema.safeParse(rawData.id)
    if (!validated.success) return { success: false, error: validated.error.errors }
    
    const data = await prisma.budget.findUnique({
      where: { id: validated.data },
      include: { project: true, items: true },
    })
    return { success: true, data }
  } catch (error) {
    console.error('getBudget error:', error)
    return { success: false, error: '예산 조회 중 오류가 발생했습니다.' }
  }
}

export async function listBudgets(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const page = parseInt(rawData.page as string) || 1
    const limit = parseInt(rawData.limit as string) || 20
    const skip = (page - 1) * limit
    
    const where: any = {}
    if (rawData.projectId) where.projectId = rawData.projectId
    if (rawData.status) where.status = rawData.status

    const [data, total] = await Promise.all([
      prisma.budget.findMany({ 
        where, 
        include: { project: true }, 
        orderBy: { createdAt: 'desc' }, 
        skip, 
        take: limit 
      }),
      prisma.budget.count({ where }),
    ])
    return { 
      success: true, 
      data, 
      pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } 
    }
  } catch (error) {
    console.error('listBudgets error:', error)
    return { success: false, error: '예산 목록 조회 중 오류가 발생했습니다.' }
  }
}
