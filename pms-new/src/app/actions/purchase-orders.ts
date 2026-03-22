'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const poItemSchema = z.object({
  itemName: z.string(),
  specification: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  amount: z.number(),
  orderedQuantity: z.number().default(0),
  receivedQuantity: z.number().default(0),
  rejectedQuantity: z.number().default(0),
  remarks: z.string().optional(),
})

const poSchema = z.object({
  projectId: z.string().min(1),
  vendorId: z.string().min(1),
  wbsItemId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  orderDate: z.string(),
  requiredDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(poItemSchema).optional(),
})

export async function listPurchaseOrders(projectId?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.purchaseOrder.findMany({
    where: projectId ? { projectId } : {},
    include: { project: true, vendor: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPurchaseOrder(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      project: true,
      vendor: true,
      wbsItem: true,
      items: true,
      materialReceipts: true,
    },
  })
}

export async function createPurchaseOrder(data: z.infer<typeof poSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const parsed = poSchema.parse(data)

  const count = await prisma.purchaseOrder.count()
  const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const subtotal = parsed.items?.reduce((s, i) => s + i.amount, 0) ?? 0
  const tax = Math.round(subtotal * 0.1)
  const totalAmount = subtotal + tax

  const po = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      projectId: parsed.projectId,
      vendorId: parsed.vendorId,
      wbsItemId: parsed.wbsItemId,
      title: parsed.title,
      description: parsed.description,
      orderDate: new Date(parsed.orderDate),
      requiredDate: parsed.requiredDate ? new Date(parsed.requiredDate) : null,
      notes: parsed.notes,
      subtotal,
      tax,
      totalAmount,
      status: 'DRAFT',
      items: parsed.items ? {
        create: parsed.items.map((item) => ({
          ...item,
          orderedQuantity: item.quantity,
        })),
      } : undefined,
    },
    include: { vendor: true, items: true },
  })

  revalidatePath(`/projects/${parsed.projectId}`)
  revalidatePath('/orders')
  return po
}

export async function updatePurchaseOrder(id: string, data: Partial<z.infer<typeof poSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')

  const parsed = poSchema.partial().parse(data)
  const subtotal = parsed.items?.reduce((s, i) => s + i.amount, 0) ?? existing.subtotal
  const tax = Math.round(subtotal * 0.1)

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      vendorId: parsed.vendorId ?? existing.vendorId,
      wbsItemId: parsed.wbsItemId,
      title: parsed.title ?? existing.title,
      description: parsed.description,
      orderDate: parsed.orderDate ? new Date(parsed.orderDate) : existing.orderDate,
      requiredDate: parsed.requiredDate ? new Date(parsed.requiredDate) : existing.requiredDate,
      notes: parsed.notes,
      subtotal,
      tax,
      totalAmount: subtotal + tax,
    },
    include: { vendor: true, items: true },
  })

  revalidatePath(`/projects/${existing.projectId}`)
  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
  return po
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status },
  })

  revalidatePath(`/projects/${existing.projectId}`)
  revalidatePath('/orders')
  return po
}

export async function deletePurchaseOrder(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')
  await prisma.purchaseOrder.delete({ where: { id } })
  revalidatePath(`/projects/${existing.projectId}`)
  revalidatePath('/orders')
}

export async function listVendors() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
}
export async function listPurchaseOrderItems() { return []; }