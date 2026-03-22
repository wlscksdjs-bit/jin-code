'use server'

import { redirect } from 'next/navigation'
import { createCostExecution, updateCostExecution } from '@/app/actions/cost-executions'

export async function submitCostExecution(formData: FormData, projectId: string, id?: string) {
  const data: Record<string, number | string> = {
    projectId,
    periodYear: parseInt(formData.get('periodYear') as string),
    periodMonth: parseInt(formData.get('periodMonth') as string),
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
    await updateCostExecution(id, data as Parameters<typeof updateCostExecution>[1])
    redirect(`/cost/${projectId}/execution/${id}`)
  } else {
    const exec = await createCostExecution(data as Parameters<typeof createCostExecution>[0])
    redirect(`/cost/${projectId}/execution/${(exec as { id: string }).id}`)
  }
}
