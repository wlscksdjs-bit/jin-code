'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { broadcast } from '@/lib/sse-broadcast'
import { invalidateDashboard } from './dashboard'

export interface CreatePurchaseOrderInput {
  projectId: string
  vendorId: string
  title: string
  description?: string
  orderDate: Date
  requiredDate?: Date
  notes?: string
  items: Array<{
    itemName: string
    specification?: string
    unit?: string
    quantity: number
    unitPrice: number
  }>
}

export interface UpdatePurchaseOrderInput {
  id: string
  title?: string
  description?: string
  requiredDate?: Date
  deliveryDate?: Date
  notes?: string
  status?: string
}

export interface ReceiveOrderItemInput {
  itemId: string
  quantity: number
  rejected?: boolean
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    return { success: false, error: '권한이 없습니다.' }
  }

  try {
    const orderCount = await prisma.purchaseOrder.count()
    const orderNumber = `PO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`

    const subtotal = input.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0)
    const tax = Math.round(subtotal * 0.1)
    const totalAmount = subtotal + tax

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        projectId: input.projectId,
        vendorId: input.vendorId,
        title: input.title,
        description: input.description,
        orderDate: input.orderDate,
        requiredDate: input.requiredDate,
        notes: input.notes,
        subtotal,
        tax,
        totalAmount,
        status: 'DRAFT',
        items: {
          create: input.items.map((item, idx) => ({
            itemName: item.itemName,
            specification: item.specification,
            unit: item.unit || 'EA',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            orderedQuantity: item.quantity,
          })),
        },
      },
      include: {
        vendor: true,
        project: { select: { id: true, name: true, code: true } },
        items: true,
      },
    })

    revalidatePath('/orders')
    revalidatePath(`/projects/${input.projectId}`)
    return { success: true, order }
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return { success: false, error: '발주서 생성 중 오류가 발생했습니다.' }
  }
}

export async function updatePurchaseOrder(input: UpdatePurchaseOrderInput) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    return { success: false, error: '권한이 없습니다.' }
  }

  try {
    const order = await prisma.purchaseOrder.update({
      where: { id: input.id },
      data: {
        title: input.title,
        description: input.description,
        requiredDate: input.requiredDate,
        deliveryDate: input.deliveryDate,
        notes: input.notes,
        status: input.status,
      },
      include: {
        vendor: true,
        project: { select: { id: true, name: true, code: true } },
        items: true,
      },
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${order.id}`)
    revalidatePath(`/projects/${order.projectId}`)
    return { success: true, order }
  } catch (error) {
    return { success: false, error: '발주서 수정 중 오류가 발생했습니다.' }
  }
}

export async function sendPurchaseOrder(orderId: string) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    return { success: false, error: '권한이 없습니다.' }
  }

  try {
    const order = await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: 'SENT' },
      include: {
        project: { select: { id: true, name: true } },
      },
    })

    await prisma.notification.create({
      data: {
        type: 'PROJECT_UPDATE',
        title: '발주서 발송',
        message: `"${order.title}" 발주서가 발송되었습니다.`,
        userId: session.user.id,
        link: `/orders/${order.id}`,
      },
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath(`/projects/${order.projectId}`)
    return { success: true, order }
  } catch (error) {
    return { success: false, error: '발주서 발송 중 오류가 발생했습니다.' }
  }
}

export async function receivePurchaseOrder(
  orderId: string,
  items: ReceiveOrderItemInput[]
) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    return { success: false, error: '권한이 없습니다.' }
  }

  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        project: { select: { id: true, name: true, code: true } },
        items: true,
        vendor: { select: { id: true, name: true, category: true } },
      },
    })
    if (!order) return { success: false, error: '발주서를 찾을 수 없습니다.' }

    const receivedItemDetails: Array<{
      itemId: string; itemName: string; specification: string | null;
      unit: string; quantity: number; unitPrice: number; amount: number;
    }> = []

    for (const itemInput of items) {
      const item = await prisma.purchaseOrderItem.findUnique({
        where: { id: itemInput.itemId },
      })
      if (!item) continue

      const receivedQty = itemInput.rejected
        ? item.receivedQuantity
        : item.receivedQuantity + itemInput.quantity
      const rejectedQty = itemInput.rejected
        ? item.rejectedQuantity + itemInput.quantity
        : item.rejectedQuantity

      await prisma.purchaseOrderItem.update({
        where: { id: itemInput.itemId },
        data: {
          receivedQuantity: receivedQty,
          rejectedQuantity: rejectedQty,
          status: receivedQty >= item.orderedQuantity ? 'RECEIVED' : 'PARTIAL',
        },
      })

      if (!itemInput.rejected) {
        receivedItemDetails.push({
          itemId: item.id,
          itemName: item.itemName,
          specification: item.specification,
          unit: item.unit,
          quantity: itemInput.quantity,
          unitPrice: item.unitPrice,
          amount: itemInput.quantity * item.unitPrice,
        })
      }
    }

    const allItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: orderId },
    })
    const allReceived = allItems.every(item =>
      item.receivedQuantity >= item.orderedQuantity
    )
    const someReceived = allItems.some(item =>
      item.receivedQuantity > 0
    )
    const newStatus = allReceived ? 'RECEIVED' : someReceived ? 'PARTIAL' : 'SENT'

    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        deliveryDate: newStatus === 'RECEIVED' ? new Date() : undefined,
      },
    })

      if (receivedItemDetails.length > 0) {
      const subtotal = receivedItemDetails.reduce((s, i) => s + i.amount, 0)
      const tax = Math.round(subtotal * 0.1)
      const totalAmount = subtotal + tax

      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      let execution = await prisma.costExecution.findFirst({
        where: {
          projectId: order.projectId,
          periodYear: year,
          periodMonth: month,
        },
      })

      if (!execution) {
        execution = await prisma.costExecution.create({
          data: {
            projectId: order.projectId,
            periodYear: year,
            periodMonth: month,
            type: 'MONTHLY',
            status: 'APPROVED',
            materialCost: 0,
            totalExpense: 0,
            totalDirectCost: 0,
            totalManufacturingCost: 0,
            contractAmount: order.totalAmount,
          },
        })
      }

      const costActual = await prisma.costActual.create({
        data: {
          projectId: order.projectId,
          type: 'RECEIPT',
          asOfDate: now,
          contractAmount: order.totalAmount,
          materialCost: subtotal,
          totalExpense: totalAmount,
          totalDirectCost: subtotal,
          totalManufacturingCost: totalAmount,
          sellingAdminRate: 12,
          sellingAdminCost: Math.round(totalAmount * 0.12),
          grossProfit: order.totalAmount - totalAmount,
          operatingProfit: order.totalAmount - totalAmount - Math.round(totalAmount * 0.12),
          items: {
            create: receivedItemDetails.map(detail => ({
              categoryType: 'MATERIAL',
              costType: 'ACTUAL',
              amount: detail.amount,
              description: `${detail.itemName}${detail.specification ? ` (${detail.specification})` : ''} × ${detail.quantity}${detail.unit}`,
            })),
          },
        },
      })

      const receiptCount = await prisma.materialReceipt.count()
      const receiptNumber = `MR-${year}-${String(receiptCount + 1).padStart(4, '0')}`

      await prisma.materialReceipt.create({
        data: {
          receiptNumber,
          purchaseOrderId: orderId,
          receiptDate: now,
          receivedBy: session.user.name || session.user.id,
          itemsJson: JSON.stringify(receivedItemDetails),
          subtotal,
          tax,
          totalAmount,
          status: allReceived ? 'COMPLETE' : 'PARTIAL',
          costActualId: costActual.id,
        },
      })

      await prisma.project.update({
        where: { id: order.projectId },
        data: {
          totalCashOutflow: { increment: totalAmount },
          currentCashBalance: { decrement: totalAmount },
        },
      })

      broadcast('project', {
        type: 'MATERIAL_RECEIVED',
        projectId: order.projectId,
        data: {
          orderId,
          orderNumber: order.orderNumber,
          receiptNumber,
          amount: totalAmount,
          materialCost: subtotal,
          vendorName: order.vendor.name,
        },
      })
    }

    await prisma.notification.create({
      data: {
        type: 'PROJECT_UPDATE',
        title: '자재 입고',
        message: `"${order.title}" 자재가 입고되었습니다.`,
        userId: session.user.id,
        link: `/orders/${order.id}`,
      },
    })

    if (receivedItemDetails.length > 0) {
      await invalidateDashboard(order.projectId)
    }

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath(`/projects/${order.projectId}`)
    revalidatePath('/cost/monthly')
    return { success: true, order }
  } catch (error) {
    console.error('Error in receivePurchaseOrder:', error)
    return { success: false, error: '입고 처리 중 오류가 발생했습니다.' }
  }
}

export async function deletePurchaseOrder(orderId: string) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: '인증되지 않았습니다.' }
  }

  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'ADMIN 권한이 필요합니다.' }
  }

  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return { success: false, error: '발주서를 찾을 수 없습니다.' }
    }

    if (order.status !== 'DRAFT') {
      return { success: false, error: '발송된 발주서는 삭제할 수 없습니다.' }
    }

    await prisma.purchaseOrder.delete({ where: { id: orderId } })
    revalidatePath('/orders')
    return { success: true }
  } catch (error) {
    return { success: false, error: '발주서 삭제 중 오류가 발생했습니다.' }
  }
}

export async function getPurchaseOrders(options?: {
  projectId?: string
  vendorId?: string
  status?: string
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  const where: any = {}
  if (options?.projectId) where.projectId = options.projectId
  if (options?.vendorId) where.vendorId = options.vendorId
  if (options?.status) where.status = options.status

  return prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      vendor: { select: { id: true, name: true, category: true } },
      project: { select: { id: true, name: true, code: true } },
      items: true,
    },
  })
}

export async function getPurchaseOrder(id: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      project: {
        select: { id: true, name: true, code: true, status: true },
      },
      items: {
        orderBy: { createdAt: 'asc' },
      },
      wbsItem: {
        select: { id: true, name: true, code: true },
      },
    },
  })
}

export async function getPurchaseOrderStats(projectId?: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  const where = projectId ? { projectId } : {}

  const [total, draft, sent, partial, received] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.count({ where: { ...where, status: 'DRAFT' } }),
    prisma.purchaseOrder.count({ where: { ...where, status: 'SENT' } }),
    prisma.purchaseOrder.count({ where: { ...where, status: 'PARTIAL' } }),
    prisma.purchaseOrder.count({ where: { ...where, status: 'RECEIVED' } }),
  ])

  const totalAmount = await prisma.purchaseOrder.aggregate({
    where,
    _sum: { totalAmount: true, paidAmount: true },
  })

  return {
    total,
    draft,
    sent,
    partial,
    received,
    totalAmount: totalAmount._sum.totalAmount || 0,
    paidAmount: totalAmount._sum.paidAmount || 0,
  }
}
