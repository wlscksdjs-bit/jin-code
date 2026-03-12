'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateBudgetItemSchema, UpdateBudgetItemSchema } from '@/lib/schemas'

export async function createBudgetItem(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateBudgetItemSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.budgetItem.create({
    data: {
      budgetId: validated.data.budgetId,
      wbsCode: validated.data.wbsCode || null,
      name: validated.data.name,
      category: validated.data.category || null,
      plannedAmount: validated.data.plannedAmount,
      previousAmount: validated.data.previousAmount || 0,
      currentAmount: validated.data.currentAmount || 0,
      actualAmount: (validated.data.previousAmount || 0) + (validated.data.currentAmount || 0),
      sortOrder: validated.data.sortOrder || 0,
      description: validated.data.description || null,
    },
  })

  revalidatePath('/budget')
}

export async function updateBudgetItem(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateBudgetItemSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  const previousAmount = validated.data.previousAmount || 0
  const currentAmount = validated.data.currentAmount || 0
  
  await prisma.budgetItem.update({
    where: { id },
    data: {
      wbsCode: validated.data.wbsCode || null,
      name: validated.data.name,
      category: validated.data.category || null,
      plannedAmount: validated.data.plannedAmount,
      previousAmount,
      currentAmount,
      actualAmount: previousAmount + currentAmount,
      sortOrder: validated.data.sortOrder || 0,
      description: validated.data.description || null,
    },
  })

  revalidatePath('/budget')
}

export async function deleteBudgetItem(id: string) {
  await prisma.budgetItem.delete({
    where: { id },
  })

  revalidatePath('/budget')
}
