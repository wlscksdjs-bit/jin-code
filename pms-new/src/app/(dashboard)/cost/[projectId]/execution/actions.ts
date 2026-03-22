'use server'

import { redirect } from 'next/navigation'
import { createCostExecution, updateCostExecution } from '@/app/actions/cost-executions'

const DIRECT_COST_KEYS = [
  'materialCost', 'laborCost', 'outsourceFabrication', 'outsourceService'
] as const

const INDIRECT_COST_KEYS = [
  'consumableOther', 'consumableSafety', 'travelExpense', 'insuranceWarranty',
  'dormitoryCost', 'miscellaneous', 'paymentFeeOther', 'rentalForklift',
  'rentalOther', 'vehicleRepair', 'vehicleFuel', 'vehicleOther',
  'welfareBusiness', 'reserveFund', 'indirectCost'
] as const

const ALL_COST_KEYS = [...DIRECT_COST_KEYS, ...INDIRECT_COST_KEYS] as const

export async function submitCostExecution(formData: FormData, projectId: string, id?: string) {
  const data: Record<string, number | string> = {
    projectId,
    periodYear: parseInt(formData.get('periodYear') as string),
    periodMonth: parseInt(formData.get('periodMonth') as string),
    status: formData.get('status') as string || 'DRAFT',
    contractAmount: parseFloat(formData.get('contractAmount') as string) || 0,
    sellingAdminRate: parseFloat(formData.get('sellingAdminRate') as string) || 12,
  }

  for (const key of ALL_COST_KEYS) {
    data[key] = parseFloat(formData.get(key) as string) || 0
  }

  const fabVendorsJson = formData.get('fabricationVendors') as string
  const svcVendorsJson = formData.get('serviceVendors') as string
  
  if (fabVendorsJson) {
    try {
      const fabVendors = JSON.parse(fabVendorsJson)
      data.outsourceFabrication = fabVendors.reduce((sum: number, v: { amount: number }) => sum + v.amount, 0)
    } catch {}
  }
  
  if (svcVendorsJson) {
    try {
      const svcVendors = JSON.parse(svcVendorsJson)
      data.outsourceService = svcVendors.reduce((sum: number, v: { amount: number }) => sum + v.amount, 0)
    } catch {}
  }

  if (id) {
    await updateCostExecution(id, data as Parameters<typeof updateCostExecution>[1])
    redirect(`/cost/${projectId}/execution/${id}`)
  } else {
    const exec = await createCostExecution(data as Parameters<typeof createCostExecution>[0])
    redirect(`/cost/${projectId}/execution/${(exec as { id: string }).id}`)
  }
}

export { DIRECT_COST_KEYS, INDIRECT_COST_KEYS, ALL_COST_KEYS }
