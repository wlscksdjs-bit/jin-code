'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: FormData) {
  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const industry = formData.get('industry') as string
  const contactPerson = formData.get('contactPerson') as string
  const contactPhone = formData.get('contactPhone') as string
  const contactEmail = formData.get('contactEmail') as string
  const address = formData.get('address') as string
  const notes = formData.get('notes') as string

  await prisma.customer.create({
    data: {
      name,
      code,
      industry: industry || null,
      contactPerson: contactPerson || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      address: address || null,
      notes: notes || null,
    },
  })

  revalidatePath('/projects')
  revalidatePath('/sales')
}

export async function updateCustomer(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const industry = formData.get('industry') as string
  const contactPerson = formData.get('contactPerson') as string
  const contactPhone = formData.get('contactPhone') as string
  const contactEmail = formData.get('contactEmail') as string
  const address = formData.get('address') as string
  const notes = formData.get('notes') as string
  const isActive = formData.get('isActive') === 'true'

  await prisma.customer.update({
    where: { id },
    data: {
      name,
      industry: industry || null,
      contactPerson: contactPerson || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      address: address || null,
      notes: notes || null,
      isActive,
    },
  })

  revalidatePath('/projects')
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } })
  revalidatePath('/projects')
}
