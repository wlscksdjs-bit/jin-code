'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

interface ProfitLossData {
  contractAmount: number
  totalBudget: number
  totalCost: number
  indirectCost: number
  sellingAdminCost: number
  totalExecutionCost: number
  operatingProfit: number
  profitRate: number
}

interface ProfitLossCardProps {
  data: ProfitLossData | null
}

export function ProfitLossCard({ data }: ProfitLossCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            손익 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            예산 정보가 없습니다
          </div>
        </CardContent>
      </Card>
    )
  }

  const isProfit = data.operatingProfit >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          손익 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-500">계약금액</div>
            <div className="text-lg font-bold">{data.contractAmount.toLocaleString()}원</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">총 예산</div>
            <div className="text-lg font-bold">{data.totalBudget.toLocaleString()}원</div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">실행원가</span>
            <span>{data.totalCost.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">간접비 ({(data.totalCost > 0 ? (data.indirectCost / data.totalCost * 100) : 0).toFixed(1)}%)</span>
            <span>{data.indirectCost.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">판관비 ({(data.totalCost > 0 ? (data.sellingAdminCost / data.totalCost * 100) : 0).toFixed(1)}%)</span>
            <span>{data.sellingAdminCost.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm font-medium border-t pt-2">
            <span>총 실행원가</span>
            <span>{data.totalExecutionCost.toLocaleString()}원</span>
          </div>
        </div>

        <div className={`border-t pt-4 p-4 rounded-lg ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-medium ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                {isProfit ? '영업이익' : '영업손실'}
              </div>
              <div className={`text-2xl font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                {Math.abs(data.operatingProfit).toLocaleString()}원
              </div>
            </div>
            <div className={`flex items-center gap-1 ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
              {isProfit ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              <span className="text-lg font-bold">{Math.abs(data.profitRate).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
