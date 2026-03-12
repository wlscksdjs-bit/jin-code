import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Calculator, TrendingUp, TrendingDown, Minus, PieChart, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, CheckCircle } from 'lucide-react'

async function getBudgetData() {
  const budgets = await prisma.budget.findMany({
    include: {
      project: { select: { code: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const totals = await prisma.budget.aggregate({
    _sum: { 
      totalBudget: true, 
      actualCost: true,
    },
  })

  return { budgets, totals }
}

function calculateItemStats(item: { plannedAmount: number; previousAmount: number; currentAmount: number }) {
  const planned = item.plannedAmount || 0
  const previous = item.previousAmount || 0
  const current = item.currentAmount || 0
  const actual = previous + current
  const variance = planned - actual
  const rate = planned > 0 ? (actual / planned) * 100 : 0
  
  return { planned, previous, current, actual, variance, rate }
}

export default async function BudgetPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const { budgets, totals } = await getBudgetData()
  
  const totalPlanned = totals._sum.totalBudget || 0
  const totalActual = totals._sum.actualCost || 0
  const totalVariance = totalPlanned - totalActual
  const totalRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0

  const totalPrevious = budgets.reduce((sum, b) => sum + b.items.reduce((s, i) => s + (i.previousAmount || 0), 0), 0)
  const totalCurrent = budgets.reduce((sum, b) => sum + b.items.reduce((s, i) => s + (i.currentAmount || 0), 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">예산관리</h1>
          <p className="text-slate-500">예산 수립 및 실행 현황</p>
        </div>
        <Link href="/budget/new">
          <Button>
            <Calculator className="w-4 h-4 mr-2" />
            새 예산
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              예정 (예산)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalPlanned)}</div>
            <p className="text-xs text-slate-500">총 예산</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              기실행
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(totalPrevious)}
            </div>
            <p className="text-xs text-slate-500">이전 실행분</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              금번실행
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(totalCurrent)}
            </div>
            <p className="text-xs text-slate-500">이번 실행분</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              실행총액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalActual)}</div>
            <p className="text-xs text-slate-500">기실행 + 금번실행</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              {totalVariance >= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {totalVariance >= 0 ? '절감' : '초과'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totalVariance))}
            </div>
            <p className="text-xs text-slate-500">
              {totalRate.toFixed(1)}%執行
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">전체 예산 실행률</span>
            <span className="text-sm font-bold">{totalRate.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                totalRate > 100 ? 'bg-red-500' :
                totalRate > 90 ? 'bg-orange-500' :
                totalRate > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(totalRate, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Budget List with Details */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트별 예산 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {budgets.map((budget) => {
              const budgetPlanned = budget.totalBudget || 0
              const budgetPrevious = budget.items.reduce((sum, i) => sum + (i.previousAmount || 0), 0)
              const budgetCurrent = budget.items.reduce((sum, i) => sum + (i.currentAmount || 0), 0)
              const budgetActual = budgetPrevious + budgetCurrent
              const budgetVariance = budgetPlanned - budgetActual
              const budgetRate = budgetPlanned > 0 ? (budgetActual / budgetPlanned) * 100 : 0
              
              return (
                <div key={budget.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-50 p-4 flex items-center justify-between">
                    <div>
                      <Link href={`/projects/${budget.projectId}`} className="font-medium hover:underline">
                        {budget.project?.name || '-'}
                      </Link>
                      <p className="text-xs text-slate-500">{budget.project?.code || '-'} · {budget.type}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">실행률</p>
                        <p className={`font-bold ${
                          budgetRate > 100 ? 'text-red-600' :
                          budgetRate > 90 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {budgetRate.toFixed(1)}%
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b">
                          <th className="text-left py-2">품목</th>
                          <th className="text-right py-2">분류</th>
                          <th className="text-right py-2">예정</th>
                          <th className="text-right py-2 text-blue-600">기실행</th>
                          <th className="text-right py-2 text-green-600">금번실행</th>
                          <th className="text-right py-2">실행총액</th>
                          <th className="text-right py-2">실행률</th>
                          <th className="text-right py-2">절감/초과</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budget.items.length > 0 ? budget.items.map((item) => {
                          const stats = calculateItemStats(item)
                          return (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="py-2 text-sm">
                                <div>{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-slate-400">{item.description}</div>
                                )}
                              </td>
                              <td className="py-2 text-sm text-right">{item.category || '-'}</td>
                              <td className="py-2 text-sm text-right font-medium">{formatCurrency(stats.planned)}</td>
                              <td className="py-2 text-sm text-right text-blue-600">{formatCurrency(stats.previous)}</td>
                              <td className="py-2 text-sm text-right text-green-600">{formatCurrency(stats.current)}</td>
                              <td className="py-2 text-sm text-right font-medium">{formatCurrency(stats.actual)}</td>
                              <td className="py-2 text-sm text-right">
                                <span className={
                                  stats.rate > 100 ? 'text-red-600' :
                                  stats.rate > 90 ? 'text-orange-600' : 'text-green-600'
                                }>
                                  {stats.rate.toFixed(1)}%
                                </span>
                              </td>
                              <td className={`py-2 text-sm text-right ${stats.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.variance >= 0 ? '-' : '+'}{formatCurrency(Math.abs(stats.variance))}
                              </td>
                            </tr>
                          )
                        }) : (
                          <tr>
                            <td colSpan={8} className="py-4 text-center text-slate-500 text-sm">
                              등록된 항목이 없습니다
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold bg-slate-50">
                          <td className="py-2">합계</td>
                          <td></td>
                          <td className="py-2 text-right">{formatCurrency(budgetPlanned)}</td>
                          <td className="py-2 text-right text-blue-600">{formatCurrency(budgetPrevious)}</td>
                          <td className="py-2 text-right text-green-600">{formatCurrency(budgetCurrent)}</td>
                          <td className="py-2 text-right">{formatCurrency(budgetActual)}</td>
                          <td className="py-2 text-right">{budgetRate.toFixed(1)}%</td>
                          <td className={`py-2 text-right ${budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {budgetVariance >= 0 ? '-' : '+'}{formatCurrency(Math.abs(budgetVariance))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )
            })}
            {budgets.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                데이터가 없습니다
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
