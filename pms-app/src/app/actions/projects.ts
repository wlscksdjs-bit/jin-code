'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CreateProjectSchema, UpdateProjectSchema } from '@/lib/schemas'

export async function createProject(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateProjectSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.project.create({
    data: {
      code: validated.data.code,
      name: validated.data.name,
      type: validated.data.type,
      status: validated.data.status,
      contractType: validated.data.contractType || null,
      customerId: validated.data.customerId || null,
      contractAmount: validated.data.contractAmount || null,
      estimatedBudget: validated.data.estimatedBudget || null,
      startDate: validated.data.startDate || null,
      endDate: validated.data.endDate || null,
      contractDate: validated.data.contractDate || null,
      location: validated.data.location || null,
      address: validated.data.address || null,
      description: validated.data.description || null,
    },
  })

  revalidatePath('/projects')
}

export async function updateProject(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateProjectSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.project.update({
    where: { id },
    data: {
      name: validated.data.name,
      type: validated.data.type,
      status: validated.data.status,
      contractType: validated.data.contractType || null,
      customerId: validated.data.customerId || null,
      contractAmount: validated.data.contractAmount || null,
      estimatedBudget: validated.data.estimatedBudget || null,
      startDate: validated.data.startDate || null,
      endDate: validated.data.endDate || null,
      contractDate: validated.data.contractDate || null,
      location: validated.data.location || null,
      address: validated.data.address || null,
      description: validated.data.description || null,
    },
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
}

export async function deleteProject(id: string) {
  await prisma.project.delete({
    where: { id },
  })

  revalidatePath('/projects')
}
