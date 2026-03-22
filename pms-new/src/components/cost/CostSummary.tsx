'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CostSummaryProps {
  contractAmount: number
  directCosts: {
    materialCost: number
    laborCost: number
    outsourceFabrication: number
    outsourceService: number
  }
  indirectCosts: {
    consumableOther: number
    consumableSafety: number
    travelExpense: number
    insuranceWarranty: number
    dormitoryCost: number
    miscellaneous: number
    paymentFeeOther: number
    rentalForklift: number
    rentalOther: number
    vehicleRepair: number
    vehicleFuel: number
    vehicleOther: number
    welfareBusiness: number
    reserveFund: number
    indirectCost: number
  }
  sellingAdminRate: number
}

export function CostSummary({ contractAmount, directCosts, indirectCosts, sellingAdminRate }: CostSummaryProps) {
  const directTotal = directCosts.materialCost + directCosts.laborCost + 
    directCosts.outsourceFabrication + directCosts.outsourceService
  
  const indirectTotal = indirectCosts.consumableOther + indirectCosts.consumableSafety +
    indirectCosts.travelExpense + indirectCosts.insuranceWarranty + indirectCosts.dormitoryCost +
    indirectCosts.miscellaneous + indirectCosts.paymentFeeOther + indirectCosts.rentalForklift +
    indirectCosts.rentalOther + indirectCosts.vehicleRepair + indirectCosts.vehicleFuel +
    indirectCosts.vehicleOther + indirectCosts.welfareBusiness + indirectCosts.reserveFund +
    indirectCosts.indirectCost
  
  const totalManufacturingCost = directTotal + indirectTotal
  const sellingAdminCost = totalManufacturingCost * (sellingAdminRate / 100)
  const totalCost = totalManufacturingCost + sellingAdminCost
  const grossProfit = contractAmount - totalManufacturingCost
  const profitRate = contractAmount > 0 ? (grossProfit / contractAmount) * 100 : 0

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  return (
    <Card>
      <CardHeader>
        <CardTitle>원가 요약</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">계약금액</p>
            <p className="text-lg font-bold">{fmt(contractAmount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">직접비 합계</p>
            <p className="text-lg font-bold text-blue-600">{fmt(directTotal)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">간접비 합계</p>
            <p className="text-lg font-bold text-orange-600">{fmt(indirectTotal)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">총제조원가</p>
            <p className="text-lg font-bold">{fmt(totalManufacturingCost)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">판관비 ({sellingAdminRate}%)</p>
            <p className="text-lg font-bold text-purple-600">{fmt(sellingAdminCost)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">총원가</p>
            <p className="text-lg font-bold text-red-600">{fmt(totalCost)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">매출이익</p>
            <p className={`text-lg font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(grossProfit)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">이익률</p>
            <p className={`text-lg font-bold ${profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
