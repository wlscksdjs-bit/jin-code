'use server'

import { redirect } from 'next/navigation'
import { createSales } from '@/app/actions/sales'

export async function submitSalesAction(formData: FormData) {
  const data = {
    title: formData.get('title') as string,
    type: (formData.get('type') as string) || 'BIDDING',
    status: (formData.get('status') as string) || 'WAITING',
    progress: parseInt(formData.get('progress') as string) || 0,
    bidNumber: formData.get('bidNumber') as string || undefined,
    bidAmount: parseFloat(formData.get('bidAmount') as string) || 0,
    contractAmount: 0,
    winProbability: parseFloat(formData.get('winProbability') as string) || undefined,
    submissionDate: formData.get('submissionDate') as string || undefined,
    bidOpenDate: formData.get('bidOpenDate') as string || undefined,
    customerId: formData.get('customerId') as string || undefined,
    laborCost: parseFloat(formData.get('laborCost') as string) || 0,
    materialCost: parseFloat(formData.get('materialCost') as string) || 0,
    outsourceCost: parseFloat(formData.get('outsourceCost') as string) || 0,
    equipmentCost: parseFloat(formData.get('equipmentCost') as string) || 0,
    otherCost: parseFloat(formData.get('otherCost') as string) || 0,
    notes: formData.get('notes') as string || undefined,
  }
  const sales = await createSales(data)
  redirect('/sales')
}
