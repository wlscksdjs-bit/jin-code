'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'

export async function createUser(formData: FormData) {
  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const department = formData.get('department') as string
  const position = formData.get('position') as string
  const phone = formData.get('phone') as string

  const hashedPassword = await hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: role || 'PM',
      department: department || null,
      position: position || null,
      phone: phone || null,
    },
  })

  revalidatePath('/settings')
}

export async function updateUser(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const department = formData.get('department') as string
  const position = formData.get('position') as string
  const phone = formData.get('phone') as string
  const isActive = formData.get('isActive') === 'true'

  await prisma.user.update({
    where: { id },
    data: {
      name,
      role,
      department: department || null,
      position: position || null,
      phone: phone || null,
      isActive,
    },
  })

  revalidatePath('/settings')
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } })
  revalidatePath('/settings')
}

export async function updatePassword(id: string, formData: FormData) {
  const newPassword = formData.get('newPassword') as string
  
  const hashedPassword = await hash(newPassword, 12)

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  })

  revalidatePath('/settings')
}
