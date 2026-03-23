'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BudgetItemData {
  id: string
  name: string
  category?: string | null
  plannedAmount: number
  actualAmount: number
}

interface BudgetData {
  id: string
  totalBudget: number
  materialCost: number
  laborCost: number
  items?: BudgetItemData[]
}

interface CostExecutionItem {
  materialCost: number
  laborCost: number
  outsourceFabrication: number
  outsourceService: number
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

interface BudgetComparisonProps {
  budget: BudgetData
  executions: { data: CostExecutionItem[]; periodYear: number; periodMonth: number }[]
  currentMonth?: { year: number; month: number }
}

const COST_KEYS = [
  { key: 'materialCost', label: '재료비' },
  { key: 'laborCost', label: '노무비' },
  { key: 'outsourceFabrication', label: '외주비(제작)' },
  { key: 'outsourceService', label: '외주비(용역)' },
  { key: 'consumableOther', label: '소모품/기타' },
  { key: 'consumableSafety', label: '안전용품' },
  { key: 'travelExpense', label: '여비교통비' },
  { key: 'insuranceWarranty', label: '보험/보증' },
  { key: 'dormitoryCost', label: '숙소비' },
  { key: 'miscellaneous', label: '잡비' },
  { key: 'paymentFeeOther', label: '지급수수료' },
  { key: 'rentalForklift', label: '장비임대(지게차)' },
  { key: 'rentalOther', label: '장비임대(기타)' },
  { key: 'vehicleRepair', label: '차량수리비' },
  { key: 'vehicleFuel', label: '차량유류비' },
  { key: 'vehicleOther', label: '차량기타' },
  { key: 'welfareBusiness', label: '복리후생' },
  { key: 'reserveFund', label: '예비비' },
  { key: 'indirectCost', label: '간접비' },
]

type BudgetMap = Record<string, { planned: number; used: number; thisMonth: number }>

function calculateBudgetComparison(
  budget: BudgetData,
  executions: BudgetComparisonProps['executions']
): BudgetMap {
  const result: BudgetMap = {}
  
  for (const item of COST_KEYS) {
    result[item.key] = { planned: 0, used: 0, thisMonth: 0 }
  }
  
  for (const item of budget.items || []) {
    const key = COST_KEYS.find(k => k.label === item.name)?.key
    if (key) {
      result[key].planned = item.plannedAmount
    }
  }
  
  if (budget.items?.length === 0) {
    result.materialCost.planned = budget.materialCost
    result.laborCost.planned = budget.laborCost
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  for (const execution of executions) {
    for (const cost of execution.data) {
      for (const item of COST_KEYS) {
        const amount = (cost as Record<string, number>)[item.key] || 0
        result[item.key].used += amount
        
        if (execution.periodYear === currentYear && execution.periodMonth === currentMonth) {
          result[item.key].thisMonth += amount
        }
      }
    }
  }

  return result
}

function getStatus(planned: number, used: number): { label: string; color: string; icon: string } {
  if (planned === 0) return { label: '-', color: 'text-gray-500', icon: '' }
  const ratio = used / planned
  if (ratio < 0.8) return { label: '절감', color: 'text-green-600', icon: '↓' }
  if (ratio > 1) return { label: '초과', color: 'text-red-600', icon: '↑' }
  return { label: '정상', color: 'text-blue-600', icon: '→' }
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

export function BudgetComparison({ budget, executions, currentMonth }: BudgetComparisonProps) {
  const comparison = calculateBudgetComparison(budget, executions)
  
  const totalPlanned = Object.values(comparison).reduce((s, c) => s + c.planned, 0)
  const totalUsed = Object.values(comparison).reduce((s, c) => s + c.used, 0)
  const totalThisMonth = Object.values(comparison).reduce((s, c) => s + c.thisMonth, 0)
  const totalPlannedRemaining = totalPlanned - totalUsed

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>전체 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">계약금액</p>
              <p className="text-lg font-bold">{fmt(budget.totalBudget)}원</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">예산총액</p>
              <p className="text-lg font-bold text-blue-600">{fmt(totalPlanned)}원</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">사용총액</p>
              <p className="text-lg font-bold">{fmt(totalUsed)}원</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">금회사용</p>
              <p className="text-lg font-bold text-purple-600">{fmt(totalThisMonth)}원</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">사용예정</p>
              <p className={`text-lg font-bold ${totalPlannedRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {fmt(Math.abs(totalPlannedRemaining))}원
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>항목별 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">항목</th>
                  <th className="text-right py-2 px-2 font-medium">예산</th>
                  <th className="text-right py-2 px-2 font-medium">사용금액</th>
                  <th className="text-right py-2 px-2 font-medium">금회사용</th>
                  <th className="text-right py-2 px-2 font-medium">예정</th>
                  <th className="text-right py-2 px-2 font-medium">차이</th>
                  <th className="text-center py-2 px-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {COST_KEYS.map((item) => {
                  const data = comparison[item.key]
                  const variance = data.planned - data.used
                  const status = getStatus(data.planned, data.used)
                  
                  return (
                    <tr key={item.key} className="border-b">
                      <td className="py-2 px-2">{item.label}</td>
                      <td className="text-right py-2 px-2 font-mono">{fmt(data.planned)}</td>
                      <td className="text-right py-2 px-2 font-mono">{fmt(data.used)}</td>
                      <td className="text-right py-2 px-2 font-mono text-purple-600">{fmt(data.thisMonth)}</td>
                      <td className={`text-right py-2 px-2 font-mono ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fmt(Math.abs(variance))}
                      </td>
                      <td className={`text-right py-2 px-2 font-mono ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance < 0 ? '+' : '-'}{fmt(Math.abs(variance))}
                      </td>
                      <td className={`text-center py-2 px-2 font-medium ${status.color}`}>
                        {status.icon} {status.label}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2">
                  <td className="py-2 px-2">합계</td>
                  <td className="text-right py-2 px-2">{fmt(totalPlanned)}</td>
                  <td className="text-right py-2 px-2">{fmt(totalUsed)}</td>
                  <td className="text-right py-2 px-2 text-purple-600">{fmt(totalThisMonth)}</td>
                  <td className={`text-right py-2 px-2 ${totalPlannedRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmt(Math.abs(totalPlannedRemaining))}
                  </td>
                  <td className={`text-right py-2 px-2 ${totalPlannedRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalPlannedRemaining < 0 ? '+' : '-'}{fmt(Math.abs(totalPlannedRemaining))}
                  </td>
                  <td className="text-center">
                    {getStatus(totalPlanned, totalUsed).label}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * 차이: (-) 절감 / (+) 초과 | 상태: ↓절감(초록) | →정상(파랑) | ↑초과(빨강)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
