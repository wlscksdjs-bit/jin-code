import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { OrderDetail } from '@/components/orders/order-detail'
import { Package } from 'lucide-react'

async function getOrder(id: string) {
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
    },
  })
}

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    redirect('/orders')
  }

  return (
    <div className="p-6">
      <OrderDetail order={{
        ...order,
        orderDate: order.orderDate.toISOString(),
        requiredDate: order.requiredDate?.toISOString() || null,
        deliveryDate: order.deliveryDate?.toISOString() || null,
      }} />
    </div>
  )
}
