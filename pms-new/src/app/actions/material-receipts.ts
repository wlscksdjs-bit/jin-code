'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const receiptItemSchema = z.object({
  itemName: z.string(),
  specification: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  amount: z.number(),
})

const receiptSchema = z.object({
  purchaseOrderId: z.string().min(1),
  receiptDate: z.string(),
  receivedBy: z.string().optional(),
  items: z.array(receiptItemSchema),
  notes: z.string().optional(),
})

export async function listMaterialReceipts(purchaseOrderId?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.materialReceipt.findMany({
    where: purchaseOrderId ? { purchaseOrderId } : {},
    include: { purchaseOrder: { include: { vendor: true, project: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getMaterialReceipt(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.materialReceipt.findUnique({
    where: { id },
    include: {
      purchaseOrder: { include: { vendor: true, project: true, items: true } },
      costActual: true,
    },
  })
}

export async function createMaterialReceipt(data: z.infer<typeof receiptSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const parsed = receiptSchema.parse(data)

  const count = await prisma.materialReceipt.count()
  const receiptNumber = `RCV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const subtotal = parsed.items.reduce((s, i) => s + i.amount, 0)
  const tax = Math.round(subtotal * 0.1)
  const totalAmount = subtotal + tax

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: parsed.purchaseOrderId },
    include: { items: true },
  })

  let costActualId: string | null = null
  if (po) {
    const project = await prisma.project.findUnique({
      where: { id: po.projectId },
      select: { contractAmount: true },
    })

    const materialCost = totalAmount
    const sellingAdminRate = 12
    const totalManufacturingCost = materialCost
    const sellingAdminCost = totalManufacturingCost * (sellingAdminRate / 100)
    const grossProfit = (project?.contractAmount ?? 0) - totalManufacturingCost
    const operatingProfit = grossProfit - sellingAdminCost
    const profitRate = (project?.contractAmount ?? 0) > 0 ? (operatingProfit / (project!.contractAmount)) * 100 : 0

    const ca = await prisma.costActual.create({
      data: {
        projectId: po.projectId,
        type: 'PURCHASE',
        asOfDate: new Date(parsed.receiptDate),
        contractAmount: project?.contractAmount ?? 0,
        materialCost,
        totalExpense: materialCost,
        totalManufacturingCost,
        sellingAdminCost,
        grossProfit,
        operatingProfit,
        profitRate,
      },
    })

    for (const item of parsed.items) {
      await prisma.costActualItem.create({
        data: {
          costActualId: ca.id,
          categoryType: 'MATERIAL',
          amount: item.amount,
          description: item.specification ?? item.itemName,
        },
      })
    }

    costActualId = ca.id
  }

  const receipt = await prisma.materialReceipt.create({
    data: {
      receiptNumber,
      purchaseOrderId: parsed.purchaseOrderId,
      receiptDate: new Date(parsed.receiptDate),
      receivedBy: parsed.receivedBy,
      itemsJson: JSON.stringify(parsed.items),
      subtotal,
      tax,
      totalAmount,
      status: 'COMPLETE',
      notes: parsed.notes,
      costActualId,
    },
    include: { purchaseOrder: { include: { vendor: true } } },
  })

  if (po) {
    await prisma.purchaseOrder.update({
      where: { id: parsed.purchaseOrderId },
      data: { status: 'PARTIAL' },
    })
    revalidatePath(`/projects/${po.projectId}`)
  }
  revalidatePath('/receipts')
  return receipt
}

export async function listPurchaseOrderItems(purchaseOrderId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.purchaseOrderItem.findMany({
    where: { purchaseOrderId },
    orderBy: { createdAt: 'asc' },
  })
}
