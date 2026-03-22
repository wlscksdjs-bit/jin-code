'use server'

import { redirect } from 'next/navigation'
import { createCostEstimate, updateCostEstimate } from '@/app/actions/cost-estimates'

export async function submitCostEstimate(formData: FormData, projectId: string, id?: string) {
  const data: Record<string, number | string> = {
    projectId,
    title: formData.get('title') as string,
    version: formData.get('version') as string || '1.0',
    status: formData.get('status') as string || 'DRAFT',
    contractAmount: parseFloat(formData.get('contractAmount') as string) || 0,
    sellingAdminRate: parseFloat(formData.get('sellingAdminRate') as string) || 12,
  }

  const costKeys = [
    'materialCost', 'laborCost', 'outsourceFabrication', 'outsourceService',
    'consumableOther', 'consumableSafety', 'travelExpense', 'insuranceWarranty',
    'dormitoryCost', 'miscellaneous', 'paymentFeeOther', 'rentalForklift',
    'rentalOther', 'vehicleRepair', 'vehicleFuel', 'vehicleOther',
    'welfareBusiness', 'reserveFund', 'indirectCost'
  ]

  for (const key of costKeys) {
    data[key] = parseFloat(formData.get(key) as string) || 0
  }

  if (id) {
    await updateCostEstimate(id, data)
    redirect(`/cost/${projectId}/estimate/${id}`)
  } else {
    const est = await createCostEstimate(data as Parameters<typeof createCostEstimate>[0])
    redirect(`/cost/${projectId}/estimate/${(est as { id: string }).id}`)
  }
}
