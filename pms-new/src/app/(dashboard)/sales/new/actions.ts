'use server'

import { redirect } from 'next/navigation'
import { createSales } from '@/app/actions/sales'

export async function submitSalesAction(formData: FormData) {
  const data = {
    title: formData.get('title') as string,
    type: formData.get('type') as string || 'BIDDING',
    status: 'DRAFT' as const,
    bidNumber: formData.get('bidNumber') as string || undefined,
    bidAmount: parseFloat(formData.get('bidAmount') as string) || 0,
    contractAmount: 0,
    winProbability: parseFloat(formData.get('winProbability') as string) || undefined,
    bidOpenDate: formData.get('bidOpenDate') as string || undefined,
    customerId: formData.get('customerId') as string || undefined,
    description: formData.get('description') as string || undefined,
  }
  const sales = await createSales(data)
  redirect('/sales')
}
