'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createComponentOrder(formData: FormData) {
  const wbsItemId = formData.get('wbsItemId') as string
  const componentName = formData.get('componentName') as string
  const vendor = formData.get('vendor') as string
  const orderDate = formData.get('orderDate') as string
  const deliveryDate = formData.get('deliveryDate') as string
  const status = formData.get('status') as string
  const quantity = formData.get('quantity') as string
  const unitCost = formData.get('unitCost') as string

  const totalCost = (quantity ? parseInt(quantity) : 1) * (unitCost ? parseFloat(unitCost) : 0)

  await prisma.componentOrder.create({
    data: {
      wbsItemId,
      componentName,
      vendor: vendor || null,
      orderDate: orderDate ? new Date(orderDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      status: status || 'ORDERED',
      quantity: quantity ? parseInt(quantity) : 1,
      unitCost: unitCost ? parseFloat(unitCost) : null,
      totalCost: totalCost || null,
    },
  })

  // Get projectId to revalidate path
  const wbsItem = await prisma.wbsItem.findUnique({
    where: { id: wbsItemId },
    select: { projectId: true }
  })

  if (wbsItem) {
    revalidatePath(`/projects/${wbsItem.projectId}`)
  }
}

export async function updateComponentOrder(id: string, formData: FormData) {
  const wbsItemId = formData.get('wbsItemId') as string
  const componentName = formData.get('componentName') as string
  const vendor = formData.get('vendor') as string
  const orderDate = formData.get('orderDate') as string
  const deliveryDate = formData.get('deliveryDate') as string
  const status = formData.get('status') as string
  const quantity = formData.get('quantity') as string
  const unitCost = formData.get('unitCost') as string

  const totalCost = (quantity ? parseInt(quantity) : 1) * (unitCost ? parseFloat(unitCost) : 0)

  await prisma.componentOrder.update({
    where: { id },
    data: {
      componentName,
      vendor: vendor || null,
      orderDate: orderDate ? new Date(orderDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      status: status || 'ORDERED',
      quantity: quantity ? parseInt(quantity) : 1,
      unitCost: unitCost ? parseFloat(unitCost) : null,
      totalCost: totalCost || null,
    },
  })

  const wbsItem = await prisma.wbsItem.findUnique({
    where: { id: wbsItemId },
    select: { projectId: true }
  })

  if (wbsItem) {
    revalidatePath(`/projects/${wbsItem.projectId}`)
  }
}

export async function deleteComponentOrder(id: string, wbsItemId: string) {
  await prisma.componentOrder.delete({
    where: { id },
  })

  const wbsItem = await prisma.wbsItem.findUnique({
    where: { id: wbsItemId },
    select: { projectId: true }
  })

  if (wbsItem) {
    revalidatePath(`/projects/${wbsItem.projectId}`)
  }
}
