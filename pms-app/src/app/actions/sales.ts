'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateSalesSchema, UpdateSalesSchema, IdSchema } from '@/lib/schemas'

export async function createSales(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateSalesSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  const executionCost = 
    (validated.data.laborCost || 0) +
    (validated.data.materialCost || 0) +
    (validated.data.outsourceCost || 0) +
    (validated.data.equipmentCost || 0) +
    (validated.data.otherCost || 0)
  
  await prisma.sales.create({
    data: {
      type: validated.data.type,
      status: validated.data.status,
      title: validated.data.title,
      bidNumber: validated.data.bidNumber || null,
      bidAmount: validated.data.bidAmount || null,
      winProbability: validated.data.winProbability || null,
      bidOpenDate: validated.data.bidOpenDate || null,
      submissionDate: validated.data.submissionDate || null,
      contractDate: validated.data.contractDate || null,
      contractAmount: validated.data.contractAmount || null,
      customerBudget: validated.data.customerBudget || null,
      competitorInfo: validated.data.competitorInfo || null,
      laborCost: validated.data.laborCost || null,
      materialCost: validated.data.materialCost || null,
      outsourceCost: validated.data.outsourceCost || null,
      equipmentCost: validated.data.equipmentCost || null,
      otherCost: validated.data.otherCost || null,
      executionCost,
      bidResult: validated.data.bidResult || null,
      resultDate: validated.data.resultDate || null,
      customerId: validated.data.customerId || null,
      projectId: validated.data.projectId || null,
      managerId: validated.data.managerId || null,
      description: validated.data.description || null,
    },
  })

  revalidatePath('/sales')
}

export async function updateSales(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateSalesSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  const executionCost = 
    (validated.data.laborCost || 0) +
    (validated.data.materialCost || 0) +
    (validated.data.outsourceCost || 0) +
    (validated.data.equipmentCost || 0) +
    (validated.data.otherCost || 0)
  
  await prisma.sales.update({
    where: { id },
    data: {
      type: validated.data.type,
      status: validated.data.status,
      title: validated.data.title,
      bidNumber: validated.data.bidNumber || null,
      bidAmount: validated.data.bidAmount || null,
      winProbability: validated.data.winProbability || null,
      bidOpenDate: validated.data.bidOpenDate || null,
      submissionDate: validated.data.submissionDate || null,
      contractDate: validated.data.contractDate || null,
      contractAmount: validated.data.contractAmount || null,
      customerBudget: validated.data.customerBudget || null,
      competitorInfo: validated.data.competitorInfo || null,
      laborCost: validated.data.laborCost || null,
      materialCost: validated.data.materialCost || null,
      outsourceCost: validated.data.outsourceCost || null,
      equipmentCost: validated.data.equipmentCost || null,
      otherCost: validated.data.otherCost || null,
      executionCost,
      bidResult: validated.data.bidResult || null,
      resultDate: validated.data.resultDate || null,
      customerId: validated.data.customerId || null,
      projectId: validated.data.projectId || null,
      managerId: validated.data.managerId || null,
      description: validated.data.description || null,
    },
  })

  revalidatePath('/sales')
  revalidatePath(`/sales/${id}`)
}

export async function deleteSales(id: string) {
  await prisma.sales.delete({
    where: { id },
  })

  revalidatePath('/sales')
}

export async function getSales(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = IdSchema.safeParse(rawData.id)
    if (!validated.success) return { success: false, error: validated.error.errors }
    
    const data = await prisma.sales.findUnique({
      where: { id: validated.data },
      include: { customer: true, project: true, manager: true },
    })
    return { success: true, data }
  } catch (error) {
    console.error('getSales error:', error)
    return { success: false, error: '영업서류 조회 중 오류가 발생했습니다.' }
  }
}

export async function listSales(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const page = parseInt(rawData.page as string) || 1
    const limit = parseInt(rawData.limit as string) || 20
    const skip = (page - 1) * limit
    
    const where: any = {}
    if (rawData.status) where.status = rawData.status
    if (rawData.type) where.type = rawData.type

    const [data, total] = await Promise.all([
      prisma.sales.findMany({ 
        where, 
        include: { customer: true }, 
        orderBy: { createdAt: 'desc' }, 
        skip, 
        take: limit 
      }),
      prisma.sales.count({ where }),
    ])
    return { 
      success: true, 
      data, 
      pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } 
    }
  } catch (error) {
    console.error('listSales error:', error)
    return { success: false, error: '영업서류 목록 조회 중 오류가 발생했습니다.' }
  }
}

export async function convertWonToProject(salesId: string) {
  try {
    const sales = await prisma.sales.findUnique({
      where: { id: salesId },
      include: { customer: true }
    })

    if (!sales) {
      return { success: false, error: '영업서류를 찾을 수 없습니다.' }
    }

    if (sales.status !== 'WON') {
      return { success: false, error: '수주成功的 영업서류만 프로젝트로 전환할 수 있습니다.' }
    }

    if (sales.projectId) {
      return { success: false, error: '이미 연결된 프로젝트가 있습니다.' }
    }

    const projectCode = `PJT-${Date.now().toString(36).toUpperCase()}`
    
    const project = await prisma.project.create({
      data: {
        code: projectCode,
        name: sales.title,
        type: 'ENVIRONMENT',
        status: 'CONTRACT',
        contractType: '수주',
        customerId: sales.customerId,
        contractAmount: sales.contractAmount,
        estimatedBudget: sales.executionCost || sales.bidAmount,
        contractDate: sales.contractDate || new Date(),
        startDate: sales.contractDate || new Date(),
      }
    })

    if (sales.executionCost) {
      await prisma.budget.create({
        data: {
          projectId: project.id,
          type: 'INITIAL',
          status: 'DRAFT',
          sourceType: 'CONTRACT',
          sourceSalesId: sales.id,
          totalBudget: sales.executionCost,
          laborCost: sales.laborCost,
          materialCost: sales.materialCost,
          outsourceCost: sales.outsourceCost,
          equipmentCost: sales.equipmentCost,
          otherCost: sales.otherCost,
          estimatedProfit: (sales.contractAmount || 0) - sales.executionCost,
          currentProfit: (sales.contractAmount || 0) - sales.executionCost,
        }
      })
    }

    await prisma.sales.update({
      where: { id: salesId },
      data: { projectId: project.id }
    })

    revalidatePath('/sales')
    revalidatePath('/projects')
    revalidatePath('/budget')

    return { success: true, projectId: project.id }
  } catch (error) {
    console.error('convertWonToProject error:', error)
    return { success: false, error: '프로젝트 전환 중 오류가 발생했습니다.' }
  }
}
