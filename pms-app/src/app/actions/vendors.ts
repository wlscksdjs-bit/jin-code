'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface CreateVendorInput {
  name: string
  code?: string
  category?: string
  businessNumber?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  description?: string
}

export interface UpdateVendorInput extends CreateVendorInput {
  id: string
  isActive?: boolean
}

export async function createVendor(input: CreateVendorInput) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    return { success: false, error: '권한이 없습니다.' }
  }

  try {
    const vendorCode = input.code || `VND-${Date.now().toString(36).toUpperCase()}`

    const vendor = await prisma.vendor.create({
      data: {
        name: input.name,
        code: vendorCode,
        category: input.category || 'MATERIAL',
        businessNumber: input.businessNumber,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        address: input.address,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountHolder: input.accountHolder,
        description: input.description,
      },
    })

    revalidatePath('/vendors')
    return { success: true, vendor }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: '이미 존재하는 거래처 코드입니다.' }
    }
    return { success: false, error: '거래처 생성 중 오류가 발생했습니다.' }
  }
}

export async function updateVendor(input: UpdateVendorInput) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    return { success: false, error: '권한이 없습니다.' }
  }

  try {
    const vendor = await prisma.vendor.update({
      where: { id: input.id },
      data: {
        name: input.name,
        code: input.code,
        category: input.category,
        businessNumber: input.businessNumber,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        address: input.address,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountHolder: input.accountHolder,
        description: input.description,
        isActive: input.isActive,
      },
    })

    revalidatePath('/vendors')
    revalidatePath(`/vendors/${vendor.id}`)
    return { success: true, vendor }
  } catch (error) {
    return { success: false, error: '거래처 수정 중 오류가 발생했습니다.' }
  }
}

export async function deleteVendor(id: string) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'ADMIN 권한이 필요합니다.' }
  }

  try {
    const orderCount = await prisma.purchaseOrder.count({
      where: { vendorId: id },
    })

    if (orderCount > 0) {
      return { success: false, error: `삭제 불가: ${orderCount}개의 발주서가 연결되어 있습니다.` }
    }

    await prisma.vendor.delete({ where: { id } })
    revalidatePath('/vendors')
    return { success: true }
  } catch (error) {
    return { success: false, error: '거래처 삭제 중 오류가 발생했습니다.' }
  }
}

export async function getVendors(options?: { includeInactive?: boolean }) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  const where = options?.includeInactive ? {} : { isActive: true }

  return prisma.vendor.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  })
}

export async function getVendor(id: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  return prisma.vendor.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          project: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  })
}
