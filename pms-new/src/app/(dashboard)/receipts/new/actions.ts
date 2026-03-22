'use server'

import { redirect } from 'next/navigation'
import { createMaterialReceipt, listPurchaseOrderItems } from '@/app/actions/material-receipts'

export async function submitReceipt(formData: FormData, poId: string) {
  if (!poId) throw new Error('No purchase order')

  const itemCount = parseInt(formData.get('itemCount') as string) || 0
  const items = []
  for (let i = 0; i < itemCount; i++) {
    const qty = parseFloat(formData.get(`item_qty_${i}`) as string) || 0
    if (qty > 0) {
      items.push({
        itemName: formData.get(`item_name_${i}`) as string,
        specification: formData.get(`item_spec_${i}`) as string,
        unit: formData.get(`item_unit_${i}`) as string,
        quantity: qty,
        unitPrice: parseFloat(formData.get(`item_price_${i}`) as string) || 0,
        amount: qty * (parseFloat(formData.get(`item_price_${i}`) as string) || 0),
      })
    }
  }

  const data = {
    purchaseOrderId: poId,
    receiptDate: formData.get('receiptDate') as string,
    receivedBy: formData.get('receivedBy') as string,
    items,
  }
  await createMaterialReceipt(data)
  redirect('/receipts')
}
