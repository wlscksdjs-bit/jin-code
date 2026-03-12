'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createBudgetWithProfitLoss(projectId: string, formData: FormData) {
  const type = formData.get('type') as string
  const totalBudget = formData.get('totalBudget') as string
  const laborCost = formData.get('laborCost') as string
  const materialCost = formData.get('materialCost') as string
  const outsourceCost = formData.get('outsourceCost') as string
  const equipmentCost = formData.get('equipmentCost') as string
  const otherCost = formData.get('otherCost') as string
  const indirectCostRate = formData.get('indirectCostRate') as string
  const sellingAdminCostRate = formData.get('sellingAdminCostRate') as string

  await prisma.budget.create({
    data: {
      projectId,
      type,
      totalBudget: parseFloat(totalBudget) || 0,
      laborCost: laborCost ? parseFloat(laborCost) : null,
      materialCost: materialCost ? parseFloat(materialCost) : null,
      outsourceCost: outsourceCost ? parseFloat(outsourceCost) : null,
      equipmentCost: equipmentCost ? parseFloat(equipmentCost) : null,
      otherCost: otherCost ? parseFloat(otherCost) : null,
      indirectCostRate: indirectCostRate ? parseFloat(indirectCostRate) : 0,
      sellingAdminCostRate: sellingAdminCostRate ? parseFloat(sellingAdminCostRate) : 0,
    }
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function updateBudgetWithProfitLoss(id: string, projectId: string, formData: FormData) {
  const type = formData.get('type') as string
  const totalBudget = formData.get('totalBudget') as string
  const laborCost = formData.get('laborCost') as string
  const materialCost = formData.get('materialCost') as string
  const outsourceCost = formData.get('outsourceCost') as string
  const equipmentCost = formData.get('equipmentCost') as string
  const otherCost = formData.get('otherCost') as string
  const indirectCostRate = formData.get('indirectCostRate') as string
  const sellingAdminCostRate = formData.get('sellingAdminCostRate') as string
  const actualCost = formData.get('actualCost') as string

  await prisma.budget.update({
    where: { id },
    data: {
      type,
      totalBudget: parseFloat(totalBudget) || 0,
      laborCost: laborCost ? parseFloat(laborCost) : null,
      materialCost: materialCost ? parseFloat(materialCost) : null,
      outsourceCost: outsourceCost ? parseFloat(outsourceCost) : null,
      equipmentCost: equipmentCost ? parseFloat(equipmentCost) : null,
      otherCost: otherCost ? parseFloat(otherCost) : null,
      indirectCostRate: indirectCostRate ? parseFloat(indirectCostRate) : 0,
      sellingAdminCostRate: sellingAdminCostRate ? parseFloat(sellingAdminCostRate) : 0,
      actualCost: actualCost ? parseFloat(actualCost) : 0,
    }
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function calculateProfitLoss(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      budgets: { orderBy: { createdAt: 'desc' }, take: 1 },
      finance: true
    }
  })

  if (!project || project.budgets.length === 0) {
    return null
  }

  const budget = project.budgets[0]
  
  const contractAmount = project.contractAmount || 0
  
  const totalCost = (budget.laborCost || 0) + 
                   (budget.materialCost || 0) + 
                   (budget.outsourceCost || 0) + 
                   (budget.equipmentCost || 0) + 
                   (budget.otherCost || 0)
  
  const indirectCost = totalCost * (budget.indirectCostRate / 100)
  const sellingAdminCost = totalCost * (budget.sellingAdminCostRate / 100)
  
  const totalExecutionCost = totalCost + indirectCost + sellingAdminCost
  
  const operatingProfit = contractAmount - totalExecutionCost
  const profitRate = contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0

  return {
    contractAmount,
    totalBudget: budget.totalBudget,
    totalCost,
    indirectCost,
    sellingAdminCost,
    totalExecutionCost,
    operatingProfit,
    profitRate
  }
}
