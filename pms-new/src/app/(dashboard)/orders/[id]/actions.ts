'use server'

import { redirect } from 'next/navigation'
import { updatePurchaseOrderStatus, deletePurchaseOrder } from '@/app/actions/purchase-orders'

export async function updateStatusAction(id: string, status: string) {
  await updatePurchaseOrderStatus(id, status)
  redirect(`/orders/${id}`)
}

export async function deleteOrderAction(id: string) {
  await deletePurchaseOrder(id)
  redirect('/orders')
}
