'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

export function CostSummary({
  contractAmount,
  directCosts,
  indirectCosts,
  sellingAdminRate,
}: CostSummaryProps) {
  // 직접비 합계
  const directTotal =
    directCosts.materialCost +
    directCosts.laborCost +
    directCosts.outsourceFabrication +
    directCosts.outsourceService

  // 간접비 합계
  const indirectTotal = Object.values(indirectCosts).reduce((acc, val) => acc + val, 0)

  // 총제조원가
  const totalManufacturingCost = directTotal + indirectTotal

  // 판관비 (일반적으로 도급금액 기준 또는 제조원가 기준이나, 여기서는 도급금액 기준으로 계산)
  const sellingAdminCost = contractAmount * (sellingAdminRate / 100)

  // 총원가
  const totalCost = totalManufacturingCost + sellingAdminCost

  // 매출이익
  const grossProfit = contractAmount - totalCost

  // 이익률
  const profitRate = contractAmount > 0 ? (grossProfit / contractAmount) * 100 : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatPercent = (rate: number) => {
    return rate.toFixed(2) + '%'
  }

  const isPositive = grossProfit >= 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold">원가 요약 (Cost Summary)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-sm text-gray-500">직접비 합계</span>
              <span className="font-medium">{formatCurrency(directTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-sm text-gray-500">간접비 합계</span>
              <span className="font-medium">{formatCurrency(indirectTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-sm text-gray-500 font-semibold">총제조원가</span>
              <span className="font-bold">{formatCurrency(totalManufacturingCost)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-sm text-gray-500">판관비 ({sellingAdminRate}%)</span>
              <span className="font-medium">{formatCurrency(sellingAdminCost)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-sm text-gray-500 font-semibold">총원가</span>
              <span className="font-bold">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-sm text-gray-500">도급금액</span>
              <span className="font-medium">{formatCurrency(contractAmount)}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 mb-1">매출이익 (Gross Profit)</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatCurrency(grossProfit)}
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500 mb-1">이익률 (Profit Rate)</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatPercent(profitRate)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

