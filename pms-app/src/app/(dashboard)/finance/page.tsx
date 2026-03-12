import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStatusColor, formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Wallet, PiggyBank, AlertCircle } from 'lucide-react'

async function getFinanceData() {
  const [finance, projectFinance, projectTotals] = await Promise.all([
    prisma.finance.findMany({
      include: {
        project: { select: { code: true, name: true } },
      },
      orderBy: { occurDate: 'desc' },
      take: 50,
    }),
    prisma.finance.groupBy({
      by: ['type'],
      _sum: { amount: true },
    }),
    prisma.finance.groupBy({
      by: ['projectId', 'type'],
      _sum: { amount: true },
    })
  ])

  return { finance, projectFinance, projectTotals }
}

const CATEGORY_LABELS: Record<string, string> = {
  SALES: '매출',
  CONSTRUCTION_COST: '시공비',
  MATERIAL: '자재비',
  LABOR: '인건비',
  OUTSOURCE: '외주비',
  EQUIPMENT: '장비비',
  OTHER: '기타',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  CONFIRMED: '확정',
  PAID: '지급완료',
  CANCELLED: '취소',
}

export default async function FinancePage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const { finance, projectFinance, projectTotals } = await getFinanceData()
  
  const revenueTotal = projectFinance
    .filter(p => p.type === 'REVENUE')
    .reduce((sum, p) => sum + (p._sum.amount || 0), 0)
  
  const costTotal = projectFinance
    .filter(p => p.type === 'COST')
    .reduce((sum, p) => sum + (p._sum.amount || 0), 0)
  
  const profit = revenueTotal - costTotal
  const profitMargin = revenueTotal > 0 ? Math.round((profit / revenueTotal) * 100) : 0

  const projectData = projectTotals.reduce((acc: Record<string, { revenue: number; cost: number; name: string; profit: number }>, item) => {
    if (!item.projectId) return acc
    if (!acc[item.projectId]) {
      const project = finance.find(f => f.projectId === item.projectId)?.project
      acc[item.projectId] = { revenue: 0, cost: 0, name: project?.name || '-', profit: 0 }
    }
    if (item.type === 'REVENUE') {
      acc[item.projectId].revenue += item._sum.amount || 0
    } else {
      acc[item.projectId].cost += item._sum.amount || 0
    }
    acc[item.projectId].profit = acc[item.projectId].revenue - acc[item.projectId].cost
    return acc
  }, {})

  const projectList = Object.entries(projectData)
    .map(([projectId, data]) => ({
      projectId,
      ...data,
      profit: data.revenue - data.cost,
      margin: data.revenue > 0 ? Math.round((data.profit / data.revenue) * 100) : 0
    }))
    .sort((a, b) => b.profit - a.profit)

  const categoryBreakdown = finance.reduce((acc: Record<string, { revenue: number; cost: number }>, item) => {
    const cat = CATEGORY_LABELS[item.category] || item.category
    if (!acc[cat]) {
      acc[cat] = { revenue: 0, cost: 0 }
    }
    if (item.type === 'REVENUE') {
      acc[cat].revenue += item.amount
    } else {
      acc[cat].cost += item.amount
    }
    return acc
  }, {})

  const topCategories = Object.entries(categoryBreakdown)
    .map(([category, data]) => ({ category, ...data, total: data.revenue + data.cost }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">손익관리</h1>
          <p className="text-slate-500">수익(매출) - 원가(비용) = 손익</p>
        </div>
      </div>

      {/* Summary Cards - Clear Layout */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1 text-green-700">
              <ArrowUpRight className="w-4 h-4" />
              총 매출 (수입)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(revenueTotal)}</div>
            <p className="text-xs text-green-600">프로젝트에서 발생한 매출</p>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1 text-red-700">
              <ArrowDownRight className="w-4 h-4" />
              총 원가 (지출)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(costTotal)}</div>
            <p className="text-xs text-red-600">시공/자재/인건비 등</p>
          </CardContent>
        </Card>
        
        <Card className={`${profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm flex items-center gap-1 ${profit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {profit >= 0 ? <PiggyBank className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {profit >= 0 ? '총 이익' : '총 손실'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatCurrency(Math.abs(profit))}
            </div>
            <p className={`text-xs ${profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              매출 - 원가
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Wallet className="w-4 h-4" />
              이익률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin}%
            </div>
            <p className="text-xs text-slate-500">
              {profitMargin >= 0 ? '양호' : '주의'} (기준 10% 이상)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              원가율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 10 ? 'text-green-600' : profitMargin >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {100 - profitMargin}%
            </div>
            <p className="text-xs text-slate-500">
              {profitMargin >= 10 ? '양호' : profitMargin >= 0 ? '보통' : '초과'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit/Loss Bar */}
      {revenueTotal > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">손익 구조</span>
              <span className="text-sm font-bold">{profitMargin}% 이익률</span>
            </div>
            <div className="h-8 flex rounded overflow-hidden">
              <div 
                className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${profitMargin}%` }}
              >
                이익 {profitMargin}%
              </div>
              <div 
                className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${100 - profitMargin}%` }}
              >
                원가 {100 - profitMargin}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project-level P&L */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            프로젝트별 손익
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">프로젝트</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-green-600">매출 (수입)</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-red-600">원가 (지출)</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">손익</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">이익률</th>
                </tr>
              </thead>
              <tbody>
                {projectList.map((p) => (
                  <tr key={p.projectId} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link href={`/projects/${p.projectId}`} className="hover:underline font-medium">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-medium">
                      {formatCurrency(p.cost)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${p.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {p.profit >= 0 ? '+' : ''}{formatCurrency(p.profit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.margin >= 15 ? 'bg-green-100 text-green-700' :
                        p.margin >= 5 ? 'bg-blue-100 text-blue-700' :
                        p.margin >= 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {p.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
                {projectList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      데이터가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
              {projectList.length > 0 && (
                <tfoot className="font-bold bg-slate-50">
                  <tr>
                    <td className="py-3 px-4">합계</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(revenueTotal)}</td>
                    <td className="py-3 px-4 text-right text-red-600">{formatCurrency(costTotal)}</td>
                    <td className={`py-3 px-4 text-right ${profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {formatCurrency(profit)}
                    </td>
                    <td className="py-3 px-4 text-center">{profitMargin}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              카테고리별 발생액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topCategories.map((item) => (
                <div key={item.category} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div>
                    <div className="text-sm font-medium">{item.category}</div>
                  </div>
                  <div className="text-right">
                    {item.revenue > 0 && (
                      <div className="text-xs text-green-600">+{formatCurrency(item.revenue)}</div>
                    )}
                    {item.cost > 0 && (
                      <div className="text-xs text-red-600">-{formatCurrency(item.cost)}</div>
                    )}
                  </div>
                </div>
              ))}
              {topCategories.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">데이터가 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              손익 상태 가이드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="text-sm">
                <span className="font-medium">양호 (15% 이상)</span>
                <p className="text-xs text-slate-500">정상적인 수익 구조</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div className="text-sm">
                <span className="font-medium">보통 (5% ~ 15%)</span>
                <p className="text-xs text-slate-500">개선 필요</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="text-sm">
                <span className="font-medium">주의 (0% ~ 5%)</span>
                <p className="text-xs text-slate-500">손실 위험</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="text-sm">
                <span className="font-medium">위험 (0% 미만)</span>
                <p className="text-xs text-slate-500">즉시 조치가 필요</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>최근 거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">구분</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">프로젝트</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">분류</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">항목</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">상태</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">금액</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">발생일</th>
                </tr>
              </thead>
              <tbody>
                {finance.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.type === 'REVENUE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.type === 'REVENUE' ? '수입' : '지출'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/projects/${item.projectId}`} className="hover:underline">
                        {item.project.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm">{CATEGORY_LABELS[item.category] || item.category}</td>
                    <td className="py-3 px-4 text-sm">{item.description || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs">
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      item.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.type === 'REVENUE' ? '+' : '-'}{formatCurrency(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {formatDate(item.occurDate)}
                    </td>
                  </tr>
                ))}
                {finance.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      거래 내역이 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
